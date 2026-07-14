import { W, H } from './physics.js?v=3';
import { REGIONS } from './scene.js?v=3';
import { TOOLS } from './modules/index.js?v=3';

export let ctx = null;
export function setCtx(c) { ctx = c; }

export const PAPER='#EFEAE0';
export const INK='#2B2B33';
export const FAINT='#8f8a7d';
export const VERM='#C1442E';
export const PCOL={blue:'#3E6B9E',ochre:'#C9973B',rust:'#A8542F',grey:'#8A8577', magenta:'#C93B8A', green:'#4CAF50', cyan:'#00BCD4', white:'#FFFFFF'};

export let wobbleSeed=0;
export let INK_FADE=1;

export function setWobbleSeed(s) { wobbleSeed = s; }
export function setInkFade(f) { INK_FADE = f; }

export function hash(x,y,s){const v=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return (v-Math.floor(v))*2-1;}
export function roughPts(pts,amp,seed){
  const out=[];
  for(let i=0;i<pts.length-1;i++){
    const x1=pts[i][0],y1=pts[i][1],x2=pts[i+1][0],y2=pts[i+1][1];
    const d=Math.hypot(x2-x1,y2-y1);
    const n=Math.max(2,Math.ceil(d/26));
    for(let k=0;k<n;k++){
      const t=k/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
      out.push([x+hash(x,y,seed)*amp,y+hash(y,x,seed+9)*amp]);
    }
  }
  out.push(pts[pts.length-1].slice());
  return out;
}
export function polyLen(pts){let L=0;for(let i=0;i<pts.length-1;i++)L+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);return L;}
export function strokePoly(pts,p){
  if(p<=0.005)return;
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  if(p<0.995){const L=polyLen(pts);ctx.setLineDash([L,L]);ctx.lineDashOffset=L*(1-p);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;}
  else ctx.stroke();
}
export function rline(pts,p,amp,seed){strokePoly(roughPts(pts,amp,seed+wobbleSeed),p);}
export function circlePts(cx,cy,r){const pts=[],n=Math.max(10,Math.ceil(r/3));
  for(let i=0;i<=n;i++){const a=Math.PI*2*i/n;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return pts;}
export function rcircle(cx,cy,r,p,amp,seed){rline(circlePts(cx,cy,r),p,amp,seed);}
export function rrectO(x,y,w,h,p,amp,seed){rline([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],p,amp,seed);}
export function styleFaint(){ctx.strokeStyle=FAINT;ctx.lineWidth=1.15;ctx.globalAlpha=.44*INK_FADE;ctx.lineJoin='round';ctx.lineCap='round';}
export function styleCrisp(){ctx.strokeStyle=INK;ctx.lineWidth=2.1;ctx.globalAlpha=.92*INK_FADE;ctx.lineJoin='round';ctx.lineCap='round';}

export const REG={};
export const REG_META=[
  {id:'intake',  color:'#4E8F86', label:[300,102]},
  {id:'sorter',  color:'#C9973B', label:[464,300]},
  {id:'crushers',color:'#883333', label:[120,180]},
  {id:'painters',color:'#C93B8A', label:[200,400]},
  {id:'pinball', color:'#3E6B9E', label:[450,750]},
  {id:'skyway',  color:'#3E6B9E', label:[940,92]},
  {id:'works',   color:'#7A5C88', label:[742,354]},
  {id:'carousel',color:'#9C6B30', label:[1040,364]},
  {id:'check',   color:'#B4593A', label:[1326,468]},
  {id:'dispatch',color:'#7C8A4C', label:[1176,762]},
];
for(const m of REG_META)REG[m.id]={...m,crisp:0,mot:1,wash:0,labelA:0,motionTime:0};

export const BOXES={};for(const r of REGIONS)BOXES[r.id]=r.boxes;
export const SURF_BY_REG={};

export function initRender(world) {
  for(const sf of world.surfaces)(SURF_BY_REG[sf.region]=SURF_BY_REG[sf.region]||[]).push(sf);
}

export function drawBelt(sf,pass,p,amp,seed,mt){
  rline([[sf.x1,sf.y1],[sf.x2,sf.y2]],p,amp,seed);
  const spin=mt*sf.speed/7;
  for(const e of [[sf.x1,sf.y1],[sf.x2,sf.y2]]){
    rcircle(e[0],e[1],7,p,amp,seed+3);
    for(let i=0;i<3;i++){
      const a=spin+i*Math.PI*2/3;
      rline([[e[0],e[1]],[e[0]+Math.cos(a)*5.5,e[1]+Math.sin(a)*5.5]],p,amp*.5,seed+5+i);
    }
    seed+=40;
  }
  if(pass==='crisp'){
    const step=32,off=((mt*sf.speed)%step+step)%step;
    const ux=sf.tx,uy=sf.ty;
    for(let d=off;d<sf.len;d+=step){
      const x=sf.x1+ux*d,y=sf.y1+uy*d;
      rline([[x,y-3],[x+6,y+3]],p,amp*.45,seed+Math.floor(d/step));
    }
  }
}
export function drawSurfacesFor(regId,pass,p,amp){
  const list=SURF_BY_REG[regId]||[];
  let seed=(pass==='faint'?300:800)+regId.length*17;
  const mt=REG[regId].motionTime;
  for(const sf of list){
    if(sf.kind==='belt')drawBelt(sf,pass,p,amp,seed,mt);
    else rline([[sf.x1,sf.y1],[sf.x2,sf.y2]],p,amp,seed);
    seed+=90;
  }
}
export function hatch(x,y,w,h,n,p,amp,seed){
  for(let i=0;i<n;i++)
    rline([[x+5+i*(w-10)/n,y+h-4],[x+5+i*(w-10)/n+11,y+5]],Math.min(1,p*1.2),amp*.55,seed+i);
}
export function drawBin(b,p,amp,seed,hatched,isOpen=false){
  if(isOpen){
    rline([[b.x,b.y+b.h],[b.x-20,b.y+b.h+20]],p,amp,seed+2);
    rline([[b.x+b.w,b.y+b.h],[b.x+b.w+20,b.y+b.h+20]],p,amp,seed+3);
  } else {
    rline([[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]],p,amp,seed);
  }
  if(hatched)hatch(b.x,b.y,b.w,b.h,4,p,amp,seed+9);
}
export function drawEye(x,y,r,p,amp,seed){
  rcircle(x,y,r,p,amp,seed);
  rcircle(x,y,r*0.32,Math.min(1,p*1.35),amp*.6,seed+2);
  for(let i=0;i<3;i++){
    const a=-0.75+i*0.55;
    rline([[x+Math.cos(a)*(r+2),y+Math.sin(a)*(r+2)],[x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7)]],p,amp*.5,seed+4+i);
  }
}

export function drawActuators(world,regId,pass,p,amp){
  if(TOOLS[regId] && TOOLS[regId].render){
     TOOLS[regId].render(ctx, world, REG[regId], pass, p, amp);
  }
}
export function drawWash(r, live){
  if(r.wash<=0.01)return;
  ctx.save();
  ctx.globalAlpha=r.wash*0.12*(1-live.dim*0.75);
  ctx.fillStyle=r.color;
  for(const b of BOXES[r.id]){
    const pts=roughPts([[b[0],b[1]],[b[0]+b[2],b[1]],[b[0]+b[2],b[1]+b[3]],[b[0],b[1]+b[3]],[b[0],b[1]]],9,b[0]);
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(const q of pts)ctx.lineTo(q[0],q[1]);
    ctx.fill();
  }
  ctx.restore();
}
export function drawLabel(r, live){
  const etching=r.crisp>0.06&&r.labelA<0.5;
  const a=etching?0.5:r.labelA;
  if(a<=0.02)return;
  ctx.save();
  ctx.globalAlpha=a*(1-live.dim*0.7);
  ctx.fillStyle=INK;
  ctx.font='600 30px Caveat, cursive';
  ctx.fillText(etching?'?':r.id,r.label[0],r.label[1]);
  if(!etching&&r.labelA>0.5){
    ctx.strokeStyle=INK;ctx.lineWidth=1.6;
    const w=ctx.measureText(r.id).width;
    strokePoly(roughPts([[r.label[0]-2,r.label[1]+7],[r.label[0]+w+4,r.label[1]+5]],1.4,r.label[0]),1);
  }
  ctx.restore();
}
export function drawParcel(p2, live){
  const isHero=p2.hero&&live.heroA>0.05;
  let alpha=p2.bin ? (p2.bin === 'grey' || p2.bin === 'blue' ? 0.9 : Math.max(0,1-p2.fade/7)*0.85) : 0.9;
  if(!isHero)alpha*=(1-live.dim*0.8);
  if(alpha<=0.02)return;
  const w=p2.wid,h=p2.hgt,x=p2.x,y=p2.y;
  ctx.save();
  ctx.globalAlpha=alpha*0.55;
  ctx.fillStyle=PCOL[p2.color];
  
  if (p2.shape === 'circle') {
     ctx.beginPath(); ctx.arc(x, y - h/2 + 0.5, w/2 - 1, 0, Math.PI * 2); ctx.fill();
  } else if (p2.shape === 'triangle') {
     ctx.beginPath(); ctx.moveTo(x, y - h + 1); ctx.lineTo(x + w/2 - 1, y); ctx.lineTo(x - w/2 + 1, y); ctx.fill();
  } else {
     ctx.fillRect(x-w/2+1,y-h+1,w-2,h-2);
  }

  ctx.globalAlpha=alpha;
  ctx.strokeStyle=isHero?VERM:INK;
  ctx.lineWidth=isHero?2.5:1.5;
  ctx.lineJoin='round';ctx.lineCap='round';
  
  if (p2.shape === 'circle') {
     rcircle(x, y - h/2, w/2, 1, 1.1, p2.id*7);
  } else if (p2.shape === 'triangle') {
     rline([[x, y-h], [x+w/2, y], [x-w/2, y], [x, y-h]], 1, 1.1, p2.id*7);
  } else {
     rrectO(x-w/2,y-h,w,h,1,1.1,p2.id*7);
     rline([[x,y-h],[x,y]],1,0.9,p2.id*7+5);
  }

  ctx.save();
  ctx.fillStyle=INK;
  ctx.font='700 9px monospace';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.globalAlpha = alpha;
  const ny = p2.shape === 'triangle' ? y - h/2 + 2 : y - h/2;
  if (p2.number !== null) {
    ctx.fillText(p2.number, x, ny);
  }
  ctx.restore();

  if(p2.tool>=0){
    ctx.lineWidth=1.1;
    const gy=y-h-3;
    if(p2.tool===0){rline([[x-3,gy],[x+3,gy]],1,.5,p2.id*7+11);rline([[x,gy-3],[x,gy+3]],1,.5,p2.id*7+12);}
    if(p2.tool===1){rcircle(x,gy,2.2,1,.4,p2.id*7+13);}
    if(p2.tool===2){rline([[x-3,gy+2],[x+3,gy-2]],1,.5,p2.id*7+14);}
  }
  ctx.restore();
}

export function render(cv, world, live) {
  const dpr=window.devicePixelRatio||1;
  const cw=window.innerWidth,ch=window.innerHeight;
  if(cv.width!==cw*dpr||cv.height!==ch*dpr){
    cv.width=cw*dpr;cv.height=ch*dpr;
    cv.style.width=cw+'px';cv.style.height=ch+'px';
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,cw,ch);
  ctx.globalAlpha=0.05;ctx.fillStyle=INK;
  for(let i=0;i<70;i++)ctx.fillRect((hash(i,7,3)+1)/2*cw,(hash(i,13,5)+1)/2*ch,1.4,1.4);
  ctx.globalAlpha=1;

  const base=Math.min(cw/W,ch/H)*0.94;
  const s=base*live.cam.z;
  ctx.translate(cw/2,ch/2);ctx.scale(s,s);ctx.translate(-live.cam.x,-live.cam.y);
  setInkFade(1-live.dim*0.62);

  for(const id in REG)drawWash(REG[id], live);
  styleFaint();
  for(const id in REG){drawSurfacesFor(id,'faint',1,2.5);drawActuators(world,id,'faint',1,2.5);}
  for(const id in REG){
    const r=REG[id];
    if(r.crisp>0.005){
      styleCrisp();
      drawSurfacesFor(id,'crisp',r.crisp,1.6);
      drawActuators(world,id,'crisp',r.crisp,1.6);
    }
  }
  for(const id in REG)drawLabel(REG[id], live);

  for(const id in REG) {
    if (TOOLS[id] && TOOLS[id].renderGlyph) {
       TOOLS[id].renderGlyph(ctx, world, REG[id]);
    }
  }

  if(live.heroA>0.02&&world.bluePath&&world.bluePath.length>2){
    ctx.save();
    ctx.strokeStyle=VERM;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.globalAlpha=0.45*live.heroA;ctx.lineWidth=3;
    strokePoly(roughPts(world.bluePath,1.6,77),Math.min(1,live.heroA*1.15));
    ctx.restore();
  }
  for(const p of world.parcels)drawParcel(p, live);
  if(live.heroA>0.02){
    const h2=world.parcels.find(p=>p.hero&&!p.bin);
    if(h2&&h2.rec.length>2){
      ctx.save();
      ctx.strokeStyle=VERM;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.globalAlpha=0.9*live.heroA;ctx.lineWidth=4.2;
      ctx.beginPath();ctx.moveTo(h2.rec[0][0],h2.rec[0][1]);
      for(const q of h2.rec)ctx.lineTo(q[0],q[1]);
      ctx.stroke();
      ctx.restore();
    }
  }
}
