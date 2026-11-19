import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const [ffmpeg, resources] = process.argv.slice(2);
if (!ffmpeg || !resources) throw new Error('Pass the FFmpeg path and staging resource directory');

const run = promisify(execFile);
const size = 384;
const frameCount = 40;
const frameMilliseconds = 100;
const drawables = join(resources, 'drawable-nodpi');
const layouts = join(resources, 'layout');
const source = join(drawables, 'whale_reef_peek.png');
const { stdout: portrait } = await run(ffmpeg, [
  '-v', 'error', '-i', source, '-vf', `scale=${size}:${size}:flags=lanczos`,
  '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1',
], { encoding: 'buffer', windowsHide: true, maxBuffer: size * size * 4 + 65536 });
if (portrait.length !== size * size * 4) throw new Error('Invalid source portrait');

function ease(start, end, value) {
  const portion = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return portion * portion * (3 - 2 * portion);
}

const leftHair = new Float32Array(size * size);
const rightHair = new Float32Array(size * size);
const cowlick = new Float32Array(size * size);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const at = y * size + x;
    const artworkX = x * 1254 / size;
    const artworkY = y * 1254 / size;

    // The sweep is entirely outside the face, sleeve and rock. Fade it out
    // before the longer strand passes in front of the rock at the bottom.
    const leftLimit = 375 - 210 * ease(825, 1090, artworkY);
    leftHair[at] = (1 - ease(leftLimit - 85, leftLimit, artworkX))
      * ease(650, 845, artworkY) * (1 - ease(1030, 1100, artworkY));
    rightHair[at] = ease(1060, 1160, artworkX) * ease(555, 625, artworkY)
      * (1 - ease(659, 695, artworkY));

    // Only the loose end above the headband moves. The left shaft and base
    // sit below/left of this field and retain their original pixels.
    cowlick[at] = ease(635, 750, artworkX) * (1 - ease(145, 157, artworkY));
  }
}

function sample(x, y, output, offset) {
  if (x < 0 || y < 0 || x >= size - 1 || y >= size - 1) return;
  const left = Math.floor(x), top = Math.floor(y);
  const dx = x - left, dy = y - top;
  const origin = (top * size + left) * 4;
  const taps = [origin, origin + 4, origin + size * 4, origin + size * 4 + 4];
  const weights = [(1 - dx) * (1 - dy), dx * (1 - dy), (1 - dx) * dy, dx * dy];
  let alpha = 0, red = 0, green = 0, blue = 0;
  for (let i = 0; i < taps.length; i++) {
    const tap = taps[i];
    const coverage = portrait[tap + 3] * weights[i];
    alpha += coverage;
    red += portrait[tap] * coverage;
    green += portrait[tap + 1] * coverage;
    blue += portrait[tap + 2] * coverage;
  }
  if (alpha > 0) {
    output[offset] = Math.round(red / alpha);
    output[offset + 1] = Math.round(green / alpha);
    output[offset + 2] = Math.round(blue / alpha);
    output[offset + 3] = Math.round(alpha);
  }
}

function makeFrame(index) {
  const phase = index * 2 * Math.PI / frameCount;
  const left = Math.sin(phase);
  const right = Math.sin(phase - 0.65);
  const tip = Math.sin(phase + 0.5);
  const output = Buffer.from(portrait);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = y * size + x;
      const dx = leftHair[at] * 10 * left + rightHair[at] * 6 * right + cowlick[at] * 9 * tip;
      const dy = leftHair[at] * 6 * Math.sin(phase - 0.6)
        + rightHair[at] * 3 * right + cowlick[at] * 3 * tip;
      if (dx === 0 && dy === 0) continue;
      const offset = at * 4;
      output.fill(0, offset, offset + 4);
      sample(x - dx, y - dy, output, offset);
    }
  }
  return output;
}

const encode = spawn(ffmpeg, [
  '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba',
  '-video_size', `${size}x${size}`, '-framerate', String(1000 / frameMilliseconds),
  '-i', 'pipe:0', '-c:v', 'libwebp', '-quality', '91', '-start_number', '0',
  join(drawables, 'whale_reef_motion_%02d.webp'),
], { windowsHide: true, stdio: ['pipe', 'ignore', 'inherit'] });
const finished = once(encode, 'close');
for (let index = 0; index < frameCount; index++) {
  if (!encode.stdin.write(makeFrame(index))) await once(encode.stdin, 'drain');
}
encode.stdin.end();
const [exitCode] = await finished;
if (exitCode !== 0) throw new Error('Could not encode reef animation frames');

const baseLayout = await readFile(join(layouts, 'widget_wide.xml'), 'utf8');
const portraitStart = baseLayout.lastIndexOf('    <ImageView');
const imageChildren = Array.from({ length: frameCount }, (_, index) => {
  const image = `whale_reef_motion_${String(index).padStart(2, '0')}`;
  return `        <ImageView android:layout_width="match_parent" android:layout_height="match_parent"
            android:importantForAccessibility="no" android:scaleType="fitCenter" android:src="@drawable/${image}" />`;
}).join('\n');
await writeFile(join(layouts, 'widget_wide_motion.xml'), `${baseLayout.slice(0, portraitStart)}    <ViewFlipper
        android:layout_width="0dp" android:layout_height="match_parent" android:layout_weight="48"
        android:paddingTop="6dp" android:paddingBottom="6dp"
        android:contentDescription="@string/whale_character"
        android:autoStart="true" android:flipInterval="${frameMilliseconds}">
${imageChildren}
    </ViewFlipper>
</LinearLayout>
`);
