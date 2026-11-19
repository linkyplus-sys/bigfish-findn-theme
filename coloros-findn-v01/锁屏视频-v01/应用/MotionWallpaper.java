package cn.bigfish.findn.motion;

import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLSurface;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLUtils;
import android.opengl.Matrix;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.PowerManager;
import android.service.wallpaper.WallpaperService;
import android.util.Log;
import android.view.Surface;
import android.view.SurfaceHolder;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

/** One GL producer: static bitmap on the desktop, muted video on the keyguard. */
public final class MotionWallpaper extends WallpaperService {
    private static final String TAG="BigFishLockVideo";
    @Override public Engine onCreateEngine(){ return new LockEngine(); }

    private final class LockEngine extends Engine {
        private final HandlerThread thread=new HandlerThread("BigFish-wallpaper");
        private final Handler gl;
        private final KeyguardManager keyguard=(KeyguardManager)getSystemService(KEYGUARD_SERVICE);
        private final PowerManager power=(PowerManager)getSystemService(POWER_SERVICE);
        private EGLDisplay display=EGL14.EGL_NO_DISPLAY;
        private EGLContext context=EGL14.EGL_NO_CONTEXT;
        private EGLSurface window=EGL14.EGL_NO_SURFACE;
        private int staticTexture, videoTexture, staticProgram, videoProgram;
        private int width,height,photoWidth,photoHeight,videoWidth,videoHeight;
        private SurfaceTexture frames;
        private Surface videoSurface;
        private MediaPlayer player;
        private boolean visible,alive,videoMode,prepared,hasFrame;
        private String layout;
        private long probeUntil;
        private final FloatBuffer positions=floats(-1,-1,1,-1,-1,1,1,1);
        private final FloatBuffer uv=floats(0,0,1,0,0,1,1,1);
        private final float[] matrix=new float[16];
        private final BroadcastReceiver events=new BroadcastReceiver(){
            @Override public void onReceive(Context c,Intent event){
                gl.post(()->{
                    probeUntil=android.os.SystemClock.uptimeMillis()+2000;
                    gl.removeCallbacks(probe);
                    probe.run();
                });
            }
        };
        private final Runnable probe=new Runnable(){
            @Override public void run(){
                if(!alive)return;
                syncMode();
                // Keep observing while the lock video is active. OEM keyguard
                // dismissal (including wm dismiss-keyguard) need not send
                // USER_PRESENT to an app receiver.
                if((visible && videoMode) || android.os.SystemClock.uptimeMillis()<probeUntil)gl.postDelayed(this,100);
            }
        };

        LockEngine(){
            thread.start(); gl=new Handler(thread.getLooper());
            IntentFilter filter=new IntentFilter();
            filter.addAction(Intent.ACTION_SCREEN_ON);filter.addAction(Intent.ACTION_SCREEN_OFF);
            filter.addAction(Intent.ACTION_USER_PRESENT);
            registerReceiver(events,filter,Context.RECEIVER_EXPORTED);
            setTouchEventsEnabled(false);setOffsetNotificationsEnabled(false);
        }
        @Override public void onSurfaceChanged(SurfaceHolder holder,int format,int w,int h){
            gl.post(()->{
                try{
                    destroyGl();width=w;height=h;
                    layout=(double)w/h>=0.82?"inner":"cover";
                    initGl(holder.getSurface());alive=true;
                    drawStatic();syncMode();
                    Log.i(TAG,"Surface "+w+"x"+h+" layout="+layout+" preview="+isPreview());
                }catch(Exception error){Log.e(TAG,"Surface setup failed",error);destroyGl();}
            });
        }
        @Override public void onVisibilityChanged(boolean shown){
            gl.post(()->{
                visible=shown;probeUntil=android.os.SystemClock.uptimeMillis()+2000;
                gl.removeCallbacks(probe);probe.run();
            });
        }
        @Override public void onSurfaceDestroyed(SurfaceHolder holder){
            gl.post(()->{gl.removeCallbacks(probe);destroyGl();});super.onSurfaceDestroyed(holder);
        }
        @Override public void onDestroy(){
            unregisterReceiver(events);
            gl.post(()->{gl.removeCallbacksAndMessages(null);destroyGl();thread.quitSafely();});
            super.onDestroy();
        }
        private void syncMode(){
            if(!alive)return;
            boolean wanted=visible && power.isInteractive() && (isPreview() || keyguard.isKeyguardLocked());
            if(wanted){
                if(!videoMode){videoMode=true;openVideo();Log.i(TAG,"LOCK_VIDEO "+layout);}
                else if(prepared && player!=null && !player.isPlaying())player.start();
            }else{
                if(videoMode || player!=null){videoMode=false;closeVideo();drawStatic();Log.i(TAG,"HOME_STATIC "+layout);}
            }
        }
        private void initGl(Surface surface)throws Exception{
            display=EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);
            int[] version=new int[2];
            if(!EGL14.eglInitialize(display,version,0,version,1))throw new IllegalStateException("EGL initialize");
            int[] spec={EGL14.EGL_RENDERABLE_TYPE,EGL14.EGL_OPENGL_ES2_BIT,EGL14.EGL_SURFACE_TYPE,EGL14.EGL_WINDOW_BIT,EGL14.EGL_RED_SIZE,8,EGL14.EGL_GREEN_SIZE,8,EGL14.EGL_BLUE_SIZE,8,EGL14.EGL_ALPHA_SIZE,8,EGL14.EGL_NONE};
            EGLConfig[] configs=new EGLConfig[1];int[] count=new int[1];
            EGL14.eglChooseConfig(display,spec,0,configs,0,1,count,0);
            context=EGL14.eglCreateContext(display,configs[0],EGL14.EGL_NO_CONTEXT,new int[]{EGL14.EGL_CONTEXT_CLIENT_VERSION,2,EGL14.EGL_NONE},0);
            window=EGL14.eglCreateWindowSurface(display,configs[0],surface,new int[]{EGL14.EGL_NONE},0);
            if(!EGL14.eglMakeCurrent(display,window,window,context))throw new IllegalStateException("EGL makeCurrent");
            staticProgram=program(false);videoProgram=program(true);
            staticTexture=texture(GLES20.GL_TEXTURE_2D);videoTexture=texture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES);
            try(java.io.InputStream stream=getAssets().open(layout+"-home.jpg")){
                Bitmap bitmap=BitmapFactory.decodeStream(stream);photoWidth=bitmap.getWidth();photoHeight=bitmap.getHeight();
                GLES20.glBindTexture(GLES20.GL_TEXTURE_2D,staticTexture);GLUtils.texImage2D(GLES20.GL_TEXTURE_2D,0,bitmap,0);bitmap.recycle();
            }
            frames=new SurfaceTexture(videoTexture);videoSurface=new Surface(frames);
            frames.setOnFrameAvailableListener(source->{
                if(!alive || source!=frames)return;
                try{
                    source.updateTexImage();source.getTransformMatrix(matrix);hasFrame=true;
                    if(videoMode && visible)draw(true);
                }catch(RuntimeException error){Log.w(TAG,"Video frame unavailable",error);}
            },gl);
            GLES20.glViewport(0,0,width,height);
        }
        private void openVideo(){
            if(player!=null)return;
            hasFrame=false;prepared=false;
            MediaPlayer next=new MediaPlayer();player=next;
            try(AssetFileDescriptor asset=getAssets().openFd(layout+".mp4")){
                next.setDataSource(asset.getFileDescriptor(),asset.getStartOffset(),asset.getLength());
                next.setSurface(videoSurface);next.setVolume(0,0);next.setLooping(true);
                next.setOnPreparedListener(ready->{
                    if(ready!=player)return;
                    videoWidth=ready.getVideoWidth();videoHeight=ready.getVideoHeight();prepared=true;
                    if(videoMode && visible)ready.start();
                });
                next.setOnErrorListener((failed,what,extra)->{
                    Log.e(TAG,"Video error "+what+"/"+extra);if(failed==player){closeVideo();drawStatic();}return true;
                });
                next.prepareAsync();
            }catch(Exception error){Log.e(TAG,"Cannot play video",error);closeVideo();drawStatic();}
        }
        private void closeVideo(){
            prepared=false;hasFrame=false;
            if(player!=null){player.setSurface(null);player.release();player=null;}
        }
        private void drawStatic(){
            Matrix.setIdentityM(matrix,0);matrix[5]=-1;matrix[13]=1;
            draw(false);
        }
        private void draw(boolean video){
            if(display==EGL14.EGL_NO_DISPLAY || (video && !hasFrame))return;
            int p=video?videoProgram:staticProgram;
            GLES20.glClearColor(0,0,0,1);GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);GLES20.glUseProgram(p);
            int position=GLES20.glGetAttribLocation(p,"position"),tex=GLES20.glGetAttribLocation(p,"uv");
            positions.position(0);uv.position(0);
            GLES20.glVertexAttribPointer(position,2,GLES20.GL_FLOAT,false,0,positions);GLES20.glEnableVertexAttribArray(position);
            GLES20.glVertexAttribPointer(tex,2,GLES20.GL_FLOAT,false,0,uv);GLES20.glEnableVertexAttribArray(tex);
            float src=(float)(video?videoWidth:photoWidth)/(video?videoHeight:photoHeight),dst=(float)width/height;
            float cw=1,ch=1;if(src>dst)cw=dst/src;else ch=src/dst;
            GLES20.glUniform4f(GLES20.glGetUniformLocation(p,"crop"),(1-cw)/2,(1-ch)/2,cw,ch);
            GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(p,"transform"),1,false,matrix,0);
            GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
            GLES20.glBindTexture(video?GLES11Ext.GL_TEXTURE_EXTERNAL_OES:GLES20.GL_TEXTURE_2D,video?videoTexture:staticTexture);
            GLES20.glUniform1i(GLES20.glGetUniformLocation(p,"image"),0);
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP,0,4);EGL14.eglSwapBuffers(display,window);
        }
        private int texture(int target){
            int[] ids=new int[1];GLES20.glGenTextures(1,ids,0);GLES20.glBindTexture(target,ids[0]);
            GLES20.glTexParameteri(target,GLES20.GL_TEXTURE_MIN_FILTER,GLES20.GL_LINEAR);
            GLES20.glTexParameteri(target,GLES20.GL_TEXTURE_MAG_FILTER,GLES20.GL_LINEAR);
            GLES20.glTexParameteri(target,GLES20.GL_TEXTURE_WRAP_S,GLES20.GL_CLAMP_TO_EDGE);
            GLES20.glTexParameteri(target,GLES20.GL_TEXTURE_WRAP_T,GLES20.GL_CLAMP_TO_EDGE);return ids[0];
        }
        private int shader(int type,String source){
            int s=GLES20.glCreateShader(type);GLES20.glShaderSource(s,source);GLES20.glCompileShader(s);
            int[] ok=new int[1];GLES20.glGetShaderiv(s,GLES20.GL_COMPILE_STATUS,ok,0);
            if(ok[0]==0)throw new IllegalStateException(GLES20.glGetShaderInfoLog(s));return s;
        }
        private int program(boolean external){
            String vs="attribute vec2 position; attribute vec2 uv; uniform mat4 transform; uniform vec4 crop; varying vec2 coord; void main(){gl_Position=vec4(position,0.,1.);coord=(transform*vec4(uv*crop.zw+crop.xy,0.,1.)).xy;}";
            String fs=(external?"#extension GL_OES_EGL_image_external : require\n":"")+"precision mediump float; varying vec2 coord; uniform "+(external?"samplerExternalOES":"sampler2D")+" image; void main(){gl_FragColor=texture2D(image,coord);}";
            int v=shader(GLES20.GL_VERTEX_SHADER,vs),f=shader(GLES20.GL_FRAGMENT_SHADER,fs),p=GLES20.glCreateProgram();
            GLES20.glAttachShader(p,v);GLES20.glAttachShader(p,f);GLES20.glLinkProgram(p);GLES20.glDeleteShader(v);GLES20.glDeleteShader(f);
            int[] ok=new int[1];GLES20.glGetProgramiv(p,GLES20.GL_LINK_STATUS,ok,0);if(ok[0]==0)throw new IllegalStateException(GLES20.glGetProgramInfoLog(p));return p;
        }
        private void destroyGl(){
            alive=false;videoMode=false;closeVideo();
            if(videoSurface!=null){videoSurface.release();videoSurface=null;}
            if(frames!=null){frames.release();frames=null;}
            if(display!=EGL14.EGL_NO_DISPLAY){
                GLES20.glDeleteTextures(2,new int[]{staticTexture,videoTexture},0);
                if(staticProgram!=0)GLES20.glDeleteProgram(staticProgram);if(videoProgram!=0)GLES20.glDeleteProgram(videoProgram);
                EGL14.eglMakeCurrent(display,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_CONTEXT);
                if(window!=EGL14.EGL_NO_SURFACE)EGL14.eglDestroySurface(display,window);
                if(context!=EGL14.EGL_NO_CONTEXT)EGL14.eglDestroyContext(display,context);
                EGL14.eglTerminate(display);EGL14.eglReleaseThread();
            }
            display=EGL14.EGL_NO_DISPLAY;window=EGL14.EGL_NO_SURFACE;context=EGL14.EGL_NO_CONTEXT;
        }
        private FloatBuffer floats(float... values){
            FloatBuffer buffer=ByteBuffer.allocateDirect(values.length*4).order(ByteOrder.nativeOrder()).asFloatBuffer();buffer.put(values).position(0);return buffer;
        }
    }
}
