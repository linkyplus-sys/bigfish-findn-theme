const fs = require('node:fs');

function readVarint(buffer, offset) {
  let value = 0n;
  for (let shift = 0n; offset < buffer.length && shift < 64n; shift += 7n) {
    const byte = buffer[offset++];
    value |= BigInt(byte & 127) << shift;
    if (!(byte & 128)) return [value, offset];
  }
  throw new Error('无法读取样式中的 varint。');
}

function varint(number) {
  let value = BigInt(number);
  const bytes = [];
  while (value > 127n) {
    bytes.push(Number(value & 127n) | 128);
    value >>= 7n;
  }
  bytes.push(Number(value));
  return Buffer.from(bytes);
}

function fields(buffer) {
  const result = [];
  for (let offset = 0; offset < buffer.length;) {
    const start = offset;
    const [key, bodyOffset] = readVarint(buffer, offset);
    const tag = Number(key >> 3n);
    const wire = Number(key & 7n);
    offset = bodyOffset;
    let value;
    if (wire === 0) {
      [value, offset] = readVarint(buffer, offset);
    } else if (wire === 2) {
      const [length, dataOffset] = readVarint(buffer, offset);
      offset = dataOffset + Number(length);
      value = buffer.subarray(dataOffset, offset);
    } else if (wire === 1 || wire === 5) {
      offset += wire === 1 ? 8 : 4;
    } else {
      throw new Error(`未知样式字段类型 ${wire}`);
    }
    if (!tag || offset > buffer.length) throw new Error('样式字段越界。');
    result.push({ tag, wire, value, raw: buffer.subarray(start, offset) });
  }
  return result;
}

function message(tag, body) {
  return Buffer.concat([varint(tag * 8 + 2), varint(body.length), body]);
}

function integer(tag, value) {
  return Buffer.concat([varint(tag * 8), varint(value)]);
}

function edit(buffer, transform) {
  return Buffer.concat(fields(buffer).map(field => transform(field) ?? field.raw));
}

function entry(field) {
  const parts = fields(field.value);
  const key = parts.find(part => part.tag === 1);
  const body = parts.find(part => part.tag === 2);
  if (!key || !body) throw new Error('样式索引缺少值。');
  return { id: key.wire === 0 ? Number(key.value) : key.value.toString(), body: body.value };
}

function textures(body, normal, pressed) {
  const names = new Map([['res_btn_1', normal], ['res_btn_2', pressed]]);
  let count = 0;
  const result = edit(body, state => {
    if (![1, 2].includes(state.tag)) return;
    return message(state.tag, edit(state.value, paint => {
      if (paint.tag !== 1) return;
      return message(paint.tag, edit(paint.value, image => {
        if (image.tag !== 2) return;
        const name = names.get(image.value.toString());
        if (!name) return;
        count++;
        return message(image.tag, Buffer.from(name));
      }));
    }));
  });
  if (count !== 2) throw new Error('常态或按下态缺少原始键帽贴图。');
  return result;
}

function candidateInk(body) {
  const saved = fields(body).filter(field => field.tag !== 4 && field.tag !== 5).map(field => field.raw);
  return Buffer.concat([...saved, integer(4, 0xffb4e9f4), integer(5, 0xffdcf8ff)]);
}

function isNumberLabel(id) {
  const localId = id % 10000;
  return localId >= 191 && localId <= 200;
}

function isLetterGroup(id) {
  const localId = id % 10000;
  return localId >= 228 && localId <= 235;
}

function labelStyle(body, id) {
  const number = isNumberLabel(id);
  const size = number ? 24 : 51;
  return edit(body, field => {
    if (field.tag === 3) return integer(3, size);
    if (number && field.tag === 4) return integer(4, 0xffbed7e4);
  });
}

function verticalOffset(body, delta) {
  const parts = fields(body).filter(field => field.tag !== 2).map(field => field.raw);
  const offset = Buffer.alloc(5);
  offset[0] = 2 * 8 + 5;
  offset.writeFloatLE(delta, 1);
  return Buffer.concat([...parts, offset]);
}

function nineKeyCaptions(body, underline, microphone) {
  const parts = fields(body);
  const layers = parts.filter(field => field.tag === 2);
  const anchors = parts.filter(field => field.tag === 3);
  if (layers.length !== anchors.length) return body;

  const ids = layers.map(layer => Number(fields(layer.value).find(field => field.tag === 2)?.value));
  if (!ids.some(isNumberLabel)) return body;
  const anchorAt = new Map([
    ...layers.map((layer, index) => [layer, ids[index]]),
    ...anchors.map((anchor, index) => [anchor, ids[index]]),
  ]);
  return Buffer.concat(parts.flatMap(field => {
    const id = anchorAt.get(field);
    if (underline.has(id)) return [];
    if (field.tag !== 3) return [field.raw];
    if (isNumberLabel(id)) return [message(3, verticalOffset(field.value, -0.245))];
    if (isLetterGroup(id) || id % 10000 === 69) return [message(3, verticalOffset(field.value, 0.054))];
    if (microphone.has(id)) return [message(3, verticalOffset(field.value, 0.105))];
    return [field.raw];
  }));
}

function patch(file) {
  const returnStyleFor = new Map([[10119, 10990], [20119, 20990]]);
  const leadingCandidate = new Set([10210, 20210]);
  const confirmStyles = new Map();
  const source = fs.readFileSync(file);
  const underline = new Set();
  const microphone = new Set();
  for (const field of fields(source).filter(field => field.tag === 1)) {
    const { id, body } = entry(field);
    if (body.includes(Buffer.from('res_space_2'))) underline.add(id);
    if (body.includes(Buffer.from('res_space_voice_1'))) microphone.add(id);
  }
  let candidateCount = 0;
  let returnCount = 0;
  let typographyCount = 0;

  const result = edit(source, field => {
    if (field.tag === 1) {
      const { id, body } = entry(field);
      if (id === 10990 || id === 20990) throw new Error('回车键样式编号已占用。');
      const returnStyle = returnStyleFor.get(id);
      if (!returnStyle) return;
      confirmStyles.set(returnStyle, textures(body, 'bf_enter_idle', 'bf_enter_press'));
      return message(1, Buffer.concat([integer(1, id), message(2, textures(body, 'bf_func_idle', 'bf_func_press'))]));
    }
    if (field.tag === 2) {
      const { id, body } = entry(field);
      if (leadingCandidate.has(id)) {
        candidateCount++;
        return message(2, Buffer.concat([integer(1, id), message(2, candidateInk(body))]));
      }
      if (isNumberLabel(id) || isLetterGroup(id) || id % 10000 === 69) {
        return message(2, Buffer.concat([integer(1, id), message(2, labelStyle(body, id))]));
      }
      return;
    }
    if (field.tag !== 4) return;

    const nineKey = /^(?:py|def|en)_9s?(?:_|$)/.test(entry(field).id);
    return message(4, edit(field.value, layout => {
      if (layout.tag !== 2) return;
      return message(2, edit(layout.value, key => {
        if (key.tag !== 3) return;
        const { id, body } = entry(key);
        let keyStyle = body;
        if (nineKey) {
          keyStyle = nineKeyCaptions(body, underline, microphone);
          if (!keyStyle.equals(body)) typographyCount++;
        }
        if (/^KEY_F39(?:_S\d+)?$/.test(id)) keyStyle = edit(keyStyle, layer => {
          if (layer.tag !== 1) return;
          return message(1, edit(layer.value, reference => {
            if (reference.tag !== 2 || reference.wire !== 0) return;
            returnCount++;
            return integer(2, reference.value >= 20000n ? 20990 : 10990);
          }));
        });
        if (!keyStyle.equals(body)) return message(3, Buffer.concat([message(1, Buffer.from(id)), message(2, keyStyle)]));
      }));
    }));
  });

  if (confirmStyles.size !== 2 || candidateCount !== 2 || !returnCount || !typographyCount) {
    throw new Error('源皮肤缺少横竖屏的功能键、回车键、候选样式或九键排版。');
  }
  const entries = [...confirmStyles].map(([id, body]) => message(1, Buffer.concat([integer(1, id), message(2, body)])));
  fs.writeFileSync(file, Buffer.concat([result, ...entries]));
  console.log(`${file}: ${returnCount} 个回车状态，${candidateCount} 个首选词样式，${typographyCount} 处九键排版调整`);
}

if (process.argv.length !== 4) throw new Error('需要提供横屏和竖屏两份样式配置。');
for (const file of process.argv.slice(2)) patch(file);
