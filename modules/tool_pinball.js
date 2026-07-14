import { drawEye, rcircle, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  for (const b of world.bumpers) if (b.hitTimer > 0) b.hitTimer -= dt;
  for (const p of world.parcels) {
    if (p.state === 'fall' && p.x > 300 && p.x < 900 && p.y > 600) {
      for (const b of world.bumpers) {
        let dx = p.x - b.x, dy = p.y - b.y;
        let dist = Math.hypot(dx, dy);
        if (dist < b.r + p.hw + 2) {
          let nx = dx / dist, ny = dy / dist;
          let dp = p.vx * nx + p.vy * ny;
          if (dp < 0) {
            p.vx = p.vx - 1.5 * dp * nx + nx * 180;
            p.vy = p.vy - 1.5 * dp * ny + ny * 180;
            b.hitTimer = 0.25;
            p.number = (p.number || 0) + 1;
          }
        }
      }
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  for (const b of world.bumpers || []) {
    drawEye(b.x, b.y, b.r * 0.6, p, amp, seed + b.x);
    rcircle(b.x, b.y, b.r + (b.hitTimer>0?b.hitTimer*60:0), p, Math.min(amp * 2, 2.5), seed + b.y);
  }
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
 ctx.beginPath(); ctx.arc(lx+40, ly-10, 10, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(lx+40, ly-10, 4, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
