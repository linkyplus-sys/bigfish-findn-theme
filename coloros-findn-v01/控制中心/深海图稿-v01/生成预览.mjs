import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { aliases, controls, firmware, installed, services } from './图形.mjs';

const root = new URL('./', import.meta.url);
const groups = [
  { name: '现用开关', hint: '取自这台 Find N 的快捷开关顺序', rows: installed, category: 'installed' },
  { name: '固件候选', hint: '随系统能力、地区与账户条件显示', rows: firmware, category: 'firmware' },
  { name: '应用开关', hint: '当前设备另外登记的应用快捷服务', rows: services, category: 'services' },
  { name: '面板控件', hint: '滑杆、设置、编辑与媒体播放', rows: controls, category: 'controls' },
];
const all = groups.flatMap(g => g.rows);
const byId = new Map(all.map(row => [row[0], row]));
if (byId.size !== all.length || new Set(all.map(row => row[2])).size !== all.length) {
  throw new Error('Duplicate artwork id or tile spec');
}
for (const target of Object.values(aliases)) {
  if (!byId.has(target)) throw new Error('Missing artwork for tile alias: ' + target);
}

function svg(id, state = 'off', isFile = false) {
  const [, label, , off, on] = byId.get(id);
  const body = state === 'on' && on ? on : off;
  const attributes = isFile ? ' xmlns="http://www.w3.org/2000/svg" width="32" height="32" color="#0D2743"' : ' aria-hidden="true"';
  return `<svg viewBox="0 0 32 32"${attributes}><title>${label}</title>${body}</svg>`;
}
const vectorDir = new URL('./矢量图标/', root);
await mkdir(vectorDir, { recursive: true });
await Promise.all(all.flatMap(([id, , , , on]) => {
  const files = [writeFile(new URL(id + '.svg', vectorDir), svg(id, 'off', true) + '\n')];
  if (on) files.push(writeFile(new URL(id + '-on.svg', vectorDir), svg(id, 'on', true) + '\n'));
  return files;
}));

const items = groups.flatMap(({ rows, category }) => rows.map(([id, label, spec, , on]) => ({
  id, label, spec, category, svg: `矢量图标/${id}.svg`, ...(on ? { on: `矢量图标/${id}-on.svg` } : {}),
})));
await writeFile(new URL('图标清单.json', root), JSON.stringify({
  model: 'PEUM00', firmware: 'PEUM00_14.0.0.2701(CN01)',
  updated: '2026-11-18', artworkCount: all.length, items, aliases,
}, null, 2) + '\n');

const pages = [
  ['cell', 'ring', 'flashlight', 'location', 'airplane', 'rotation', 'windows', 'synergy'],
  ['vibration', 'eye-protect', 'battery', 'dark-mode', 'screenshot', 'screen-record', 'hotspot', 'dnd'],
  ['oshare', 'cast', 'nfc', 'share-screen', 'reverse-charge'],
];
const onAtPreview = new Set(['location', 'rotation', 'vibration', 'flashlight', 'nfc']);
function tile(id) {
  const state = id === 'cell' ? 'unavailable' : onAtPreview.has(id) ? 'on' : 'off';
  const name = id === 'windows' ? '连接至<br>Windows' : byId.get(id)[1];
  return `<div class="quick-tile ${state}"><span class="tile-disk">${svg(id, state)}</span><span>${name}</span></div>`;
}

function phone(theme, label) {
  return `<figure class="device">
    <div class="phone ${theme}">
      <div class="status">${svg('wifi')}<span>100</span></div>
      <header class="phone-head">
        <div><b>16:24</b><p>11月18日 周三</p></div>
        <div class="phone-actions">${svg('settings')}${svg('more')}</div>
      </header>
      <div class="primary">
        <div class="large-card on">${svg('wifi', 'on')}<span>WLAN</span><i>${svg('expand')}</i></div>
        <div class="large-card off">${svg('bluetooth')}<span>蓝牙</span><i>${svg('expand')}</i></div>
        <div class="slider brightness" aria-label="自动亮度">${svg('auto-brightness')}</div>
        <div class="slider volume" aria-label="音量">${svg('volume')}</div>
      </div>
      <div class="quick-pages">${pages.map((list, i) => `<div class="quick-grid" data-page="${i}" ${i ? 'hidden' : ''}>${list.map(tile).join('')}</div>`).join('')}</div>
      <div class="page-dots" aria-label="快捷开关页码">${pages.map((_, i) => `<button type="button" data-page-to="${i}" aria-label="第 ${i + 1} 页" aria-pressed="${i === 0}"></button>`).join('')}</div>
      <div class="device-space">
        <div><b>设备空间</b>${svg('expand')}</div><span class="add-device">${svg('add')}</span><small>添加设备</small>
      </div>
      <span class="gesture"></span>
    </div>
    <figcaption>${label}</figcaption>
  </figure>`;
}

function gallery() {
  return groups.map(({ name, hint, rows }) => `<section class="group">
      <div class="group-title"><h2>${name} <span>${rows.length}</span></h2><p>${hint}</p></div>
      <div class="catalog-grid">${rows.map(([id, label, , , on]) => `<div class="glyph-card">
        <div class="glyph-disk"><span class="image-off">${svg(id)}</span>${on ? `<span class="image-on">${svg(id, 'on')}</span>` : ''}</div>
        <span class="glyph-label">${label}</span>
      </div>`).join('')}</div>
    </section>`).join('');
}

const css = await readFile(new URL('预览样式.css', root), 'utf8');
const scene = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>大肥鱼 · Find N 控制中心图稿</title><style>${css}</style></head><body>
<main>
  <header class="board-head">
    <p class="project">大肥鱼 <span></span> Find N</p>
    <h1>控制中心图稿</h1>
    <p class="board-note">ColorOS 14 · ${all.length} 款单色图形</p>
  </header>
  <section class="panel-preview" aria-label="面板预览">
    <div class="devices">${phone('deep','深海主稿')}${phone('light','浅色对照')}</div>
    <p class="color-note">按 Find N 外屏布局示意 · 实装着色由 ColorOS 控制</p>
  </section>
  <section class="catalog" aria-label="全量图鉴" data-state="off">
    <div class="catalog-tools">
      <h2>全量图鉴</h2>
      <div class="state-buttons"><button type="button" data-state-to="off" aria-pressed="true">常态</button><button type="button" data-state-to="on" aria-pressed="false">强调</button><button type="button" data-state-to="unavailable" aria-pressed="false">不可用</button></div>
    </div>
    ${gallery()}
  </section>
</main>
<script>
const view = new URLSearchParams(location.search).get('view');
if (view === 'panel' || view === 'catalog') document.body.dataset.view = view;
for (const root of document.querySelectorAll('.phone')) {
  const selectors = [...root.querySelectorAll('[data-page-to]')];
  const pages = [...root.querySelectorAll('[data-page]')];
  for (const button of selectors) button.addEventListener('click', () => {
    const next = Number(button.dataset.pageTo);
    pages.forEach((page, index) => { page.hidden = index !== next; });
    selectors.forEach((selector, index) => selector.setAttribute('aria-pressed', String(index === next)));
  });
}
const catalog = document.querySelector('.catalog');
const stateButtons = [...catalog.querySelectorAll('[data-state-to]')];
for (const button of stateButtons) button.addEventListener('click', () => {
  catalog.dataset.state = button.dataset.stateTo;
  stateButtons.forEach(selector => selector.setAttribute('aria-pressed', String(selector === button)));
});
</script></body></html>`;
await writeFile(new URL('控制中心总览.html', root), scene);
console.log(`Exported ${all.length} symbols, ${all.filter(row => row[4]).length} additional state variants and ${Object.keys(aliases).length} aliases.`);
