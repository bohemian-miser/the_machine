import { rrectO, rline, rcircle, INK } from '../render.js?v=3';

const weighedSet = new Set();
export function step(world, dt, mot) {
  // Summing is now handled in physics.js based on the grey bin

  const m=mot('intake'), P=world.press;
  if(m>-1){ 
    P.timer+=dt;
    if(P.state==='ARMED'){
      P.piston+= (0-P.piston)*Math.min(1,8*dt);
      const front=world.parcels.find(p=>p.state==='surf'&&p.surf==='beltA'
        &&!p.stamped
        &&p.s >= 59 &&Math.abs(p.vt)<6);
      if(front && world.weighBucket){ 
         P.state='STAMP'; P.timer=0; P.target=front.id; P.misfire=false; 
      }
    }else if(P.state==='STAMP'){
      P.piston=Math.min(1,P.piston+dt*3.2);
      if(P.timer>0.55){
        const p=world.parcels.find(q=>q.id===P.target);
        if(p){ p.stamped=true; p.number = Math.floor(world.weighBucket.weight); }
        P.state='RELEASE';P.timer=0;P.pinOn=false;
      }
    }else if(P.state==='RELEASE'){
      P.piston+= (0-P.piston)*Math.min(1,6*dt);
      if(P.timer>0.35){P.state='ARMED';P.timer=0;P.pinOn=true;}
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const P=world.press, py=160+P.piston*30; 
  const px=310;
  rline([[px-14, 130],[px-14, 185]],p,amp,seed+1);
  rline([[px+14, 130],[px+14, 185]],p,amp,seed+2);
  rline([[px-22, 130],[px+22, 130]],p,amp,seed+3);
  rline([[px, 130],[px, py]],p,amp,seed+4);
  rline([[px-12, py],[px+12, py]],p,amp,seed+5);
  rline([[px-12, py+7],[px+12, py+7]],p,amp,seed+6);
  if(P.pinOn)rline([[px+12, 175],[px+12, 215]],Math.min(1,p*1.3),amp*.6,seed+7);
  
  // Draw communication wire down to the grey bin (weight box) at (432, 540)
  ctx.save();
  ctx.strokeStyle = `rgba(150, 150, 150, ${amp})`;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(px + 22, 130);
  ctx.lineTo(470, 130);
  ctx.lineTo(470, 540);
  ctx.stroke();
  
  // Show the dynamic sum on the stamp
  const displayWeight = Math.floor(world.weighBucket?.weight || 0);
  ctx.font = '12px "IBM Plex Mono"';
  ctx.fillStyle = '#C8F0FF';
  ctx.fillText('Σ: ' + displayWeight, px + 25, 125);
  ctx.restore();
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
  ctx.beginPath(); ctx.moveTo(lx+30, ly-15); ctx.lineTo(lx+50, ly-15); ctx.lineTo(lx+40, ly-5); ctx.fill();
  ctx.restore();
}
