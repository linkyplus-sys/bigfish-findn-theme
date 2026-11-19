import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { controls, firmware, installed, services } from '../深海图稿-v01/图形.mjs';
import { groups } from './资源映射.mjs';

const stage = resolve(process.argv[2]);
const art = new Map([...installed, ...firmware, ...services, ...controls].map(row => [row[0], row]));
const ns = 'xmlns:android="http://schemas.android.com/apk/res/android"';
const header = '<?xml version="1.0" encoding="utf-8"?>\n';

async function xml(folder, file, contents) {
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, file), header + contents + '\n', 'utf8');
}

function geometry(tag, attrs) {
  if (tag === 'path') return attrs.d;
  if (tag === 'circle') {
    const { cx:x, cy:y, r } = Object.fromEntries(Object.entries(attrs).map(([k,v]) => [k, Number(v)]));
    return `M${x-r},${y}a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0Z`;
  }
  const { x, y, width:w, height:h, rx:r } = Object.fromEntries(Object.entries(attrs).map(([k,v]) => [k, Number(v)]));
  return `M${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h-r}Q${x+w},${y+h} ${x+w-r},${y+h}H${x+r}Q${x},${y+h} ${x},${y+h-r}V${y+r}Q${x},${y} ${x+r},${y}Z`;
}

function attribs(attrs) {
  return Object.entries(attrs).map(([name, value]) => `android:${name}="${value}"`).join(' ');
}

function transforms(value) {
  const result = {};
  const operations = [...value.matchAll(/(translate|scale|rotate)\(([^)]+)\)/g)];
  if (!operations.length) throw new Error('Unsupported SVG transform: ' + value);
  for (const [, operation, params] of operations) {
    const [first, second, third] = params.trim().split(/[ ,]+/);
    if (operation === 'translate') Object.assign(result, { translateX:first, translateY:second ?? '0' });
    if (operation === 'scale') Object.assign(result, { scaleX:first, scaleY:second ?? first });
    if (operation === 'rotate') Object.assign(result, { rotation:first, pivotX:second ?? '0', pivotY:third ?? '0' });
  }
  return result;
}

function paths(fragment, ink) {
  const white = '#FFFFFFFF';
  const fillInk = ink === 'white' ? white : ink === 'black' ? '#FF000000' :
    ink === 'volume' ? '#FF5C5C5C' : '@color/bigfish_qs_neutral';
  const covered = /<(\/?)(path|circle|rect|g)\b([^<>]*)>/g;
  if (fragment.replace(covered, '').trim()) throw new Error('Unexpected SVG content: ' + fragment);
  return [...fragment.matchAll(covered)].map(([, end, tag, markup]) => {
    const attrs = Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,k,v]) => [k,v]));
    const transform = attrs.transform ? attribs(transforms(attrs.transform)) : '';
    if (tag === 'g') return end ? '</group>' : `<group ${transform}>`;
    const path = {
      pathData: geometry(tag, attrs),
      fillColor: attrs.fill === 'currentColor' ? fillInk : '#00000000',
    };
    if (attrs['fill-rule'] === 'evenodd') path.fillType = 'evenOdd';
    if (attrs.stroke || tag === 'rect') {
      Object.assign(path, {
        strokeColor: fillInk, strokeWidth: attrs['stroke-width'] ?? 2.25,
        strokeLineCap: attrs['stroke-linecap'] ?? 'round', strokeLineJoin: attrs['stroke-linejoin'] ?? 'round',
      });
    }
    if (!path.pathData || /undefined|NaN/.test(path.pathData)) throw new Error('Invalid SVG geometry: ' + markup);
    const vectorPath = `<path ${attribs(path)}/>`;
    return transform ? `<group ${transform}>${vectorPath}</group>` : vectorPath;
  }).join('\n');
}

function vector(fragment, { dp = 36, color = 'white', scale = 0.76, alpha = 1, badge }) {
  const plateColor = badge === 'work' ? '#FF607D8B' : `@color/bigfish_qs_badge_${badge}`;
  const plate = badge ? `<path android:pathData="M0,16a16,16 0 1,0 32,0a16,16 0 1,0 -32,0Z" android:fillColor="${plateColor}"/>` : '';
  return `<vector ${ns} android:width="${dp}dp" android:height="${dp}dp" android:viewportWidth="32" android:viewportHeight="32"${alpha !== 1 ? ` android:alpha="${alpha}"` : ''}${color === 'media' ? ' android:tint="@color/bigfish_qs_media"' : ''}>
  ${plate}
  <group android:name="bigfish_motion" android:pivotX="16" android:pivotY="16">
    <group android:pivotX="16" android:pivotY="16" android:scaleX="${scale}" android:scaleY="${scale}">
      ${paths(fragment, color)}
    </group>
  </group>
</vector>`;
}

for (const { target, name, entries } of groups) {
  const folder = join(stage, name);
  const res = join(folder, 'res');
  const draw = join(res, 'drawable');
  const packageName = name === 'Flashlight' ? 'cn.bigfish.findn.qs.flashlight' : `cn.bigfish.findn.qs.${name.toLowerCase()}`;
  const seen = new Set();
  await xml(folder, 'AndroidManifest.xml', `<manifest ${ns} package="${packageName}" android:versionCode="5" android:versionName="2.3">
  <uses-sdk android:minSdkVersion="34" android:targetSdkVersion="34"/>
  <application android:hasCode="false" android:label="BigFish Find N Quick Settings"/>
  <overlay android:targetPackage="${target}" android:isStatic="true" android:priority="50" android:resourcesMap="@xml/overlays"/>
</manifest>`);
  const hasAnimation = entries.some(entry => entry.state.startsWith('anim-'));
  if (hasAnimation) {
    await xml(join(res, 'animator'), 'bigfish_motion.xml', `<set ${ns} android:ordering="together">
  <objectAnimator android:propertyName="scaleX" android:duration="155" android:valueFrom="0.86" android:valueTo="1" android:valueType="floatType" android:interpolator="@android:interpolator/decelerate_quad"/>
  <objectAnimator android:propertyName="scaleY" android:duration="155" android:valueFrom="0.86" android:valueTo="1" android:valueType="floatType" android:interpolator="@android:interpolator/decelerate_quad"/>
</set>`);
  }
  if (entries.some(entry => ['media','neutral'].includes(entry.color))) {
    await xml(join(res, 'values'), 'colors.xml', '<resources><color name="bigfish_qs_neutral">#E6000000</color></resources>');
    await xml(join(res, 'values-night'), 'colors.xml', '<resources><color name="bigfish_qs_neutral">#E6FFFFFF</color></resources>');
    await xml(join(res, 'color'), 'bigfish_qs_media.xml', `<selector ${ns}>
  <item android:state_enabled="false" android:color="@color/bigfish_qs_neutral" android:alpha="0.34"/>
  <item android:color="@color/bigfish_qs_neutral"/>
</selector>`);
  }
  if (entries.some(entry => entry.badge === 'add' || entry.badge === 'remove')) {
    await xml(join(res, 'values'), 'badges.xml', '<resources><color name="bigfish_qs_badge_add">#FF2FB152</color><color name="bigfish_qs_badge_remove">#FF225477</color></resources>');
    await xml(join(res, 'values-night'), 'badges.xml', '<resources><color name="bigfish_qs_badge_add">#FF299947</color><color name="bigfish_qs_badge_remove">#FF225477</color></resources>');
  }
  const maps = [];
  const vectors = new Map();
  for (const entry of entries) {
    if (!art.has(entry.art) || seen.has(entry.target)) throw new Error('Invalid resource mapping: ' + JSON.stringify(entry));
    seen.add(entry.target);
    const [, , , off, on] = art.get(entry.art);
    const isOn = entry.state.endsWith('on');
    const variant = isOn && on ? 'on' : 'off';
    const source = variant === 'on' ? on : off;
    const configs = entry.configs ?? [];
    const key = JSON.stringify([entry.art, variant, entry.dp, entry.color, entry.scale, entry.alpha, entry.badge, configs]);
    let name = vectors.get(key);
    if (!name) {
      name = `bf_${entry.art.replaceAll('-', '_')}_${variant}_${vectors.size + 1}`;
      await xml(draw, name + '.xml', vector(source, entry));
      for (const config of configs) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config) || entry.state.startsWith('anim-')) {
          throw new Error('Unsupported drawable configuration: ' + entry.target + ' ' + config);
        }
        const night = config.split('-').includes('night');
        const options = night && entry.color === 'black' ? { ...entry, color: 'white' } : entry;
        await xml(join(res, 'drawable-' + config), name + '.xml', vector(source, options));
      }
      vectors.set(key, name);
    }
    let value = name;
    if (entry.state.startsWith('anim-')) {
      value = `bf_anim_${entry.target}`;
      await xml(draw, value + '.xml', `<animated-vector ${ns} android:drawable="@drawable/${name}">
  <target android:name="bigfish_motion" android:animation="@animator/bigfish_motion"/>
</animated-vector>`);
    }
    maps.push(`  <item target="drawable/${entry.target}" value="@drawable/${value}"/>`);
  }
  await xml(join(res, 'xml'), 'overlays.xml', '<overlay>\n' + maps.join('\n') + '\n</overlay>');
}

await writeFile(join(stage, 'mapping.json'), JSON.stringify(groups, null, 2) + '\n', 'utf8');
console.log(groups.map(group => group.target + ' ' + group.entries.length).join('\n'));
