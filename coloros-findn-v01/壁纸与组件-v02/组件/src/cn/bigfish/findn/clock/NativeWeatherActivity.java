package cn.bigfish.findn.clock;

import android.app.Activity;
import android.appwidget.AppWidgetHost;
import android.appwidget.AppWidgetManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Process;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class NativeWeatherActivity extends Activity {
    private static final int BIND_WEATHER = 206;
    private int pendingId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private SharedPreferences preferences;
    private TextView status;
    private Button connect;
    private Button disconnect;
    private final SharedPreferences.OnSharedPreferenceChangeListener changes = (prefs, key) -> render();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null) pendingId = state.getInt("pending_id", AppWidgetManager.INVALID_APPWIDGET_ID);
        getWindow().setStatusBarColor(0xff112743);
        getWindow().setNavigationBarColor(0xff112743);
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(24), dp(34), dp(24), dp(24));
        panel.setBackgroundColor(0xffeaf2fb);
        TextView title = new TextView(this);
        title.setText("原生天气");
        title.setTextColor(0xff173653);
        title.setTextSize(28);
        panel.addView(title);
        status = new TextView(this);
        status.setTextColor(0xff375778);
        status.setTextSize(16);
        status.setPadding(0, dp(12), 0, dp(12));
        panel.addView(status);
        connect = new Button(this);
        connect.setOnClickListener(v -> {
            if (NativeWeather.boundId(this) != AppWidgetManager.INVALID_APPWIDGET_ID) {
                NativeWeather.requestRead(this);
                status.setText("正在读取原生小组件…");
            } else {
                bindWeather();
            }
        });
        panel.addView(connect);
        disconnect = new Button(this);
        disconnect.setText("断开连接");
        disconnect.setOnClickListener(v -> {
            NativeWeather.disconnect(this);
            render();
        });
        panel.addView(disconnect);
        setContentView(panel);
        preferences = NativeWeather.preferences(this);
        render();
    }

    @Override
    protected void onStart() {
        super.onStart();
        preferences.registerOnSharedPreferenceChangeListener(changes);
        render();
    }

    @Override
    protected void onStop() {
        preferences.unregisterOnSharedPreferenceChangeListener(changes);
        super.onStop();
    }

    private void render() {
        boolean linked = NativeWeather.boundId(this) != AppWidgetManager.INVALID_APPWIDGET_ID;
        String value = linked ? NativeWeather.reading(this) : "";
        String empty = NativeWeather.preferences(this).getLong("checked_at", 0) == 0
                ? "已连接，正在等待 ColorOS 提供天气。" : "原生小组件暂未显示可读取的天气。";
        status.setText(!linked ? "授权后，显示 ColorOS 时钟小组件里的天气和温度。"
                : value.isEmpty() ? empty : value);
        connect.setText(linked ? "重新读取" : "连接原生天气");
        disconnect.setVisibility(linked ? View.VISIBLE : View.GONE);
    }

    private void bindWeather() {
        if (pendingId != AppWidgetManager.INVALID_APPWIDGET_ID) return;
        AppWidgetHost host = new AppWidgetHost(this, NativeWeather.HOST_ID);
        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        pendingId = host.allocateAppWidgetId();
        if (pendingId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            status.setText("系统无法创建天气组件。");
            return;
        }
        try {
            if (manager.bindAppWidgetIdIfAllowed(pendingId, NativeWeather.PROVIDER, NativeWeather.options())) {
                acceptBinding(host, true);
                return;
            }
            Intent authorize = new Intent(AppWidgetManager.ACTION_APPWIDGET_BIND)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, pendingId)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER, NativeWeather.PROVIDER)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER_PROFILE, Process.myUserHandle())
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_OPTIONS, NativeWeather.options());
            startActivityForResult(authorize, BIND_WEATHER);
        } catch (ActivityNotFoundException | SecurityException unavailable) {
            acceptBinding(host, false);
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == BIND_WEATHER) {
            acceptBinding(new AppWidgetHost(this, NativeWeather.HOST_ID), result == RESULT_OK);
        }
    }

    private void acceptBinding(AppWidgetHost host, boolean approved) {
        if (pendingId == AppWidgetManager.INVALID_APPWIDGET_ID) return;
        int id = pendingId;
        pendingId = AppWidgetManager.INVALID_APPWIDGET_ID;
        if (approved && NativeWeather.provider(this, id) != null) {
            NativeWeather.finishBinding(this, id);
            render();
        } else {
            host.deleteAppWidgetId(id);
            status.setText("系统尚未授权原生天气组件。");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        out.putInt("pending_id", pendingId);
        super.onSaveInstanceState(out);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
