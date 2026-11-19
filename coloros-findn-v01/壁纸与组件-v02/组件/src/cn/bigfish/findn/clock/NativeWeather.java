package cn.bigfish.findn.clock;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.appwidget.AppWidgetHost;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;

final class NativeWeather {
    static final int HOST_ID = 406;
    static final ComponentName PROVIDER = new ComponentName("com.coloros.alarmclock",
            "com.coloros.widget.smallweather.OppoWeather");
    static final String PREFS = "native_weather";
    private static final int READ_NOW = 81;
    private static final int READ_PERIODIC = 82;

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static AppWidgetProviderInfo provider(Context context, int widgetId) {
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(context).getAppWidgetInfo(widgetId);
        return info != null && PROVIDER.equals(info.provider) ? info : null;
    }

    static int boundId(Context context) {
        int id = preferences(context).getInt("widget_id", AppWidgetManager.INVALID_APPWIDGET_ID);
        return id != AppWidgetManager.INVALID_APPWIDGET_ID && provider(context, id) != null
                ? id : AppWidgetManager.INVALID_APPWIDGET_ID;
    }

    static Bundle options() {
        Bundle options = new Bundle();
        options.putInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY,
                AppWidgetProviderInfo.WIDGET_CATEGORY_HOME_SCREEN);
        options.putInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 290);
        options.putInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 330);
        options.putInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 140);
        options.putInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 225);
        return options;
    }

    static void finishBinding(Context context, int widgetId) {
        preferences(context).edit().clear().putInt("widget_id", widgetId).apply();
        ClockWidget.refreshWide(context);
        JobScheduler scheduler = context.getSystemService(JobScheduler.class);
        scheduler.schedule(new JobInfo.Builder(READ_PERIODIC, reader(context))
                .setPeriodic(30 * 60 * 1000L).setPersisted(true).build());
        requestRead(context);
    }

    static void requestRead(Context context) {
        context.getSystemService(JobScheduler.class).schedule(new JobInfo.Builder(READ_NOW, reader(context))
                .setMinimumLatency(100).build());
    }

    private static ComponentName reader(Context context) {
        return new ComponentName(context, NativeWeatherReadJob.class);
    }

    static void disconnect(Context context) {
        JobScheduler scheduler = context.getSystemService(JobScheduler.class);
        scheduler.cancel(READ_NOW);
        scheduler.cancel(READ_PERIODIC);
        int id = boundId(context);
        if (id != AppWidgetManager.INVALID_APPWIDGET_ID) new AppWidgetHost(context, HOST_ID).deleteAppWidgetId(id);
        preferences(context).edit().clear().apply();
        ClockWidget.refreshWide(context);
    }

    static void storeReading(Context context, int widgetId, String condition, String temperature) {
        if (boundId(context) != widgetId) return;
        SharedPreferences prefs = preferences(context);
        boolean changed = prefs.getLong("checked_at", 0) == 0
                || !condition.equals(prefs.getString("condition", ""))
                || !temperature.equals(prefs.getString("temperature", ""));
        prefs.edit().putString("condition", condition).putString("temperature", temperature)
                .putLong("checked_at", System.currentTimeMillis()).apply();
        if (changed) ClockWidget.refreshWide(context);
    }

    static String reading(Context context) {
        SharedPreferences prefs = preferences(context);
        String temperature = prefs.getString("temperature", "");
        if (temperature.isEmpty()) return "";
        String condition = prefs.getString("condition", "");
        return condition.isEmpty() ? temperature : condition + "  " + temperature;
    }

    static void bindRow(Context context, RemoteViews views) {
        boolean connected = boundId(context) != AppWidgetManager.INVALID_APPWIDGET_ID;
        String reading = connected ? reading(context) : "";
        String empty = preferences(context).getLong("checked_at", 0) == 0 ? "等待原生天气" : "天气暂无数据";
        String text = !connected ? "连接天气" : reading.isEmpty() ? empty : reading;
        int icon = R.drawable.weather_shortcut;
        if (!reading.isEmpty()) {
            if (reading.contains("雪")) icon = R.drawable.weather_snow;
            else if (reading.contains("雨") || reading.contains("雷")) icon = R.drawable.weather_rain;
            else if (reading.contains("雾") || reading.contains("霾")) icon = R.drawable.weather_fog;
            else if (reading.contains("晴") && !reading.contains("云")) icon = R.drawable.weather_clear;
        }
        views.setImageViewResource(R.id.weather_icon, icon);
        views.setTextViewText(R.id.weather_text, text);
        Intent click = null;
        if (!reading.isEmpty()) click = context.getPackageManager().getLaunchIntentForPackage("com.coloros.weather2");
        if (click == null) click = new Intent(context, NativeWeatherActivity.class);
        views.setOnClickPendingIntent(R.id.weather_row, PendingIntent.getActivity(context,
                1, click, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
    }
}
