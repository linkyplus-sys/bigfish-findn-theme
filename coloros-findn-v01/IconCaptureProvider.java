package cn.bigfish.findn.icons;

import android.content.ComponentName;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public final class IconCaptureProvider extends ContentProvider {
    private static final int SIDE = 256;

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        Context context = getContext();
        if (context == null) throw new FileNotFoundException("Icon capture is unavailable");
        context.enforceCallingOrSelfPermission("android.permission.DUMP", "Icon capture is for ADB");
        String requested = uri.getQueryParameter("apps");
        List<String> components = requested == null ? Arrays.asList() : Arrays.asList(requested.split(","));
        if (!"r".equals(mode) || !"/icons".equals(uri.getPath()) || components.isEmpty() || components.size() > 16) {
            throw new FileNotFoundException("Expected a read-only request for 1 to 16 launcher icons");
        }
        return openPipeHelper(uri, "application/zip", null, components,
                (pipe, request, mime, options, apps) -> writeIcons(context.getPackageManager(), pipe, apps));
    }

    private static void writeIcons(PackageManager packages, ParcelFileDescriptor pipe, List<String> apps) {
        try (ZipOutputStream output = new ZipOutputStream(new ParcelFileDescriptor.AutoCloseOutputStream(pipe))) {
            for (int i = 0; i < apps.size(); i++) {
                ComponentName component = ComponentName.unflattenFromString(apps.get(i));
                if (component == null) continue;
                Drawable original;
                try {
                    original = packages.getActivityIcon(component);
                } catch (PackageManager.NameNotFoundException missing) {
                    continue;
                }
                Bitmap icon = toBitmap(original);
                try {
                    output.putNextEntry(new ZipEntry(i + ".png"));
                    if (!icon.compress(Bitmap.CompressFormat.PNG, 100, output)) {
                        throw new IOException("Could not encode launcher icon");
                    }
                    output.closeEntry();
                } finally {
                    icon.recycle();
                }
            }
        } catch (IOException closed) {
            // The caller may disconnect while receiving the archive.
        }
    }

    private static Bitmap toBitmap(Drawable original) {
        if (original instanceof AdaptiveIconDrawable) {
            Bitmap foreground = draw(((AdaptiveIconDrawable) original).getForeground());
            int[] alpha = new int[SIDE * SIDE];
            foreground.getPixels(alpha, 0, SIDE, 0, 0, SIDE, SIDE);
            int colored = 0;
            for (int pixel : alpha) if ((pixel >>> 24) > 32) colored++;
            if (colored > SIDE * SIDE / 100 && colored < SIDE * SIDE * 82 / 100) return foreground;
            foreground.recycle();
        }
        Bitmap rendered = draw(original);
        removeWhiteBackplate(rendered);
        return rendered;
    }

    private static void removeWhiteBackplate(Bitmap icon) {
        int[] pixels = new int[SIDE * SIDE];
        icon.getPixels(pixels, 0, SIDE, 0, 0, SIDE, SIDE);
        int left = SIDE;
        int top = SIDE;
        int right = -1;
        int bottom = -1;
        int opaquePixels = 0;
        for (int y = 0; y < SIDE; y++) {
            for (int x = 0; x < SIDE; x++) {
                if ((pixels[y * SIDE + x] >>> 24) < 96) continue;
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                opaquePixels++;
            }
        }
        if (right - left < 50 || bottom - top < 50) return;

        int centerX = (left + right) / 2;
        int centerY = (top + bottom) / 2;
        int inset = Math.max(3, (right - left) / 20);
        int[] edges = { centerY * SIDE + left + inset, centerY * SIDE + right - inset,
                (top + inset) * SIDE + centerX, (bottom - inset) * SIDE + centerX };
        int[] queue = new int[pixels.length];
        boolean[] visited = new boolean[pixels.length];
        int queued = 0;
        for (int edge : edges) {
            if (isMatteWhite(pixels[edge])) {
                visited[edge] = true;
                queue[queued++] = edge;
            }
        }
        if (queued < 3) return;

        for (int i = 0; i < queued; i++) {
            int point = queue[i];
            int x = point % SIDE;
            int y = point / SIDE;
            if (x > 0) queued = addMatteNeighbor(point - 1, pixels, visited, queue, queued);
            if (x < SIDE - 1) queued = addMatteNeighbor(point + 1, pixels, visited, queue, queued);
            if (y > 0) queued = addMatteNeighbor(point - SIDE, pixels, visited, queue, queued);
            if (y < SIDE - 1) queued = addMatteNeighbor(point + SIDE, pixels, visited, queue, queued);
        }
        if (queued < opaquePixels / 6 || queued > opaquePixels * 9 / 10) return;
        for (int i = 0; i < queued; i++) pixels[queue[i]] = 0;
        icon.setPixels(pixels, 0, SIDE, 0, 0, SIDE, SIDE);
    }

    private static int addMatteNeighbor(int point, int[] pixels, boolean[] visited, int[] queue, int end) {
        if (!visited[point] && isMatteWhite(pixels[point])) {
            visited[point] = true;
            queue[end++] = point;
        }
        return end;
    }

    private static boolean isMatteWhite(int argb) {
        int a = argb >>> 24;
        int r = (argb >>> 16) & 255;
        int g = (argb >>> 8) & 255;
        int b = argb & 255;
        int min = Math.min(r, Math.min(g, b));
        return a >= 32 && min >= 234 && Math.max(r, Math.max(g, b)) - min <= 14;
    }

    private static Bitmap draw(Drawable drawable) {
        Bitmap image = Bitmap.createBitmap(SIDE, SIDE, Bitmap.Config.ARGB_8888);
        if (drawable == null) return image;
        int width = Math.max(1, drawable.getIntrinsicWidth());
        int height = Math.max(1, drawable.getIntrinsicHeight());
        float ratio = (float) SIDE / Math.max(width, height);
        int w = Math.round(width * ratio);
        int h = Math.round(height * ratio);
        int x = (SIDE - w) / 2;
        int y = (SIDE - h) / 2;
        drawable.setBounds(x, y, x + w, y + h);
        drawable.draw(new Canvas(image));
        return image;
    }

    @Override public String getType(Uri uri) { return "application/zip"; }
    @Override public Cursor query(Uri uri, String[] p, String s, String[] a, String sort) { return null; }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String where, String[] args) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String where, String[] args) { throw new UnsupportedOperationException(); }
}
