import { drawEye, drawBin, rline, rcircle, rrectO, PCOL, INK } from '../render.js?v=3';

export function step(world, dt, mot) {
  world.flap.angle += (world.flap.targetAngle - world.flap.angle) * Math.min(1, 8 * dt);
}

export function render(ctx, world, r, pass, p, amp) {
  const seed = (pass === 'faint' ? 550 : 950) + r.id.length * 29;
  const bin = (id) => world.bins.find(b => b.id === id);

  drawEye(585, 196, 9, p, amp, seed);
  const a = world.flap.angle;
  rline([[585, 236], [585 + Math.sin(a) * 24, 236 + Math.cos(a) * 24]], p, amp * .8, seed + 8);
  rcircle(585, 236, 2.6, p, amp * .6, seed + 9);
  drawBin(bin('grey'), p, amp, seed + 12, true, world.weighBucket && world.weighBucket.tipping > 0);

  if (true) {
    ctx.fillStyle = PCOL['grey']; ctx.fillRect(524, 210, 10, 7); rrectO(524, 210, 10, 7, p, amp, seed + 50);
    rline([[536, 213.5], [544, 213.5]], p, amp, seed + 51);
    ctx.fillStyle = PCOL['ochre']; ctx.fillRect(600, 190, 10, 7); rrectO(600, 190, 10, 7, p, amp, seed + 52);
    rline([[605, 200], [605, 208]], p, amp, seed + 53);
    ctx.fillStyle = PCOL['blue']; ctx.fillRect(630, 210, 10, 7); rrectO(630, 210, 10, 7, p, amp, seed + 54);
    rline([[618, 213.5], [626, 213.5]], p, amp, seed + 55);
  }
}

export function renderGlyph(ctx, world, r) {
  ctx.save();
  ctx.fillStyle = '#2B2B33';
  ctx.font = '10px "IBM Plex Mono"';
  const lx = r.label[0], ly = r.label[1];
  ctx.fillText('Gr <-[*]-> Bl', lx + 10, ly - 5);
  ctx.restore();
}
