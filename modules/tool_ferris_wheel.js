import { rcircle, rline, rrectO, INK } from '../render.js?v=3';
import { caroState } from '../physics.js?v=3';

export function step(world, dt, mot) {
  const carouselMot = mot('carousel');
  world.caroT = (world.caroT || 0) + dt * carouselMot;
  const tempCaro = caroState(world.caroT);
  Object.assign(world.caro, tempCaro);
  
  if (!world.shuttle) world.shuttle = {x: 1122, state: 'WAIT', carrying: null, timer: 0};

  if (carouselMot > 0.5) {
    for (let i = 0; i < 3; i++) {
      const a = world.caro.angle + i * Math.PI * 2 / 3 + Math.PI / 2;
      const ax = 1122 + Math.cos(a) * 38;
      const ay = 436 + Math.sin(a) * 38;
      const riderId = world.caro.riders[i];
      if (riderId) {
        const rider = world.parcels.find(p => p.id === riderId);
        if (rider && rider.state === 'carried' && rider.carrier && rider.carrier.type === 'caro' && rider.carrier.slot === i) {
          rider.x = ax; rider.y = ay;
        } else {
          world.caro.riders[i] = null;
        }
      } else {
        if (ax > 1112 && ax < 1132 && ay > 450) { 
          // Only pick up from the bottom (ay > 450) since the shuttle takes from the top
          let reqShape = i === 0 ? 'square' : (i === 1 ? 'circle' : 'triangle');
          const b = world.parcels.find(p => p.state === 'surf' && p.surf === 'merge' && p.x > ax - 15 && p.x < ax + 15 && p.shape === reqShape);
          if (b) {
            b.state = 'carried';
            b.carrier = { type: 'caro', slot: i };
            world.caro.riders[i] = b.id;
          }
        }
      }
    }
  }

  const S = world.shuttle;
  if (carouselMot > 0.5) {
    if (S.state === 'WAIT') {
      S.x += (1122 - S.x) * Math.min(1, 6 * dt);
      if (Math.abs(S.x - 1122) < 2) {
        for (let i = 0; i < 3; i++) {
          const riderId = world.caro.riders[i];
          const a = world.caro.angle + i * Math.PI * 2 / 3 + Math.PI / 2;
          const ay = 436 + Math.sin(a) * 38;
          if (riderId && ay < 425 && !world.caro.rotating) {
             const p = world.parcels.find(q => q.id === riderId);
             if (p) {
               S.state = 'GRAB'; S.timer = 0; S.grabId = p.id; S.grabSlot = i;
               break;
             }
          }
        }
      }
    } else if (S.state === 'GRAB') {
      S.timer += dt;
      if (S.timer > 0.15) {
        const p = world.parcels.find(q => q.id === S.grabId);
        if (p) {
          world.caro.riders[S.grabSlot] = null;
          p.carrier = { type: 'shuttle' };
          S.carrying = p; S.state = 'MOVE';
        } else S.state = 'WAIT';
      }
    } else if (S.state === 'MOVE') {
      S.x += 100 * dt;
      if (S.x >= 1250) { 
        S.x = 1250;
        S.state = 'SPARKLE';
        S.timer = 0;
      }
    } else if (S.state === 'SPARKLE') {
      S.timer += dt;
      const p = S.carrying;
      // "spazzy" sparkly maker stationary logic
      if (p) p.hero = true; // Apply the sparkles
      if (S.timer > 0.2) {
        if (p) {
            p.state = 'fall'; p.carrier = null; p.vy = 20; p.vx = 0;
        }
        S.carrying = null; S.state = 'RETURN';
      }
    } else if (S.state === 'RETURN') {
      S.x -= 100 * dt;
      if (S.x <= 1122) { S.x = 1122; S.state = 'WAIT'; }
    }
    
    if (S.carrying) {
      S.carrying.x = S.x; S.carrying.y = 398;
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const C = world.caro;
  rcircle(1122, 436, 56, p, amp, seed + 1);
  rcircle(1122, 436, 7, p, amp * .7, seed + 2);
  for (let i = 0; i < 3; i++) {
    const a = C.angle + i * Math.PI * 2 / 3 + Math.PI / 2;
    const px = 1122 + Math.cos(a) * 38, pyy = 436 + Math.sin(a) * 38;
    rline([[1122, 436], [px, pyy]], p, amp * .6, seed + 3 + i);
    rcircle(px, pyy, 14, p, amp * .8, seed + 6 + i);
    if (i === 0) { rrectO(px - 5, pyy - 5, 10, 10, p, amp * .4, seed + 10); } // Square
    if (i === 1) { rcircle(px, pyy, 5, p, amp * .4, seed + 12); } // Circle
    if (i === 2) { 
        rline([[px - 5, pyy + 4], [px + 5, pyy + 4]], p, amp * .4, seed + 15);
        rline([[px - 5, pyy + 4], [px, pyy - 5]], p, amp * .4, seed + 16);
        rline([[px + 5, pyy + 4], [px, pyy - 5]], p, amp * .4, seed + 17);
    } // Triangle
  }
  
  if (world.shuttle) {
    const sx = world.shuttle.x;
    rline([[1122, 398], [1250, 398]], p, amp, seed + 100); // shuttle track
    rrectO(sx - 10, 393, 20, 10, p, amp, seed + 101);      // shuttle cart
    
    // Sparkly Machine Casing at 1250
    rrectO(1230, 370, 40, 30, p, amp, seed + 110);
    rline([[1240, 370], [1240, 350]], p, amp, seed + 111);
    rline([[1260, 370], [1260, 360]], p, amp, seed + 112);
    rcircle(1240, 350, 4, p, amp, seed + 113); // Antenna bobble

    if (world.shuttle.state === 'SPARKLE') {
      const mt = r.motionTime || 0;
      // Draw 3 organized consistent stars/sparkles around the docked package
      for (let k = 0; k < 3; k++) {
         const angle = mt * 8 + k * (Math.PI * 2 / 3);
         const dist = 15 + Math.sin(mt * 12 + k) * 5;
         const sparkX = 1250 + Math.cos(angle) * dist;
         const sparkY = 390 + Math.sin(angle) * dist;
         // Draw a little cross for a sparkle
         rline([[sparkX - 3, sparkY], [sparkX + 3, sparkY]], p, amp * 0.8, seed + 120 + k);
         rline([[sparkX, sparkY - 3], [sparkX, sparkY + 3]], p, amp * 0.8, seed + 124 + k);
      }
    }
  }
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
 ctx.beginPath(); ctx.moveTo(lx+30, ly-5); ctx.lineTo(lx+50, ly-5); ctx.lineTo(lx+40, ly-20); ctx.stroke();
  ctx.restore();
}
