const fs = require('node:fs');
const path = require('node:path');

const digits = {
    '0': ['M 310 770 C 173 770 101 663 101 510 L 101 350 C 101 193 176 95 310 95 C 447 95 520 198 520 350 L 520 510 C 520 662 442 770 310 770 Z'],
    '1': ['M 185 622 Q 265 665 328 765 L 328 98'],
    '2': ['M 107 631 C 148 714 222 765 322 765 C 443 765 514 688 514 588 C 514 484 427 412 331 333 C 248 265 174 199 122 104 L 432 104 Q 487 106 521 131'],
    '3': ['M 104 672 C 156 729 233 765 323 765 C 451 765 508 693 508 606 C 508 516 437 446 321 446 L 270 446 M 316 446 C 445 446 529 378 529 275 C 529 159 439 95 310 95 C 217 95 146 130 98 189'],
    '4': ['M 414 764 L 95 295 L 529 295 M 424 760 L 424 102'],
    '5': ['M 496 762 L 156 762 L 139 439 C 196 480 243 500 315 500 C 447 500 525 424 525 301 C 525 171 441 96 311 96 C 213 96 146 134 100 194'],
    '6': ['M 473 712 Q 411 772 327 772 C 182 772 103 629 103 424 L 103 325 C 103 176 179 96 310 96 C 436 96 519 176 519 300 C 519 418 439 495 327 495 C 218 495 139 441 104 351'],
    '7': ['M 103 763 L 523 763 C 434 604 271 354 227 103'],
    '8': ['M 312 450 C 193 450 122 517 122 609 C 122 701 197 770 312 770 C 430 770 504 707 504 609 C 504 518 429 450 312 450 Z M 312 450 C 445 450 533 380 533 270 C 533 165 449 95 312 95 C 172 95 90 166 90 270 C 90 377 173 450 312 450 Z'],
    '9': ['M 138 151 Q 204 96 292 96 C 439 96 518 236 518 442 L 518 546 C 518 695 440 772 310 772 C 187 772 102 692 102 571 C 102 450 179 375 295 375 C 405 375 484 431 517 515'],
};

function centerlines(data) {
    const tokens = data.split(' ');
    const lines = [];
    let line;
    let current;
    let index = 0;
    const readPoint = () => [Number(tokens[index++]), Number(tokens[index++])];
    const add = (point) => { line.points.push(point); current = point; };
    while (index < tokens.length) {
        const op = tokens[index++];
        if (op === 'M') {
            line = { points: [], closed: false };
            lines.push(line);
            add(readPoint());
        } else if (op === 'L') {
            add(readPoint());
        } else if (op === 'Z') {
            line.closed = true;
            const first = line.points[0];
            if (first[0] === current[0] && first[1] === current[1]) line.points.pop();
        } else {
            const start = current;
            const a = readPoint();
            const b = readPoint();
            const c = op === 'C' ? readPoint() : undefined;
            for (let step = 1; step <= 12; step++) {
                const t = step / 12;
                const u = 1 - t;
                add([0, 1].map((axis) => c
                    ? u ** 3 * start[axis] + 3 * u ** 2 * t * a[axis] + 3 * u * t ** 2 * b[axis] + t ** 3 * c[axis]
                    : u ** 2 * start[axis] + 2 * u * t * a[axis] + t ** 2 * b[axis]));
            }
        }
    }
    return lines;
}

function normal(from, to) {
    const x = to[0] - from[0];
    const y = to[1] - from[1];
    const d = Math.hypot(x, y);
    return [-y / d, x / d];
}

function around(center, dx, dy, steps, sweep) {
    const radius = Math.hypot(dx, dy);
    const start = Math.atan2(dy, dx);
    return Array.from({ length: steps }, (_, i) => {
        const angle = start + sweep * (i + 1) / (steps + 1);
        return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
    });
}

function stroke(line, halfWidth) {
    const points = line.points;
    const last = points.length - 1;
    const offsets = points.map((point, index) => {
        const prev = index === 0 && !line.closed ? normal(point, points[1])
            : normal(points[(index + last) % points.length], point);
        const next = index === last && !line.closed ? prev
            : normal(point, points[(index + 1) % points.length]);
        const sum = [prev[0] + next[0], prev[1] + next[1]];
        const length = Math.hypot(...sum);
        const miter = Math.max(.72, length / 2);
        return sum.map((component) => component * halfWidth / (length * miter));
    });
    const left = points.map((p, i) => [p[0] + offsets[i][0], p[1] + offsets[i][1]]);
    const right = points.map((p, i) => [p[0] - offsets[i][0], p[1] - offsets[i][1]]).reverse();
    if (line.closed) return [left, right];
    const finish = around(points[last], ...offsets[last], 7, -Math.PI);
    const begin = around(points[0], -offsets[0][0], -offsets[0][1], 7, -Math.PI);
    return [left.concat(finish, right, begin)];
}

function glyph(outlines, advance) {
    const contours = outlines.map((line) => line.map((p) => p.map(Math.round)));
    const points = contours.flat();
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const box = points.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] : [0, 0, 0, 0];
    if (!points.length) return { contours, points, box, advance, data: Buffer.alloc(0) };
    const buf = Buffer.alloc(12 + contours.length * 2 + points.length * 5);
    buf.writeInt16BE(contours.length, 0);
    box.forEach((value, index) => buf.writeInt16BE(value, 2 + index * 2));
    let end = -1;
    contours.forEach((contour, index) => {
        end += contour.length;
        buf.writeUInt16BE(end, 10 + index * 2);
    });
    const offset = 12 + contours.length * 2;
    buf.fill(1, offset, offset + points.length);
    if (contours.length > 1) buf[offset] |= 0x40;
    for (const axis of [0, 1]) {
        let prev = 0;
        points.forEach((point, index) => {
            buf.writeInt16BE(point[axis] - prev, offset + points.length + (points.length * axis + index) * 2);
            prev = point[axis];
        });
    }
    return { contours, points, box, advance, data: buf };
}

function nameTable() {
    const names = [[1, 'BigFish Tide'], [2, 'Regular'], [4, 'BigFish Tide Regular'], [5, 'Version 1.0'], [6, 'BigFishTide-Regular']];
    const strings = names.map(([, text]) => Buffer.from(text, 'utf16le').swap16());
    const header = Buffer.alloc(6 + names.length * 12);
    header.writeUInt16BE(names.length, 2);
    header.writeUInt16BE(header.length, 4);
    let offset = 0;
    names.forEach(([id], i) => {
        [3, 1, 0x0409, id, strings[i].length, offset].forEach((value, j) => header.writeUInt16BE(value, 6 + i * 12 + j * 2));
        offset += strings[i].length;
    });
    return Buffer.concat([header, ...strings]);
}

function tablesFor(glyphs) {
    const glyfParts = glyphs.map(({ data }) => Buffer.concat([data, Buffer.alloc((4 - data.length % 4) % 4)]));
    const loca = Buffer.alloc(4 * (glyphs.length + 1));
    glyfParts.forEach((part, i) => loca.writeUInt32BE(loca.readUInt32BE(i * 4) + part.length, (i + 1) * 4));

    const head = Buffer.alloc(54);
    head.writeUInt32BE(0x10000, 0);
    head.writeUInt32BE(0x10000, 4);
    head.writeUInt32BE(0x5F0F3CF5, 12);
    head.writeUInt16BE(1000, 18);
    head.writeBigUInt64BE(3879705600n, 20);
    head.writeBigUInt64BE(3879705600n, 28);
    [0, 0, 620, 850].forEach((value, i) => head.writeInt16BE(value, 36 + 2 * i));
    head.writeUInt16BE(7, 46);
    head.writeInt16BE(2, 48);
    head.writeInt16BE(1, 50);

    const hhea = Buffer.alloc(36);
    hhea.writeUInt32BE(0x10000, 0);
    [880, -120, 0, 620, 0, 0, 620, 1].forEach((value, i) => hhea.writeInt16BE(value, 4 + 2 * i));
    hhea.writeUInt16BE(glyphs.length, 34);

    const hmtx = Buffer.alloc(glyphs.length * 4);
    glyphs.forEach((g, i) => {
        hmtx.writeUInt16BE(g.advance, 4 * i);
        hmtx.writeInt16BE(g.box[0], 4 * i + 2);
    });

    const maxp = Buffer.alloc(32);
    maxp.writeUInt32BE(0x10000, 0);
    maxp.writeUInt16BE(glyphs.length, 4);
    maxp.writeUInt16BE(Math.max(...glyphs.map((g) => g.points.length)), 6);
    maxp.writeUInt16BE(Math.max(...glyphs.map((g) => g.contours.length)), 8);
    maxp.writeUInt16BE(1, 14);

    const cmap = Buffer.alloc(52);
    cmap.writeUInt16BE(1, 2);
    [3, 1, 0, 12].forEach((v, i) => cmap.writeUInt16BE(v, 4 + 2 * i));
    [4, 40, 0, 6, 4, 1, 2, 0x20, 0x3A, 0xFFFF, 0, 0x20, 0x30, 0xFFFF, 1 - 0x20, 2 - 0x30, 1, 0, 0, 0]
        .forEach((v, i) => cmap.writeUInt16BE(v & 0xFFFF, 12 + 2 * i));

    const os2 = Buffer.alloc(78);
    os2.writeInt16BE(560, 2);
    os2.writeUInt16BE(500, 4);
    os2.writeUInt16BE(5, 6);
    os2.writeUInt32BE(1, 42);
    os2.write('BFSH', 58, 'ascii');
    os2.writeUInt16BE(0x40, 62);
    os2.writeUInt16BE(0x20, 64);
    os2.writeUInt16BE(0x3A, 66);
    os2.writeInt16BE(880, 68);
    os2.writeInt16BE(-120, 70);
    os2.writeUInt16BE(880, 74);
    os2.writeUInt16BE(120, 76);

    const post = Buffer.alloc(32);
    post.writeUInt32BE(0x30000, 0);
    post.writeInt16BE(-100, 8);
    post.writeInt16BE(45, 10);
    return { cmap, glyf: Buffer.concat(glyfParts), head, hhea, hmtx, loca, maxp, name: nameTable(), 'OS/2': os2, post };
}

function checksum(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 4) {
        let word = 0;
        for (let j = 0; j < 4; j++) word = (word << 8) | (buffer[i + j] ?? 0);
        sum = (sum + (word >>> 0)) >>> 0;
    }
    return sum;
}

function renderFont(tables) {
    const tags = Object.keys(tables).sort();
    const power = 2 ** Math.floor(Math.log2(tags.length));
    const header = Buffer.alloc(12 + tags.length * 16);
    header.writeUInt32BE(0x00010000, 0);
    [tags.length, power * 16, Math.log2(power), (tags.length - power) * 16]
        .forEach((v, i) => header.writeUInt16BE(v, 4 + 2 * i));
    const full = [header];
    let offset = header.length;
    let headOffset = 0;
    tags.forEach((tag, i) => {
        const data = tables[tag];
        const record = 12 + i * 16;
        header.write(tag, record, 'ascii');
        header.writeUInt32BE(checksum(data), record + 4);
        header.writeUInt32BE(offset, record + 8);
        header.writeUInt32BE(data.length, record + 12);
        if (tag === 'head') headOffset = offset;
        const pad = Buffer.alloc((4 - data.length % 4) % 4);
        full.push(data, pad);
        offset += data.length + pad.length;
    });
    const result = Buffer.concat(full);
    result.writeUInt32BE((0xB1B0AFBA - checksum(result)) >>> 0, headOffset + 8);
    return result;
}

const glyphs = [glyph([], 620), glyph([], 220)];
for (let i = 0; i < 10; i++) {
    const outlines = digits[i].flatMap(centerlines).flatMap((line) => stroke(line, 48));
    glyphs.push(glyph(outlines, 620));
}
const colon = [284, 558].flatMap((y) => stroke({ points: [[132, y], [166, y + 27]], closed: false }, 40));
glyphs.push(glyph(colon, 298));

const font = renderFont(tablesFor(glyphs));
if (checksum(font) !== 0xB1B0AFBA) throw new Error('Invalid checksum');
const output = process.argv[2] || path.join(__dirname, '组件', 'res', 'font', 'bigfish_tide.ttf');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, font);
console.log(output + ' (' + font.length + ' bytes)');
