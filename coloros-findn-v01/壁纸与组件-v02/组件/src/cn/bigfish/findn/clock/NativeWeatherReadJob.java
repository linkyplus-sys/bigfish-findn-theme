package cn.bigfish.findn.clock;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.appwidget.AppWidgetHost;
import android.appwidget.AppWidgetHostView;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.TextView;

import java.util.regex.Pattern;

public final class NativeWeatherReadJob extends JobService {
    private static final Pattern TEMPERATURE = Pattern.compile(
            "^[-+−]?\\p{Nd}{1,3}(?:[.,]\\p{Nd}{1,2})?\\s*[°º℃℉](?:\\s*[CF])?$");
    private final Handler main = new Handler(Looper.getMainLooper());
    private JobParameters active;
    private AppWidgetHost host;
    private AppWidgetHostView widget;
    private int widgetId;
    private int temperatureId;
    private int conditionId;
    private int attempts;

    @Override
    public boolean onStartJob(JobParameters params) {
        if (active != null) return false;
        widgetId = NativeWeather.boundId(this);
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return false;
        AppWidgetProviderInfo info = NativeWeather.provider(this, widgetId);
        if (info == null) return false;
        try {
            Resources resources = getPackageManager().getResourcesForApplication(info.provider.getPackageName());
            temperatureId = resources.getIdentifier("local_weather_info_txt", "id", info.provider.getPackageName());
            conditionId = resources.getIdentifier("local_description_info_txt", "id", info.provider.getPackageName());
            if (temperatureId == 0) return false;
            host = new AppWidgetHost(this, NativeWeather.HOST_ID);
            host.startListening();
            widget = host.createView(this, widgetId, info);
        } catch (PackageManager.NameNotFoundException | RuntimeException unavailable) {
            clear();
            return false;
        }
        attempts = 0;
        active = params;
        main.post(attemptReading);
        return true;
    }

    private final Runnable attemptReading = new Runnable() {
        @Override public void run() {
            if (active == null) return;
            String temperature = shownText(temperatureId);
            if (TEMPERATURE.matcher(temperature).matches()) {
                String condition = shownText(conditionId);
                NativeWeather.storeReading(NativeWeatherReadJob.this, widgetId,
                        condition.length() <= 20 ? condition : "", temperature);
                complete();
            } else if (++attempts >= 13) {
                NativeWeather.storeReading(NativeWeatherReadJob.this, widgetId, "", "");
                complete();
            } else {
                main.postDelayed(this, 650);
            }
        }
    };

    private String shownText(int id) {
        if (id == 0 || widget == null) return "";
        View found = widget.findViewById(id);
        if (!(found instanceof TextView) || found.getVisibility() != View.VISIBLE) return "";
        return ((TextView) found).getText().toString().replaceAll("\\p{Cf}", "").trim();
    }

    private void complete() {
        JobParameters finished = active;
        clear();
        jobFinished(finished, false);
    }

    private void clear() {
        main.removeCallbacks(attemptReading);
        active = null;
        widget = null;
        if (host != null) {
            host.stopListening();
            host = null;
        }
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        if (active == params) clear();
        return false;
    }

    @Override
    public void onDestroy() {
        clear();
        super.onDestroy();
    }
}
