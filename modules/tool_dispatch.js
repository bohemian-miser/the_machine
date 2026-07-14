import { drawBin, rline, rcircle, rrectO, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  const m=mot('dispatch'), C=world.crane;
  if(m>0.5){
    const hookY=()=>656+10+C.hook;
    if(C.state==='IDLE'){
      C.hook+=(0-C.hook)*Math.min(1,4*dt);
      let best=null,bd=1e9;
      for(const p of world.parcels)
        if(p.state==='surf'&&p.surf==='pickup'&&Math.abs(p.vt)<8){
          const d=Math.abs(p.x-C.x);if(d<bd){bd=d;best=p;}
        }
      if(best){C.target=best.id;C.state='MOVE_PICK';}
    }else if(C.state==='MOVE_PICK'){
      const p=world.parcels.find(q=>q.id===C.target);
      if(!p||p.state!=='surf'){C.state='IDLE';}
      else{
        const d=p.x-C.x;C.x+=Math.sign(d)*Math.min(Math.abs(d),170*dt);
        if(Math.abs(d)<2)C.state='LOWER';
      }
    }else if(C.state==='LOWER'){
      C.hook=Math.min(28,C.hook+130*dt);
      if(C.hook>=28){
        const p=world.parcels.find(q=>q.id===C.target);
        if(p&&p.state==='surf'&&p.surf==='pickup'){
          p.state='carried';p.carrier={type:'crane'};C.carrying=p;C.state='RAISE';
        }else C.state='IDLE';
      }
    }else if(C.state==='RAISE'){
      C.hook=Math.max(0,C.hook-130*dt);
      if(C.hook<=0){
        C.binX=C.carrying.color==='blue'?1164:1034;
        C.state='MOVE_BIN';
      }
    }else if(C.state==='MOVE_BIN'){
      const d=C.binX-C.x;C.x+=Math.sign(d)*Math.min(Math.abs(d),170*dt);
      if(Math.abs(d)<2)C.state='LOWER2';
    }else if(C.state==='LOWER2'){
      C.hook=Math.min(120,C.hook+150*dt);
      if(C.hook>=120){
        const p=C.carrying;
        if(p){p.state='fall';p.carrier=null;p.vx=0;p.vy=20;}
        C.carrying=null;C.state='RAISE2';
      }
    }else if(C.state==='RAISE2'){
      C.hook=Math.max(0,C.hook-150*dt);
      if(C.hook<=0)C.state='IDLE';
    }
    if(C.carrying){C.carrying.x=C.x;C.carrying.y=656+18+C.hook;}
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const C=world.crane;
  const bin = (id) => world.bins.find(b=>b.id===id);
  rline([[960,656],[1460,656]],p,amp,seed+1);
  rrectO(C.x-14,658,28,13,p,amp*.8,seed+2);
  rcircle(C.x-7,657,3.5,p,amp*.5,seed+3);
  rcircle(C.x+7,657,3.5,p,amp*.5,seed+4);
  rline([[C.x,671],[C.x,671+C.hook]],p,amp*.55,seed+5);
  rline([[C.x-4,671+C.hook],[C.x+4,671+C.hook]],p,amp*.5,seed+6);
  drawBin(bin('A'),p,amp,seed+10,false);
  drawBin(bin('B'),p,amp,seed+14,false);
  for(const wl of world.walls)
    if(wl.x>1230&&wl.y1>600)rline([[wl.x,wl.y1],[wl.x,wl.y2]],p,amp,seed+20+(wl.x&7));
  if(pass==='crisp'){ 
    const bb=bin('B');
    const total=Math.min(world.counters.delivered.B,30);
    let tx=bb.x+6;
    const groups=Math.floor(total/5),rem=total%5;
    const grp=(n,gi)=>{
      for(let i=0;i<Math.min(n,4);i++)rline([[tx+i*6,bb.y-8],[tx+i*6,bb.y-22]],p,1.2,seed+40+gi*9+i);
      if(n>=5)rline([[tx-3,bb.y-10],[tx+21,bb.y-20]],p,1.2,seed+45+gi*9);
      tx+=29;
    };
    for(let g=0;g<groups;g++)grp(5,g);
    if(rem>0)grp(rem,groups);
  }
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
 ctx.beginPath(); ctx.moveTo(lx+30, ly-10); ctx.lineTo(lx+50, ly-10); ctx.lineTo(lx+40, ly-20); ctx.fill();
  ctx.restore();
}
