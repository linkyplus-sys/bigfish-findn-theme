import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = dirname(fileURLToPath(import.meta.url));
const [ffmpeg, artworkPath, outputPath] = process.argv.slice(2);
if (!ffmpeg) throw new Error('Pass the ffmpeg executable path as the first argument');
const width = 512, height = 512, fps = 20, duration = 6;
const artworkSize = 1254;
const scale = 0.88, bodyPivotY = 410;
const bodyRotationDegrees = 2.55, bodyShiftPixels = 7.5;
const hairTravelPixels = 24, hairVerticalTravelPixels = 6;
const releaseRoot = outputPath ? resolve(outputPath) : root;
const out = join(releaseRoot, '交付');
await mkdir(out, { recursive: true });
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => { const n = clamp((v - a) / (b - a)); return n*n*(3-2*n); };

async function pixels(file) {
  const { stdout } = await run(ffmpeg, ['-v','error','-i',file,'-vf',`scale=${width}:${height}:flags=lanczos`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],
    { encoding:'buffer', windowsHide:true, maxBuffer:width*height*4+65536 });
  if (stdout.length !== width*height*4) throw new Error('Invalid image size: '+file);
  return stdout;
}
const masterPath = artworkPath ? resolve(artworkPath) : join(root, '素材', '右手补全-睁眼.png');
const master = await pixels(masterPath);

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
  const px=x/width*artworkSize, py=y/height*artworkSize;
  const boundary=crownBoundary(px);
  return smooth(610,750,px)*(1-smooth(boundary-28,boundary,py));
}

// Conservative outer edges of the sleeves, arms, and dress in the 1254 px master.
const bodyOutline = [
  [0, 472, 874], [560, 472, 874], [670, 420, 890], [740, 373, 908],
  [850, 352, 913], [900, 385, 887], [980, 348, 902], [1060, 318, 871],
  [1135, 318, 846], [1180, 328, 813], [1254, 365, 803],
];
const hairWeights = new Float32Array(width*height);
const headWeights = new Float32Array(height);
const hairClearance = (hairTravelPixels + hairVerticalTravelPixels) * artworkSize / width;
let protectedBodySamples = 0;
let outlineSegment = 1;
for (let y=0; y<height; y++) {
  const artworkY=y/height*artworkSize;
  while (artworkY>bodyOutline[outlineSegment][0]) outlineSegment++;
  const [y0,left0,right0]=bodyOutline[outlineSegment-1];
  const [y1,left1,right1]=bodyOutline[outlineSegment];
  const fraction=(artworkY-y0)/(y1-y0);
  const left=left0+(left1-left0)*fraction;
  const right=right0+(right1-right0)*fraction;
  headWeights[y]=1-smooth(0.40,0.48,y/height);
  const looseHair=smooth(530,880,artworkY);
  for (let x=0; x<width; x++) {
    const artworkX=x/width*artworkSize;
    const distanceFromBody=Math.max(left-artworkX,artworkX-right);
    const hair=smooth(hairClearance,hairClearance+140,distanceFromBody)*looseHair;
    // The clearance keeps inverse hair sampling from crossing into either arm.
    // The field extends through transparent pixels so moving hair isn't clipped.
    hairWeights[y*width+x]=hair;
    if (artworkY>=640 && distanceFromBody<=0) {
      if (hair || headWeights[y] || ahogeWeight(x,y)) throw new Error('Nonrigid motion inside the body outline');
      protectedBodySamples++;
    }
  }
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
    const hair=hairWeights[wy*width+wx];
    const angle=headAngle*headWeights[wy];
    const hc=Math.cos(angle),hs=Math.sin(angle),hx=sx-257,hy=sy-231;
    sx=hc*hx+hs*hy+257; sy=-hs*hx+hc*hy+231;
    // Independent secondary motion follows the torso with a deliberate delay.
    // Evaluate the tip mask in head-local coordinates, after undoing head pose.
    // This prevents a changing global pose from sliding the mask over the crown.
    const tip=ahogeWeight(sx,sy);
    const hairX=sx<width/2 ? hairXLeft : hairXRight;
    sx-=hair*hairTravelPixels*hairX+tip*8.0*ahogeWave;
    sy-=hair*hairY+tip*2.0*ahogeWave;
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
await writeFile(join(releaseRoot,'动效规范.json'),JSON.stringify({
  source:'素材/右手补全-睁眼.png',duration,fps,width,height,
  globalColorAdjustment:'none',eyeMethod:'open-eye master for every frame',blink:false,
  bodyRotationDegrees,bodyShiftPixels,headExtraRotationDegrees:0.65,
  hairTravelPixels,hairVerticalTravelPixels,ahogeTipTravelPixels:8,ahogeRootTravelPixels:0,
  armMotion:'rigid with torso',protectedBodySamples,
  ahogeIsolationCheck:{protectedChangedPixels:protectedChanges,movingTipPixels:tipChanges},
},null,2)+'\n');
console.log('done');
