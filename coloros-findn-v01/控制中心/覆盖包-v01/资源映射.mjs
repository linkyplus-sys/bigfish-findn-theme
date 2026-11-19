const system = [];
function put(list, art, entries, options = {}) {
  for (const item of entries.split(/\s+/).filter(Boolean)) {
    const [target, state = 'off'] = item.split(':');
    list.push({ target, art, state, ...options });
  }
}

function qs(art, entries) {
  for (const name of entries.split(/\s+/).filter(Boolean)) {
    const options = name.endsWith('_unavailable') ? { color: 'neutral', alpha: 0.22 } : {};
    put(system, art, 'status_bar_qs_' + name, options);
  }
}

qs('wifi', 'wifi_active:on wifi_inactive wifi_anim:anim-on');
qs('bluetooth', 'bluetooth_active:on bluetooth_inactive bluetooth_anim:anim-on');
qs('cell', 'data_active:on data_inactive data_unavailable data_anim:anim-on');
qs('ring', 'mute_active:on mute_active_icon:on mute_inactive mute_active_anim:anim-on mute_inactive_anim:anim-off');
qs('flashlight', 'flashlight_active:on flashlight_inactive flashlight_unavailable flashlight_anim:anim-on');
qs('location', 'location_active:on location_inactive location_unavailable location_anim:anim-on');
qs('airplane', 'airplane_active:on airplane_inactive airplane_anim:anim-on');
qs('rotation', 'rotation_active:on rotation_inactive rotation_anim:anim-on');
qs('vibration', 'vibrate_active:on vibrate_inactive vibrate_active_anim:anim-on vibrate_inactive_anim:anim-off');
qs('battery', 'battery_active:on battery_inactive battery_unavailable');
qs('screenshot', 'screenshot_in_active:on screenshot_inactive');
qs('hotspot', 'hotspot_active:on hotspot_inactive hotspot_unavailable hotspot_anim:anim-on');
qs('dnd', 'dnd_active:on dnd_inactive dnd_anim:anim-on');
qs('nfc', 'nfc_active:on nfc_inactive nfc_anim:anim-on');
put(system, 'dark-mode', 'qs_light_dark_theme_icon_on:anim-on qs_light_dark_theme_icon_off:anim-off');
put(system, 'dark-mode', 'darkmode_off_status_bar', { dp: 20, scale: 1, color: 'black' });
put(system, 'dark-mode', 'darkmode_on_status_bar:on', { dp: 20, scale: 1 });
qs('calculator', 'calculator_inactive');
qs('clear', 'clean_inactive');
qs('device-controls', 'device_control_active:on device_control_inactive device_control_unavailable');
qs('lock', 'lock_inactive');
qs('camera-access', 'camera_allowed:on camera_blocked camera_inactive camera_unavailable');
qs('mic-access', 'mic_allowed:on mic_blocked mic_unavailable');
qs('system-space', 'multi_system_inactive');
qs('no-notifications', 'no_disturb_active:on no_disturb_inactive');
qs('one-hand', 'smallscreen_active:on smallscreen_inactive smallscreen_unavailable smallscreen_anim:anim-on');
qs('super-saver', 'super_power_save_active:on super_power_save_inactive super_power_save_unavailable');
qs('wallet', 'wallet_active:on wallet_inactive wallet_unavailable');
qs('alipay', 'alipay_inactive');
qs('alipay-scan', 'aliscan_inactive');
qs('wechat-pay', 'wechat_pay_inactive');
qs('wechat-scan', 'wechat_scan_inactive');
qs('google-now', 'google_now_inactive');
qs('envelope', 'red_packet_active:on red_packet_inactive');
put(system, 'scanner', 'ic_qr_code_scanner');
put(system, 'auto-brightness', 'status_bar_brightness_normal_icon_alphabet status_bar_brightness_normal_icon_alphabet_with_notheme', { dp: 24, color: 'neutral', scale: 0.88 });
put(system, 'auto-brightness', 'status_bar_brightness_normal_icon_alphabet_use_light_color', { dp: 24, color: 'black', scale: 0.88 });
put(system, 'brightness', 'status_bar_brightness_normal_icon_sun status_bar_brightness_normal_icon_sun_with_notheme', { dp: 24, color: 'neutral', scale: 0.88 });
put(system, 'brightness', 'status_bar_brightness_normal_icon_sun_use_light_color', { dp: 24, color: 'black', scale: 0.88 });
put(system, 'volume', 'systemui_icon_volume_media_with_notheme', { dp: 25, color: 'volume', scale: 0.93 });
put(system, 'volume-off', 'systemui_icon_volume_media_mute_with_notheme', { dp: 25, color: 'volume', scale: 0.93 });
put(system, 'settings', 'status_bar_qs_footer_settings_icon_in_bg', { color: 'neutral', alpha: 0.85 });
put(system, 'edit', 'status_bar_qs_footer_edit_icon_in_bg', { color: 'neutral', alpha: 0.85 });
put(system, 'expand', 'qs_highlight_tile_expand_indicator', { dp: 24, scale: 0.55 });
put(system, 'temperature', 'status_bar_screen_temperature', { dp: 20, scale: 1, color: 'black' });
put(system, 'temperature', 'status_bar_screen_temperature_active:on', { dp: 20, scale: 1 });
put(system, 'keyboard', 'tile_icon_input_method', { dp: 20, scale: 1, color: 'black' });
// Iris 5 与 OSIE 的固件实现共用这一套资源，使用统一的播放增强图形。
put(system, 'video-engine', 'osie_notification', { dp: 20, scale: 1, color: 'neutral' });
put(system, 'video-engine', 'osie_notification_active:on', { dp: 20, scale: 1 });
put(system, 'video-engine', 'osie_notification_unavailable', { dp: 20, scale: 1, color: 'neutral', alpha: 0.22 });
put(system, 'work', 'stat_sys_managed_profile_status:on', { dp: 17, scale: 1 });
put(system, 'work', 'ic_corp_badge_off', { dp: 20, scale: 0.7, badge: 'work' });
put(system, 'more', 'coui_toolbar_menu_icon_more_normal coui_toolbar_menu_icon_more_pressed', { dp: 24, scale: 0.96, color: 'neutral' });
put(system, 'more', 'coui_toolbar_menu_icon_more_disable', { dp: 24, scale: 0.96, color: 'neutral', alpha: 0.34 });
put(system, 'add', 'qs_ic_tile_add_icon', { dp: 18, scale: 0.64, badge: 'add' });
put(system, 'remove', 'qs_ic_tile_remove_icon', { dp: 18, scale: 0.64, badge: 'remove' });
put(system, 'media-output', 'ic_oplus_media_output_switch', { dp: 20, color: 'media', scale: 0.94 });
for (const [key, name] of [['previous','pre'], ['play','play'], ['pause','pause'], ['next','next']]) {
  put(system, key, 'ic_oplus_media_panel_action_' + name, { dp: 24, color: 'media', scale: 0.92 });
}

const applications = [];
function app(target, name, mappings) {
  const entries = [];
  for (const [art, names, options = {}] of mappings) {
    put(entries, art, names, { dp: 36, color: 'black', scale: 1, ...options });
  }
  applications.push({ target, name, entries });
}

app('com.microsoft.appmanager', 'LinkWindows', [['windows', 'ic_tile']]);
app('com.oplus.linker', 'Linker', [['synergy', 'ic_tile_pc'], ['cast', 'ic_cast_black']]);
app('com.oplus.eyeprotect', 'EyeProtect', [['eye-protect', 'online_status_bar_eyes', { configs: ['night'] }]]);
app('com.oplus.screenrecorder', 'ScreenRecorder', [['screen-record', 'ic_control_center', { configs: ['night'] }]]);
app('com.coloros.oshare', 'OShare', [['oshare', 'oplus_o_share_off oplus_o_share_on:on']]);
app('com.coloros.sharescreen', 'ShareScreen', [['share-screen', 'screen_share_icon_off screen_share_icon_on:on']]);
app('com.oplus.battery', 'Battery', [['reverse-charge', 'ic_wireless_reverse_charging']]);
app('com.coloros.accessibilityassistant', 'Accessibility', [['accessibility', 'icon_control_center_normal']]);
app('com.oplus.safecenter', 'AppLock', [['app-lock', 'privacy_app_lock_icon']]);
app('com.finshell.wallet', 'DataRecharge', [['data-recharge', 'icon_charge_center', { configs: ['xxhdpi', 'night-xxhdpi'] }]]);
app('com.heytap.speechassist', 'Assistant', [['assistant', 'icon_tile_speech_assist_new2', { configs: ['night'] }]]);
app('com.android.settings', 'SettingsTiles', [
  ['dolby', 'dolby_notification_icon_normal', { dp: 20 }],
  ['dolby', 'dolby_notification_icon_active:on', { dp: 20, color: 'white' }],
  ['dolby', 'dolby_notification_icon_unavailable', { dp: 20, color: 'neutral', alpha: 0.22 }],
  ['temperature', 'status_bar_screen_temperature', { dp: 20 }],
  ['temperature', 'status_bar_screen_temperature_active:on', { dp: 20, color: 'white' }],
  ['video-engine', 'osie_notification', { dp: 20 }],
  ['video-engine', 'osie_notification_active:on', { dp: 20, color: 'white' }],
  ['video-engine', 'osie_notification_unavailable', { dp: 20, color: 'neutral', alpha: 0.22 }],
  ['keyboard', 'tile_icon_imput_method', { dp: 20 }],
  ['dark-mode', 'darkmode_off_status_bar', { dp: 20 }],
  ['dark-mode', 'darkmode_on_status_bar:on', { dp: 20, color: 'white' }],
]);
app('com.coloros.childrenspace', 'Children', [['children', 'status_bar_qs_children_inactive']]);
app('com.coloros.floatassistant', 'Sidebar', [['float', 'shortcut_floating', { configs: ['night'] }]]);
app('com.coloros.phonemanager', 'PhoneManager', [
  ['optimize', 'system_option_icon'], ['virus-scan', 'virus_scan_icon'],
]);
app('com.heytap.browser', 'Browser', [['browser-search', 'icon_browser_search', { configs: ['v35'] }]]);
app('com.oplus.ocar', 'Driving', [
  ['drive', 'driving_mode_tile_service_icon'],
  ['drive', 'driving_mode_tile_service_icon_improved', { configs: ['v35', 'night-v35'] }],
]);
app('com.baidu.searchbox', 'BaiduSearch', [['baidu-search', 'quicksettings_default_all', { configs: ['hdpi'] }]]);
app('com.coloros.favorite', 'Favorites', [['favorites', 'tile_icon', { configs: ['night'] }]]);
app('com.oneplus.brickmode', 'Breath', [['breath', 'zen_control_center_icon', { configs: ['night'] }]]);

export const groups = [{ target: 'com.android.systemui', name: 'Flashlight', entries: system }, ...applications];
