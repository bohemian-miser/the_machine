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
      const rider=B.riders[i];
      if(rider){
        rider.x=714; rider.y=y-1;
        if(y<=134){
          B.riders[i]=null;
          rider.state='fall';rider.carrier=null;
          rider.x=716;rider.y=130;rider.vx=112;rider.vy=-10;
        }
      }else if((y<890&&y>870) || (y<690&&y>670) || (y<332&&y>322)){
        const pickupStr = y>800 ? 'ledge_base' : (y>500 ? 'pt_out' : 'ledge_lo');
        const sf=world.smap[pickupStr];
        if (sf) {
          let front=null;
          for(const p of world.parcels) {
            if(p.state==='surf'&&p.surf===pickupStr) {
               if (pickupStr === 'pt_out' && Math.abs(p.x - 714) < 15) front = p;
               else if (pickupStr !== 'pt_out' && (!front||p.s>front.s)) front = p;
            }
          }
          if(front && (pickupStr === 'pt_out' || front.s > sf.len - 8)){
            B.riders[i]=front;
            front.state='carried';front.carrier={type:'bucket',i};
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
      if(front&&front.s>sf.len-8){T.state='GRAB';T.timer=0;T.grabId=front.id;}
    }else if(T.state==='GRAB'){
      T.timer+=dt;
      if(T.timer>0.3){
        const p=world.parcels.find(q=>q.id===T.grabId);
        if(p&&p.state==='surf'&&p.surf==='ledge_hi'){
          p.state='carried';p.carrier={type:'trolley'};T.carrying=p;T.state='MOVE_R';
        }else T.state='WAIT';
      }
    }else if(T.state==='MOVE_R'){
      T.x+=150*dt;
      const p=T.carrying;
      if (p && p.color === 'blue' && p.number > 15 && T.x > 940 && T.x < 980) { // Drop them early if blue and number > 15
        p.state='fall';p.carrier=null;p.x=T.x;p.y=162;p.vy=20;p.vx=0;
        T.carrying=null;T.state='MOVE_L';
      } else if(T.x>=1352){
        T.x=1352;
        if(p){p.state='fall';p.carrier=null;p.x=T.x;p.y=162;p.vx=25;p.vy=0;}
        T.carrying=null;T.state='MOVE_L';
      }
    }else if(T.state==='MOVE_L'){
      T.x-=170*dt;
      if(T.x<=814){T.x=814;T.state='WAIT';}
    }
    if(T.carrying){T.carrying.x=T.x;T.carrying.y=160;}
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
  if (blueBin) drawBin(blueBin, p, amp, seed + 100, true, world.weighBucket && world.weighBucket.tipping > 0);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1]; // Typically r.label is near 1050, 310
  
  // Render a visual check at x=950, y=90
  ctx.font = '10px "IBM Plex Mono"';
  ctx.fillText('num > 15 ? fall : pass', 900, 95);
  ctx.beginPath(); ctx.moveTo(950, 100); ctx.lineTo(950, 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(945, 125); ctx.lineTo(950, 130); ctx.lineTo(955, 125); ctx.stroke();

  ctx.restore();
}
