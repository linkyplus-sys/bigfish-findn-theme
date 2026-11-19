package cn.bigfish.findn.clock;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.provider.AlarmClock;
import android.text.format.DateFormat;
import android.content.ComponentName;
import android.widget.RemoteViews;

import java.util.Locale;

public abstract class ClockWidget extends AppWidgetProvider {
    private final boolean wide;
    private final boolean dark;

    ClockWidget(boolean wide, boolean dark) {
        this.wide = wide;
        this.dark = dark;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        if (appWidgetIds.length == 0) return;
        RemoteViews views = new RemoteViews(context.getPackageName(), layout());
        if (wide) {
            views.setTextColor(R.id.time, Color.parseColor(dark ? "#EBF9FF" : "#FFF9ED"));
            views.setTextColor(R.id.date, Color.parseColor(dark ? "#BDD6EE" : "#DDECF9"));
            NativeWeather.bindRow(context, views);
        } else {
            views.setImageViewResource(R.id.plate,
                    dark ? R.drawable.plate_small_dark : R.drawable.plate_small_light);
            views.setTextColor(R.id.time, Color.parseColor(dark ? "#F0F7FD" : "#163451"));
            views.setTextColor(R.id.date, Color.parseColor(dark ? "#B9CEE7" : "#3E5F81"));
        }
        Locale locale = context.getResources().getConfiguration().getLocales().get(0);
        String date = "zh".equals(locale.getLanguage())
                ? "M'月'd'日' EEE" : DateFormat.getBestDateTimePattern(locale, "MMMEd");
        views.setCharSequence(R.id.date, "setFormat12Hour", date);
        views.setCharSequence(R.id.date, "setFormat24Hour", date);
        Intent alarms = new Intent(AlarmClock.ACTION_SHOW_ALARMS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent openAlarms = PendingIntent.getActivity(context, 0, alarms, PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(android.R.id.background, openAlarms);
        manager.updateAppWidget(appWidgetIds, views);
    }

    int layout() {
        return wide ? R.layout.widget_wide : R.layout.widget_small;
    }

    static void refreshWide(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        new WideLight().onUpdate(context, manager,
                manager.getAppWidgetIds(new ComponentName(context, WideLight.class)));
        new WideDark().onUpdate(context, manager,
                manager.getAppWidgetIds(new ComponentName(context, WideDark.class)));
        new WideMotion().onUpdate(context, manager,
                manager.getAppWidgetIds(new ComponentName(context, WideMotion.class)));
    }

    public static final class WideLight extends ClockWidget {
        public WideLight() { super(true, false); }
    }

    public static final class WideDark extends ClockWidget {
        public WideDark() { super(true, true); }
    }

    public static final class WideMotion extends ClockWidget {
        public WideMotion() { super(true, true); }

        @Override int layout() { return R.layout.widget_wide_motion; }
    }

    public static final class SmallLight extends ClockWidget {
        public SmallLight() { super(false, false); }
    }

    public static final class SmallDark extends ClockWidget {
        public SmallDark() { super(false, true); }
    }
}
