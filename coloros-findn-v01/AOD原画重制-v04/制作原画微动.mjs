import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = dirname(fileURLToPath(import.meta.url));
const ffmpeg = process.argv[2];
if (!ffmpeg) throw new Error('Pass the ffmpeg executable path as the first argument');
const width = 512, height = 512, fps = 20, duration = 6;
const scale = 0.88, bodyPivotY = 410;
const bodyRotationDegrees = 2.55, bodyShiftPixels = 7.5;
const hairTravelPixels = 24, hairVerticalTravelPixels = 6;
const out = join(root, '交付');
await mkdir(out, { recursive: true });
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => { const n = clamp((v - a) / (b - a)); return n*n*(3-2*n); };

async function pixels(file) {
  const { stdout } = await run(ffmpeg, ['-v','error','-i',file,'-vf',`scale=${width}:${height}:flags=lanczos`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],
    { encoding:'buffer', windowsHide:true, maxBuffer:width*height*4+65536 });
  if (stdout.length !== width*height*4) throw new Error('Invalid image size: '+file);
  return stdout;
}
const master = await pixels(join(root, '素材', '原画配色-睁眼.png'));

// Conservative boundary ABOVE the headband. Everything at/below this line
// stays rigid relative to the head. The left shaft/root is also pinned.
const bandBoundary = [[0,0],[530,92],[580,98],[620,102],[660,112],[700,134],[740,159],[800,190],[1254,0]];
function crownBoundary(x) {
  for(let n=1;n<bandBoundary.length;n++) {
    if(x<=bandBoundary[n][0]) {
      const [ax,ay]=bandBoundary[n-1], [bx,by]=bandBoundary[n];
      return ay+(by-ay)*(x-ax)/(bx-ax);
    }
  }
  return 0;
}
function ahogeWeight(x,y) {
  const px=x/width*1254, py=y/height*1254;
  const boundary=crownBoundary(px);
  return smooth(610,750,px)*(1-smooth(boundary-28,boundary,py));
}

const weights = new Float32Array(width*height*4);
for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const i=(y*width+x)*4, nx=x/width, ny=y/height;
  // Extend the deformation field through transparent pixels. A chroma/alpha
  // gated inverse warp would clip moving silhouettes and leave torn edges.
  const side=smooth(0.13,0.27,Math.abs(nx-0.51));
  const lower=smooth(0.30,0.72,ny);
  weights[i]=side*lower;
  weights[i+2]=1-smooth(0.40,0.48,ny); // head and fins rotate together, preserving face geometry.
  weights[i+3]=smooth(0.43,0.58,ny)*(1-smooth(0.72,0.84,ny))*(1-smooth(0.18,0.29,Math.abs(nx-0.50)));
}

function bilinear(image,x,y,target,at) {
  if(x<0 || x>=width-1 || y<0 || y>=height-1) {target.fill(0,at,at+4);return;}
  const ix=Math.floor(x),iy=Math.floor(y), fx=x-ix,fy=y-iy;
  const q=(iy*width+ix)*4, taps=[q,q+4,q+width*4,q+width*4+4];
  const factors=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
  let alpha=0,r=0,g=0,b=0;
  for(let n=0;n<4;n++) { const k=taps[n],a=image[k+3]/255*factors[n];alpha+=a;r+=image[k]*a;g+=image[k+1]*a;b+=image[k+2]*a; }
  target[at]=alpha>0?r/alpha:0;target[at+1]=alpha>0?g/alpha:0;target[at+2]=alpha>0?b/alpha:0;target[at+3]=alpha*255;
}

function frameAt(t,{isolatedAhoge=false,tipOverride}={}) {
  const output=Buffer.alloc(width*height*4);
  const phase=t/duration*2*Math.PI;
  const sway=isolatedAhoge ? 0 : Math.sin(phase);
  const rotation=bodyRotationDegrees*Math.PI/180*sway;
  const c=Math.cos(rotation),s=Math.sin(rotation);
  const shiftX=bodyShiftPixels*sway, shiftY=isolatedAhoge ? 0 : 2.6*Math.sin(phase*2);
  const headAngle=isolatedAhoge ? 0 : 0.65*Math.PI/180*Math.sin(phase-0.25);
  const hairWave = offset => isolatedAhoge ? 0
    : 0.85*Math.sin(phase-0.75+offset)+0.15*Math.sin(2*phase-0.35+offset);
  const hairXLeft=hairWave(-0.28), hairXRight=hairWave(0.28);
  const hairY=isolatedAhoge ? 0 : hairVerticalTravelPixels*Math.sin(phase-0.95);
  const ahogeWave=tipOverride ?? Math.sin(phase*2-0.4);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const index=(y*width+x)*4;
    // Inverse rigid body transform, around lower torso.
    const u=(x-256-shiftX)/scale,v=(y-bodyPivotY-shiftY)/scale;
    let sx=c*u+s*v+256, sy=-s*u+c*v+bodyPivotY;
    const wx=Math.max(0,Math.min(width-1,Math.round(sx))),wy=Math.max(0,Math.min(height-1,Math.round(sy)));
    const k=(wy*width+wx)*4;
    const head=weights[k+2], angle=headAngle*head;
    const hc=Math.cos(angle),hs=Math.sin(angle),hx=sx-257,hy=sy-231;
    sx=hc*hx+hs*hy+257; sy=-hs*hx+hc*hy+231;
    // Independent secondary motion follows the torso with a deliberate delay.
    // Evaluate the tip mask in head-local coordinates, after undoing head pose.
    // This prevents a changing global pose from sliding the mask over the crown.
    const tip=ahogeWeight(sx,sy);
    const hairX=sx<width/2 ? hairXLeft : hairXRight;
    sx-=weights[k]*hairTravelPixels*hairX+tip*8.0*ahogeWave;
    sy-=weights[k]*hairY+tip*2.0*ahogeWave;
    if(!isolatedAhoge) sy-=weights[k+3]*2.2*Math.sin(phase*2);
    bilinear(master,sx,sy,output,index);
  }
  return output;
}

async function writePng(raw,file) {
  const job=spawn(ffmpeg,['-v','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-i','pipe:0','-frames:v','1',file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let error='';job.stderr.on('data',b=>error+=b);const finished=once(job,'close');job.stdin.end(raw);const [code]=await finished;if(code)throw new Error(error);
}
const encoder=spawn(ffmpeg,['-v','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-framerate',String(fps),'-i','pipe:0','-an','-c:v','ffv1','-pix_fmt','bgra',join(out,'原画微动-透明母片.mkv')],{windowsHide:true,stdio:['pipe','ignore','pipe']});
let error='';encoder.stderr.on('data',b=>error+=b);const finished=once(encoder,'close');
for(let frame=0;frame<fps*duration;frame++) {
  const rgba=frameAt(frame/fps);
  if(!encoder.stdin.write(rgba)) await once(encoder.stdin,'drain');
  if(frame%fps===0) console.log('render '+frame/fps+'s');
}
encoder.stdin.end();const [code]=await finished;if(code)throw new Error(error);
await writePng(frameAt(1.5),join(out,'验收-右摆.png'));
await writePng(frameAt(4.5),join(out,'验收-左摆.png'));
const tipLeft=frameAt(0,{isolatedAhoge:true,tipOverride:-1});
const tipRight=frameAt(0,{isolatedAhoge:true,tipOverride:1});
await writePng(tipLeft,join(out,'验收-呆毛左极值.png'));
await writePng(tipRight,join(out,'验收-呆毛右极值.png'));
// In the isolated-tip test, the protected crown/root and the entire lower
// character must be pixel-identical. Other body/head movement is excluded.
let protectedChanges=0, tipChanges=0;
for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const at=(y*width+x)*4;
  if(!tipLeft.subarray(at,at+4).equals(tipRight.subarray(at,at+4))) {
    const localX=(x-256)/scale+256, localY=(y-bodyPivotY)/scale+bodyPivotY;
    if(ahogeWeight(localX,localY)===0) protectedChanges++;
    else tipChanges++;
  }
}
if(protectedChanges || !tipChanges) throw new Error(`Ahoge isolation failed: protected=${protectedChanges}, tip=${tipChanges}`);
await writeFile(join(root,'动效规范.json'),JSON.stringify({
  source:'原始非Q版立绘，重新提取上半身，保持原画配色与对比度',duration,fps,width,height,
  globalColorAdjustment:'none',eyeMethod:'open-eye master for every frame',blink:false,
  bodyRotationDegrees,bodyShiftPixels,headExtraRotationDegrees:0.65,
  hairTravelPixels,hairVerticalTravelPixels,ahogeTipTravelPixels:8,ahogeRootTravelPixels:0,breathTravelPixels:2.2,
  ahogeIsolationCheck:{protectedChangedPixels:protectedChanges,movingTipPixels:tipChanges},
},null,2)+'\n');
console.log('done');
