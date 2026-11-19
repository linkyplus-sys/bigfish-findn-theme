package cn.bigfish.findn.motion;

import android.app.Activity;
import android.app.WallpaperManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

public final class PreviewActivity extends Activity {
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Intent preview = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
        preview.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                new ComponentName(this, MotionWallpaper.class));
        try {
            startActivity(preview);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "系统未提供动态壁纸预览入口", Toast.LENGTH_LONG).show();
        }
        finish();
    }
}
