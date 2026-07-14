import { rcircle, rline, rrectO, INK, drawBin } from '../render.js?v=3';

export function step(world, dt, mot) {
  const m=mot('skyway');
  if(m>0.5){
    const B=world.buckets;
    B.phase+=dt*B.speed;
    for(let i=0;i<B.n;i++){
      const prog=(B.phase+i*B.spacing)%B.cycle;
      const y=880-prog;
      B['y'+i]=y;
      
      const bSf = world.smap['bucket_' + i];
      if (bSf) {
        bSf.y1 = y; bSf.y2 = y;
      }
      
      // Physics-based spatial scooping: grab anything in the elevator shaft that the bucket touches!
      const dySweep = B.speed * dt;
      for (const p of world.parcels) {
        if (p.state !== 'carried' && !p.bin && (!p.surf || !p.surf.startsWith('bucket_'))) {
          // Check horizontal overlap with the bucket
          if (p.x + (p.hw||10) > bSf.x1 && p.x - (p.hw||10) < bSf.x2) {
            // Check vertical overlap with the bucket's sweep path this frame
            if (p.y > y - 12 && p.y < y + dySweep + 16) {
              p.state = 'surf';
              p.surf = 'bucket_' + i;
              p.s = Math.max(0, Math.min(bSf.len, p.x - bSf.x1));
            }
          }
        }
      }
      if (y <= 134) {
        if (bSf) { bSf.y1 = -1000; bSf.y2 = -1000; }
        for (let j = world.parcels.length - 1; j >= 0; j--) {
          const p = world.parcels[j];
          if (p.state === 'surf' && p.surf === 'bucket_' + i) {
            p.state = 'fall'; p.surf = null;
            p.x = 716; p.y = 130; p.vx = 112; p.vy = -5;
          }
        }
      }
    }
    const T=world.trolley;
    if(T.state==='WAIT'){
      T.x+=(814-T.x)*Math.min(1,6*dt);
      const sf=world.smap.ledge_hi;
      let front=null;
      for(const p of world.parcels)
        if(p.state==='surf'&&p.surf==='ledge_hi'&&(!front||p.s>front.s))front=p;
      if(front&&front.s>sf.len-15){T.state='GRAB';T.timer=0;}
    }else if(T.state==='GRAB'){
      T.timer+=dt;
      if(T.timer>0.3){
        T.carrying = [];
        for (const p of world.parcels) {
          if (p.state === 'surf' && p.surf === 'ledge_hi' && p.s > world.smap.ledge_hi.len - 30) {
            p.state='carried';
            p.carrier={type:'trolley', dx: p.x - 814};
            T.carrying.push(p);
          }
        }
        if (T.carrying.length > 0) {
          T.state='MOVE_R';
        } else {
          T.state='WAIT';
        }
      }
    }else if(T.state==='MOVE_R'){
      T.x+=150*dt;
      if (T.carrying && T.carrying.length > 0) {
        for (let i = T.carrying.length - 1; i >= 0; i--) {
          const p = T.carrying[i];
          if (p.color === 'blue' && T.x > 1000 && T.x < 1050) { 
            p.state='fall'; p.carrier=null;
            p.x=T.x + (p.carrier ? p.carrier.dx : 0); p.y=162; p.vy=20; p.vx=0;
            T.carrying.splice(i, 1);
          }
        }
      }
      if(T.x>=1352){
        T.x=1352;
        if(T.carrying){
          for (const p of T.carrying) {
            p.state='fall'; p.carrier=null; 
            p.x=T.x + (p.carrier ? p.carrier.dx : 0); p.y=162; p.vx=25; p.vy=0;
          }
        }
        T.carrying=null; T.state='MOVE_L';
      }else if(T.carrying && T.carrying.length === 0){
        // all dropped!
        T.carrying=null; T.state='MOVE_L';
      }
    }else if(T.state==='MOVE_L'){
      T.x-=170*dt;
      if(T.x<=814){T.x=814;T.state='WAIT';}
    }
    if(T.carrying){
      for (const p of T.carrying) {
        p.x = T.x + (p.carrier ? p.carrier.dx : 0);
        p.y = 160;
      }
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  rline([[692,122],[692,890]],p,amp,seed+1);
  rline([[738,122],[738,890]],p,amp,seed+2);
  const B=world.buckets;
  for(let i=0;i<B.n;i++){
    const y=B['y'+i];
    if(y>124&&y<890){
      rline([[694,y],[734,y]],p,amp*.8,seed+4+i);
      rline([[694,y],[694,y-6]],p,amp*.6,seed+7+i);
    }
  }
  if(pass==='crisp'){ 
    const step=26,off=step-((B.phase%step)+step)%step;
    for(let y=126+off;y<890;y+=step)rline([[689,y],[695,y]],p,amp*.4,seed+20+Math.floor(y/step));
  }

  const T=world.trolley;
  rline([[810,112],[1360,112]],p,amp,seed+30);
  rrectO(T.x-13,115,26,12,p,amp*.8,seed+31);
  rcircle(T.x-7,113,3.5,p,amp*.5,seed+32);
  rcircle(T.x+7,113,3.5,p,amp*.5,seed+33);
  rline([[T.x,127],[T.x,152]],p,amp*.6,seed+34);
  rline([[T.x,152],[T.x+4,157]],p,amp*.6,seed+35);
  for(const wl of world.walls)
    if(wl.x>1290&&wl.x<1420)rline([[wl.x,wl.y1],[wl.x,wl.y2]],p,amp,seed+40+(wl.x&7));

  const blueBin = world.bins.find(b => b.id === 'blue');
  if (blueBin) drawBin(blueBin, p, amp, seed + 100, true, world.weighBucket && world.weighBucket.tippingB > 0);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1]; // Typically r.label is near 1050, 310
  
  // Render a visual check at x=950, y=90
  ctx.font = '10px "IBM Plex Mono"';
  ctx.fillText('color == blue ? fall : pass', 900, 95);
  ctx.beginPath(); ctx.moveTo(950, 100); ctx.lineTo(950, 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(945, 125); ctx.lineTo(950, 130); ctx.lineTo(955, 125); ctx.stroke();

  ctx.restore();
}
