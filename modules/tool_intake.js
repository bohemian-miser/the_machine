import { makeParcel, pickShape, pickColor } from '../physics.js?v=3';
import { rrectO, rline, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  const live = world.parcels.filter(p => !p.bin).length;
  if (mot('intake') > 0.5) {
    world.spawnT -= dt;
    if (world.spawnT <= 0 && live < world.spawnCap) {
      const color = world.forceBlue ? 'blue' : pickColor(world.rnd);
      const size = world.rnd() < 0.45 ? 'lg' : 'sm';
      const shape = pickShape(world.rnd);
      const spawnX = 215; // Everything drops into the center funnel now

      const number = Math.floor(world.rnd() * 100) + 1;
      const p = makeParcel(number, shape, color, size, spawnX, 50);
      if (world.forceBlue) { p.hero = true; world.forceBlue = false; }
      world.parcels.push(p);
      world.counters.spawned++;
      world.counters.seen.colors[color] = (world.counters.seen.colors[color] || 0) + 1;
      world.counters.seen.sizes[size] = (world.counters.seen.sizes[size] || 0) + 1;
      world.spawnT = 0.5 + world.rnd() * 0.5;
    }
  }
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  rrectO(320, 185, 24, 28, p, amp, seed + 80);
  rline([[332, 185], [332, 195]], p, amp, seed + 81);
  rline([[328, 203], [336, 203]], p, amp * .6, seed + 82);
  rline([[332, 199], [332, 207]], p, amp * .6, seed + 83);
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.strokeStyle = '#2B2B33';
  ctx.fillStyle = '#2B2B33';
  ctx.lineWidth = 2;
  const lx = r.label[0], ly = r.label[1];
  
  ctx.font = '10px "IBM Plex Mono"';
  ctx.fillText('LgSq -> LftChute', lx - 5, ly - 15);
  ctx.fillText('Tri <- Sq -> Circ', lx + 10, ly - 5);
  ctx.restore();
}
