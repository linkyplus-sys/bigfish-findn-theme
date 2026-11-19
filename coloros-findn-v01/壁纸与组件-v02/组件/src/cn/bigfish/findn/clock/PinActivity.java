package cn.bigfish.findn.clock;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RemoteViews;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public final class PinActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xff112743);
        getWindow().setNavigationBarColor(0xff112743);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        int inset = dp(24);
        content.setPadding(inset, dp(34), inset, inset);
        TextView heading = new TextView(this);
        heading.setText("大肥鱼时钟");
        heading.setTextSize(29);
        heading.setTextColor(0xff173653);
        content.addView(heading);
        TextView introduction = new TextView(this);
        introduction.setText("选择要添加到桌面的小组件。");
        introduction.setTextSize(15);
        introduction.setTextColor(0xff3e5f81);
        introduction.setPadding(0, dp(6), 0, dp(20));
        content.addView(introduction);

        addWidget(content, "浅海 · 全宽", ClockWidget.WideLight.class);
        addWidget(content, "深海 · 全宽", ClockWidget.WideDark.class);
        addWidget(content, "深海 · 动态全宽", ClockWidget.WideMotion.class);
        addWidget(content, "浅海 · 2×2", ClockWidget.SmallLight.class);
        addWidget(content, "深海 · 2×2", ClockWidget.SmallDark.class);
        Button preview = new Button(this);
        preview.setText("预览动态全宽");
        preview.setOnClickListener(view -> showMotionPreview(content, preview));
        content.addView(preview);
        Button weather = new Button(this);
        weather.setText("管理原生天气");
        weather.setOnClickListener(view -> startActivity(new Intent(this, NativeWeatherActivity.class)));
        content.addView(weather);
        ScrollView page = new ScrollView(this);
        page.setBackgroundColor(0xffeaf2fb);
        page.setFillViewport(true);
        page.addView(content);
        setContentView(page);
    }

    private void addWidget(LinearLayout parent, String label, Class<? extends AppWidgetProvider> provider) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(label);
        button.setTextColor(Color.rgb(23, 54, 83));
        button.setMinHeight(dp(52));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.bottomMargin = dp(8);
        parent.addView(button, params);
        button.setOnClickListener(view -> {
            AppWidgetManager manager = AppWidgetManager.getInstance(this);
            Bundle previewExtras = null;
            if (provider == ClockWidget.WideMotion.class) {
                previewExtras = new Bundle();
                previewExtras.putParcelable(AppWidgetManager.EXTRA_APPWIDGET_PREVIEW,
                        new RemoteViews(getPackageName(), R.layout.widget_wide));
            }
            if (!manager.isRequestPinAppWidgetSupported()
                    || !manager.requestPinAppWidget(new ComponentName(this, provider), previewExtras, null)) {
                Toast.makeText(this, "请长按桌面，从小组件列表添加「大肥鱼时钟」。", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showMotionPreview(LinearLayout parent, Button button) {
        RemoteViews preview = new RemoteViews(getPackageName(), R.layout.widget_wide_motion);
        NativeWeather.bindRow(this, preview);
        android.view.View card = preview.apply(this, parent);
        card.setBackgroundColor(0xff112743);
        int afterButton = parent.indexOfChild(button) + 1;
        parent.addView(card, afterButton, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(170)));
        button.setEnabled(false);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
