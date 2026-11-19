package cn.bigfish.findn.icons;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.TextView;

public final class PackActivity extends Activity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        TextView contents = new TextView(this);
        contents.setGravity(Gravity.CENTER);
        int inset = Math.round(32 * getResources().getDisplayMetrics().density);
        contents.setPadding(inset, inset, inset, inset);
        contents.setTextSize(17);
        contents.setText(getApplicationInfo().loadLabel(getPackageManager())
                + "\n\n双指捏合桌面，进入「图标」选择本图标包。"
                + "\n也可从「设置 → 壁纸与个性化 → 图标」进入。");
        setContentView(contents);
    }
}
