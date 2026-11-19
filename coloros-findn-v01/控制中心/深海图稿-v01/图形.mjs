// 单色图形，统一使用 32 × 32 画布。按钮底与状态染色在预览中绘制。
const line = (d, w = 2.25) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fill = d => `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>`;
const dot = (x, y, r = 1.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
const ring = (x, y, r, w = 2.25) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="currentColor" stroke-width="${w}"/>`;
const rect = (x, y, w, h, r = 2.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="currentColor" stroke-width="2.25"/>`;
const tail = fill('M8 11c3.6-.7 6.1.5 8 3.2 1.9-2.7 4.4-3.9 8-3.2-.6 4.1-3.3 7.1-6.8 7.8v4.3h-2.4v-4.3C11.3 18.1 8.6 15.1 8 11Z');
const scan = line('M5 10V7a2 2 0 0 1 2-2h4m10 0h4a2 2 0 0 1 2 2v3m0 12v3a2 2 0 0 1-2 2h-4m-10 0H7a2 2 0 0 1-2-2v-3');
const moon = fill('M25.9 20.7A10.5 10.5 0 0 1 12.4 6.2a10.5 10.5 0 1 0 13.5 14.5Z');
const lantern = fill('M9 9h14c2 0 3 1.1 3 2.8v3.5c0 3.3-2 6.1-5.7 7.6l-1 5a1.7 1.7 0 0 1-1.7 1.4h-3.2a1.7 1.7 0 0 1-1.7-1.4l-1-5C8 21.4 6 18.6 6 15.3v-3.5C6 10.1 7 9 9 9Zm.5 3v1.9h13V12Zm2.9 9.5c.1 1.5 1 2.8 2.7 3.2v1.8h1.8v-1.8c1.7-.4 2.6-1.7 2.7-3.2-1.6-.3-2.7.3-3.6 1.5-.9-1.2-2-1.8-3.6-1.5Z');
const bell = fill('M16 5c4.3 0 7.1 3.2 7.1 7.2 0 5.1 1.7 7.1 3 8.8.7.9.1 2.1-1.3 2.1H7.2c-1.4 0-2-1.2-1.3-2.1 1.3-1.7 3-3.7 3-8.8C8.9 8.2 11.7 5 16 5Zm-5 12.4c1.7-.3 3.6.3 5 1.9 1.4-1.6 3.3-2.2 5-1.9-1.1 2.1-2.8 3.1-5 3.1s-3.9-1-5-3.1Z');
const powerCell = line('M26 12h2a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-2') + rect(3, 8, 23, 16, 4);
const spark = fill('M17.1 9.5 11.6 17h4.2l-1 5.5 5.6-7.6h-4.2l.9-5.4Z');
const whirl = line('M6 13C7.5 7.9 12.3 4.8 17.7 5.5c2.4.3 4.8 1.7 6.2 3.4m0 0-.3-4.1m.3 4.1-4.3.1M26 19c-1.5 5.1-6.3 8.2-11.7 7.5-2.4-.3-4.8-1.7-6.2-3.4m0 0 .3 4.1m-.3-4.1 4.3-.1');
const eye = line('M3.5 16c3.4-4.9 7.7-7.6 12.5-7.6s9.1 2.7 12.5 7.6c-3.4 4.9-7.7 7.6-12.5 7.6S6.9 20.9 3.5 16Z') + ring(16, 16, 3.65);
const qr = scan + fill('M9 9h5.5v5.5H9zm2 2v1.5h1.5V11Zm6.5-2H23v5.5h-5.5zm2 2v1.5H21V11ZM9 17.5h5.5V23H9zm2 2V21h1.5v-1.5Zm6.5-2h2V20h3.5v3h-2v-1h-3.5Zm3.5 0h2v2h-2Z');
const pay = rect(4, 8, 24, 17, 4) + line('M4 13h24m-19 7h5');
const chat = line('M16 5.5c6.5 0 11.5 4.1 11.5 9.4s-5 9.4-11.5 9.4c-1.5 0-3-.2-4.4-.8L6 26l1-4.6c-1.6-1.6-2.5-3.8-2.5-6.5 0-5.3 5-9.4 11.5-9.4Z');
const phone = rect(8, 4, 16, 24, 4) + line('M14 24h4');
const laptop = line('M4 20V8a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v12M3 23h26l-2 3H5Z');
const home = line('M4 15 14 6a3 3 0 0 1 4 0l10 9m-3-2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V13');
const lock = rect(6.5, 14, 19, 13, 3) + line('M10 14V10a6 6 0 0 1 12 0v4') + dot(16, 20);
const play = fill('M10 6.6c-1.3-.8-2.8.1-2.8 1.6v15.6c0 1.5 1.5 2.4 2.8 1.6l14-7.8a1.8 1.8 0 0 0 0-3.2Z');
const waves = line('M3 21c4.2 0 6-3 9.4-3 3 0 4.2 2.5 7.6 2.5 3 0 4.7-2.2 9-2.2M3 26c4.2 0 6-3 9.4-3 3 0 4.2 2.5 7.6 2.5 3 0 4.7-2.2 9-2.2');
const speaker = fill('M4 12.3h5l6.1-4.8c.8-.7 2-.1 2 .9v15.2c0 1-1.2 1.6-2 .9L9 19.7H4a1.4 1.4 0 0 1-1.4-1.4v-4.6c0-.8.6-1.4 1.4-1.4Z');
const sun = ring(16, 16, 5.5) + line('M16 3.5v3.2m0 18.6v3.2M3.5 16h3.2m18.6 0h3.2M7.1 7.1l2.2 2.2m13.4 13.4 2.2 2.2M7.1 24.9l2.2-2.2M22.7 9.3l2.2-2.2');
const eclipse = fill('M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 2.3v19.4a9.7 9.7 0 1 1 0-19.4Z');
const cross = line('m21 12 7 8m0-8-7 8');
const record = rect(4, 7, 24, 18, 4) + ring(16, 16, 4.5);
const heart = line('M16 25C10 21 5 17 5 12a5.3 5.3 0 0 1 11-1.1 5.3 5.3 0 0 1 11 1.1c0 5-5 9-11 13Z');

// 键、显示名、设备 spec、常态主图、可选的开启变体
export const installed = [
  ['wifi', 'WLAN', 'wifi', line('M3.6 12.3C9.4 7.2 18.1 5.9 24 9c1.6.8 3 1.9 4.4 3.3M7.6 17.1c4.3-3.7 10-4.7 14.1-2.4.9.5 1.8 1.3 2.7 2.4m-12.3 4.2c2.7-2 5.6-2.2 7.9 0', 2.55) + fill('M16 23c1.4 1.3 2.1 2.4 2.1 3.3a2.1 2.1 0 1 1-4.2 0c0-.9.7-2 2.1-3.3Z')],
  ['bluetooth', '蓝牙', 'bt', line('M16 4.3v23.4l6.6-5.2-13.5-11m6.9-7.2 6.6 5.2L9.1 20.8', 2.5) + fill('M21.4 7.3c1.7.1 3.1.7 4.3 1.9-1 1.1-2.3 1.7-4 1.7l1.2-1.4ZM21.4 24.7c1.7-.1 3.1-.7 4.3-1.9-1-1.1-2.3-1.7-4-1.7l1.2 1.4Z')],
  ['cell', '移动数据', 'cell', line('M9.2 26c2.1-6.8 1.6-12.7.8-19.8m-5 5.1L10 6l5 4.9M22.8 6c-2.1 6.8-1.6 12.7-.8 19.8m5-5.1L22 26l-5-4.9', 2.55)],
  ['ring', '静音', 'ringermode', bell + dot(16, 26, 1.7), line('M8 19a14 14 0 0 0 1-6c0-4.6 3-7.5 7-7.5s7 2.9 7 7.5c0 3.5.7 5.3 2.4 7.5M6 25 26 7', 2.65) + dot(16, 26, 1.5)],
  ['flashlight', '手电筒', 'flashlight', lantern, lantern + line('M16 2.5v3.6M9.3 4.7 11 6.6m11.7-1.9L21 6.6', 1.9)],
  ['location', '定位服务', 'location', fill('M16 4c5.8 0 10 4 10 9.5 0 5.3-5 10.1-10 14.5C11 23.6 6 18.8 6 13.5 6 8 10.2 4 16 4Zm0 5.8a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z') + line('M9.5 28c2.2.8 4.4 1.2 6.5 1.2s4.3-.4 6.5-1.2', 1.45)],
  ['airplane', '飞行模式', 'airplane', fill('M3.7 11.5c2.2.4 3.9 1.4 5.4 2.8l6-.3L10 6c1.9 0 2.8.3 4 1.1l8.2 6.6h3.2c2.2 0 3.7.6 4.7 2.3-.9 1.5-2.4 2.2-4.7 2.2h-3.2L14 24.9c-1.2.8-2.1 1.1-4 1.1l5.1-8-6-.3c-1.5 1.4-3.2 2.4-5.4 2.8.2-2.1.9-3.4 2.2-4.5-1.3-1.1-2-2.4-2.2-4.5Z')],
  ['rotation', '自动旋转', 'rotation', whirl + '<g transform="rotate(-32 16 16)">' + fill('M14 10.5h4a1.7 1.7 0 0 1 1.7 1.7v7.6a1.7 1.7 0 0 1-1.7 1.7h-4a1.7 1.7 0 0 1-1.7-1.7v-7.6a1.7 1.7 0 0 1 1.7-1.7Z') + '</g>'],
  ['windows', '连接至 Windows', 'custom(com.microsoft.appmanager/.quicksettings.WindowsLinkTileService)', line('M5 21V8a2 2 0 0 1 2-2h19a2 2 0 0 1 2 2v1.5m-13 13.5H4m6 0-2 3h8') + rect(20, 13, 9, 15, 2.2) + line('M23.5 24.3h2M9.5 13h6m-3-3v6', 1.65)],
  ['synergy', '跨屏互联', 'custom(com.oplus.linker/.synergy.service.SynergyTileService)', line('M13 23H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v3') + rect(18, 13, 11, 14, 3) + line('M9 16c3.2-2.3 7.2-2.3 10.4 0', 1.8)],
  ['vibration', '振动', 'vibration', rect(10, 5, 12, 22, 3.5) + line('M6 10c-3 3-3 9 0 12m20-12c3 3 3 9 0 12m-12 2h4')],
  ['eye-protect', '护眼模式', 'custom(com.oplus.eyeprotect/.services.EyeProtectTileService)', eye + line('M10.5 26c4.1 1.7 7 1.7 11 0', 1.65)],
  ['battery', '省电模式', 'battery', powerCell + '<g transform="translate(2.8 4.6) scale(.73)">' + tail + '</g>'],
  ['dark-mode', '暗色模式', 'darkmode', eclipse],
  ['screenshot', '截屏', 'screenshot', scan + line('M10 19.5c3.5-4.3 8.5-4.3 12 0', 2) + dot(21.5, 12, 1.3)],
  ['screen-record', '屏幕录制', 'custom(com.oplus.screenrecorder/.floatwindow.services.QuickPanelService)', record, rect(4, 7, 24, 18, 4) + fill('M12.2 12.2h7.6v7.6h-7.6z')],
  ['hotspot', '个人热点', 'hotspot', line('M6.4 7.8c-5 4.5-5 11.9 0 16.4m19.2-16.4c5 4.5 5 11.9 0 16.4M10 11c-3 2.9-3 7.1 0 10m12-10c3 2.9 3 7.1 0 10', 2.15) + dot(16, 16, 2.65)],
  ['dnd', '免打扰', 'dnd', moon + line('M21 10h6', 2.3)],
  ['oshare', 'OPPO 互传', 'custom(com.coloros.oshare/.OshareTileService)', line('M4.4 12.4c6.6-4.4 13.2-4.4 22.8-.9m0 0-4.3-4.3m4.3 4.3-5.5 2.6M27.6 19.6c-6.6 4.4-13.2 4.4-22.8.9m0 0 4.3 4.3m-4.3-4.3 5.5-2.6', 2.45)],
  ['cast', '手机投屏', 'custom(com.oplus.linker/.synergy.service.TVTileService)', line('M5 13V8a2 2 0 0 1 2-2h19a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H16M4 16a13 13 0 0 1 13 13M4 22a7 7 0 0 1 7 7') + dot(4.5, 28, 1.4)],
  ['nfc', 'NFC', 'nfc', line('M7 23V8l14 14V8m4 2a8 8 0 0 1 0 9M4 13a8 8 0 0 0 0 9', 2.45)],
  ['share-screen', '屏幕共享', 'custom(com.coloros.sharescreen/.service.ShareScreenTileService)', rect(4, 6, 24, 17, 3) + line('M12 27h8m-4-4v4m0-16v7m-4-4 4-3 4 3', 2)],
  ['reverse-charge', '无线反向充电', 'custom(com.oplus.battery/com.oplus.powermanager.wirelesscharg.WirelessReverseControService)', ring(16, 15.8, 7.5) + spark + line('M5.5 7.6a13 13 0 0 0 0 16.8m21-16.8a13 13 0 0 1 0 16.8', 1.75)],
];

export const firmware = [
  ['wallet', '钱包', 'wallet', line('M24 10V7L7 9a3 3 0 0 0-3 3.2V24a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2H8m20 6h-6a3 3 0 0 0 0 6h6') + dot(23, 19, 1.1)],
  ['temperature', '环境色自适应', 'autoscreentemperature', rect(3.5, 5.5, 25, 18, 3.5) + eclipse.replace('<path', '<path transform="translate(5.6 4.6) scale(.65)"') + line('M12 27h8')],
  ['nearby', '附近分享', 'custom(com.google.android.gms/.nearby.sharing.SharingTileService)', line('M4 13c5.6-1 7.5-5 11.7-5 3.1 0 4.9 2 4.9 4.6 0 2.1-1.4 3.7-3.7 4.4m11.1 2c-5.6 1-7.5 5-11.7 5-3.1 0-4.9-2-4.9-4.6 0-2.1 1.4-3.7 3.7-4.4', 2.45)],
  ['scanner', '扫码', 'qr_code_scanner', qr],
  ['system-space', '系统分身', 'multisystem', line('M14 25H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12m-2 19h8a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-4m-5-5v5m0 16v5') + dot(10, 16) + dot(22, 16)],
  ['super-saver', '超级省电', 'superpowersave', powerCell + spark],
  ['black-screen', '息屏显示开关', 'blackscreen', phone + line('m12 17 8-8m-5 12 5-5', 1.8)],
  ['calculator', '计算器', 'calculator', rect(6.5, 3.5, 19, 25, 3.5) + line('M10.5 11h11m-11 6h2m7 0h2m-11 6h2m7 0h2')],
  ['clear', '清理内存', 'clear', line('M18 13 25 5m-18 7 14 3-3 10c-4 2-10 1-14-2l3-11Zm4 4-2 6m6-5-1.5 7') + dot(6, 7, 1.15) + dot(24.5, 23, 1.35)],
  ['one-hand', '单手模式', 'smallscreen', line('M14 27H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8m-8 3v7m0 0-3-3m3 3 3-3') + fill('M23 20h5v6a2 2 0 0 1-2 2h-3Z')],
  ['lock', '一键锁屏', 'lockscreen', lock],
  ['accessibility', '无障碍助手', 'custom(com.coloros.accessibilityassistant/.AccessibilityAssistantTitleService)', dot(16, 7, 3) + line('M6 12c6.7 3.8 13.3 3.8 20 0m-10 3v5m-5 7 5-7 5 7', 2.5)],
  ['no-notifications', '静音通知', 'nodisturb', rect(4, 6, 24, 19, 4) + line('M9 12h14m-11 7h8', 2.5)],
  ['envelope', '红包助手', 'envelope', rect(7, 4, 18, 24, 4) + line('M7 11c4 4 14 4 18 0') + ring(16, 16.3, 2.7, 1.8)],
  ['google-now', 'Google 资讯', 'googlenow', rect(5, 6, 22, 20, 3) + line('M10 12h12m-12 5h12m-12 5h7')],
  ['work', '工作资料', 'work', rect(4, 10, 24, 16, 3.5) + line('M12 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M4 17c6 2.5 18 2.5 24 0m-12 0v5')],
  ['alipay', '支付宝付款', 'alipay', pay.replace('M4 13h24m-19 7h5','M4 13h24m-7 5 2 2 4-4')],
  ['wechat-pay', '微信付款', 'weixinpay', chat + line('m11 15 3.5 3.5L21 12', 2.45)],
  ['wechat-scan', '微信扫一扫', 'weixinscan', scan + line('M10 15.8c0-2.5 2.6-4.5 6-4.5s6 2 6 4.5-2.6 4.5-6 4.5c-.7 0-1.4-.1-2-.3l-3 1.5.5-2.5c-.9-.8-1.5-1.8-1.5-3.2Z', 1.8)],
  ['alipay-scan', '支付宝扫一扫', 'aliscan', scan + line('M11 13h10m-7-3v10m-3-3 10 4', 1.85)],
  ['camera-access', '相机访问', 'cameratoggle', line('M4 11a2 2 0 0 1 2-2h5l2-3h6l2 3h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z') + ring(16, 17, 4.7)],
  ['mic-access', '麦克风访问', 'mictoggle', rect(12, 3.5, 8, 15, 4) + line('M7 14v1.5a9 9 0 0 0 18 0V14m-9 10.5v4m-4 0h8')],
  ['video-engine', '视频画质增强', 'lris', rect(4, 6, 24, 19, 4) + fill('M11 11l9 4.8-9 4.8Z') + dot(23, 12, 1.3) + dot(23, 16, 1.3)],
  ['visual-enhancer', '超清视效', 'osie', rect(3.5, 6, 25, 19, 3) + line('M7.5 19c3.2-2.5 6.1-2.5 8.5-.2 2.4 2.3 5.3 2.3 8.5-.2m-5-8.5v5m-2.5-2.5h5')],
  ['keyboard', '输入法', 'inputmethod', rect(3.5, 7, 25, 18, 3) + line('M8 12h1m6.5 0h1m6.5 0h1M8 16.5h1m6.5 0h1m6.5 0h1M10 21h12', 1.85)],
  ['device-controls', '设备控制', 'controls', home + dot(16, 21, 2.2) + line('M12.5 17.5c2.1-2.2 4.9-2.2 7 0', 1.75)],
  ['app-lock', '应用锁', 'custom(com.oplus.safecenter/.privacy.control.AppLockSwitchTileService)', rect(5, 5, 22, 22, 5) + line('M12 15v-2a4 4 0 0 1 8 0v2') + rect(10, 15, 12, 7.5, 2)],
  ['data-recharge', '流量充值', 'custom(com.finshell.wallet/com.nearme.wallet.FlowRechargeTileService)', line('M18 4H9a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3v-1M11 11v10m-3-3 3 3 3-3m7-12v8m-4-4h8')],
  ['scenario', '情景模式', 'custom(com.coloros.scenemode/.entrance.SceneTileService)', rect(4, 5, 24, 22, 4) + '<g transform="translate(5 .8) scale(.69)">' + waves + '</g>' + dot(12, 12.4, 2.1)],
  ['assistant', '语音助手', 'custom(com.heytap.speechassist/.service.SpeechTileService)', line('M4 15v2m4-5v8m5-12v16m6-12v8m5-10v12m4-8v4', 2.4)],
];

// 服务已登记。三方应用的资源位置可能在各自的 APK。
export const services = [
  ['dolby', '杜比全景声', 'custom(com.android.settings/com.oplus.partners.dolby.DolbyTileService)', rect(4, 7, 24, 18, 4) + fill('M8 11c4 0 7 1.8 7 5s-3 5-7 5Zm16 0v10c-4 0-7-1.8-7-5s3-5 7-5Z')],
  ['children', '儿童空间', 'custom(com.coloros.childrenspace/.view.ChildrenTileService)', ring(16, 16, 11) + dot(12, 14.5) + dot(20, 14.5) + line('M11 20c2.7 3.2 7.3 3.2 10 0', 2)],
  ['float', '智能侧边栏', 'custom(com.coloros.floatassistant/.FloatAssistantTileService)', rect(5, 5, 22, 22, 4) + line('M23 10v12', 2.65) + dot(12, 13) + dot(12, 19)],
  ['optimize', '系统优化', 'custom(com.coloros.phonemanager/com.oplus.phonemanager.quicksettings.SystemOptTileService)', line('M5 23a11 11 0 1 1 22 0m-11-3 6-7m-14 5 2.5 1m5.5-9v2') + dot(16, 21.5, 2)],
  ['virus-scan', '病毒扫描', 'custom(com.coloros.phonemanager/com.oplus.phonemanager.quicksettings.VirusScanTileService)', line('M16 4 26 8v7c0 6-3.7 10.2-10 13-6.3-2.8-10-7-10-13V8Z') + line('m11.5 15 3 3 6-6', 2.4)],
  ['browser-search', '浏览器搜索', 'custom(com.heytap.browser/.search.LaunchSearchTile)', ring(13.5, 13.5, 8.6) + line('m20 20 7 7M8 14c2-2.4 4-2.4 6 0s4 2.4 6 0', 2)],
  ['drive', '驾驶模式', 'custom(com.oplus.ocar/.smartdrive.core.DriveModeTileService)', line('M5 17 8 9h16l3 8v7a2 2 0 0 1-2 2h-1l-2-3H10l-2 3H7a2 2 0 0 1-2-2Zm1 0h20') + dot(10, 20, 1) + dot(22, 20, 1)],
  ['baidu-search', '百度搜索', 'custom(com.baidu.searchbox/.quicksettings.SearchTileService)', ring(13, 13, 8.7) + line('m20 20 7 7') + dot(13, 13, 1.6)],
  ['favorites', '收藏空间', 'custom(com.coloros.favorite/.app.service.QuickService)', line('M8 5h16v23l-8-5-8 5Z') + line('M12 12c1.6.2 2.9 1 4 2.4 1.1-1.4 2.4-2.2 4-2.4m-4 2.4v3.2', 1.7)],
  ['breath', '呼吸模式', 'custom(com.oneplus.brickmode/.service.BreathModeTileService)', ring(16, 16, 10.8) + ring(16, 16, 6, 1.6) + dot(16, 16, 1.9)],
  ['video-open', '腾讯视频', 'custom(com.tencent.qqlive/.tile.TileOpenAppService)', rect(3, 5.5, 26, 21, 5) + '<g transform="translate(6.3 6.3) scale(.61)">' + play + '</g>'],
  ['video-nba', 'NBA', 'custom(com.tencent.qqlive/.tile.TileNBAService)', ring(16, 16, 11) + line('M5 16h22M16 5v22M8 8c8 3.5 8 12.5 0 16m16-16c-8 3.5-8 12.5 0 16', 1.7)],
  ['video-history', '播放历史', 'custom(com.tencent.qqlive/.tile.TileHistoryService)', ring(16, 16, 11) + line('M16 8.5V16l5 3.5')],
  ['video-follow', '影视关注', 'custom(com.tencent.qqlive/.tile.TileAttentService)', heart + dot(25, 6.5, 1.3)],
];

export const aliases = {
  'custom(com.android.settings/com.oplus.settings.feature.display.video.InputMethodTile)': 'keyboard',
  'custom(com.android.settings/com.oplus.settings.feature.display.darkmode.DarkModeTileService)': 'dark-mode',
  'custom(com.android.settings/com.oplus.settings.feature.display.video.Iris5TileService)': 'video-engine',
};

export const controls = [
  ['brightness', '亮度', 'panel:brightness', sun],
  ['auto-brightness', '自动亮度', 'panel:auto-brightness', sun.replace('cx="16" cy="16" r="5.5"', 'cx="16" cy="16" r="5.8"') + line('m13.7 18.3 2.3-4.7 2.3 4.7m-3.8-1.5h3', 1.15)],
  ['volume', '音量', 'panel:volume', speaker + line('M21 11.8a6.2 6.2 0 0 1 0 8.4M24.8 8.4a11 11 0 0 1 0 15.2')],
  ['volume-off', '媒体静音', 'panel:volume-off', speaker + cross],
  ['settings', '设置', 'panel:settings', line('M13.4 4h5.2l.9 3.3 2.1 1.2 3.3-.9 2.6 4.5-2.4 2.4v2.9l2.4 2.4-2.6 4.5-3.3-.9-2.1 1.2-.9 3.3h-5.2l-.9-3.3-2.1-1.2-3.3.9-2.6-4.5 2.4-2.4v-2.9l-2.4-2.4 2.6-4.5 3.3.9 2.1-1.2Z') + ring(16, 16, 3.5)],
  ['more', '更多', 'panel:more', dot(16, 8, 1.85) + dot(16, 16, 1.85) + dot(16, 24, 1.85)],
  ['expand', '展开', 'panel:expand', line('m12 7 9 9-9 9', 3)],
  ['add', '添加', 'panel:add', line('M16 6v20M6 16h20', 2.8)],
  ['remove', '移除', 'panel:remove', line('M6 16h20', 2.8)],
  ['done', '完成', 'panel:done', line('m6.4 16.2 6.2 6.1L26 9', 2.8)],
  ['edit', '编辑', 'panel:edit', line('m5 26 1.4-7L21 4.8a2.5 2.5 0 0 1 3.5 0l2.7 2.7a2.5 2.5 0 0 1 0 3.5L12.6 25.4 5 26ZM18.5 7.3l6 6')],
  ['media-output', '媒体输出', 'panel:media-output', laptop + line('M12 17c2.5-3 5.5-3 8 0')],
  ['previous', '上一首', 'panel:previous', line('M6 8v16', 2.8) + fill('M23.7 7.4c1.2-.7 2.6.1 2.6 1.5v14.2c0 1.4-1.4 2.2-2.6 1.5L11 17.5a1.7 1.7 0 0 1 0-3Z')],
  ['play', '播放', 'panel:play', play],
  ['pause', '暂停', 'panel:pause', line('M11 8v16m10-16v16', 5)],
  ['next', '下一首', 'panel:next', line('M26 8v16', 2.8) + fill('M8.3 7.4c-1.2-.7-2.6.1-2.6 1.5v14.2c0 1.4 1.4 2.2 2.6 1.5L21 17.5a1.7 1.7 0 0 0 0-3Z')],
];
