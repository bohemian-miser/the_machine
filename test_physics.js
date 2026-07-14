import { createWorld, step } from './physics.js?v=3';
import { REGIONS } from './scene.js?v=3';

let w = createWorld();
try {
  let mot = (id) => 1.0;
  step(w, 0.016, mot);
  console.log("Step 1 success");
  step(w, 0.016, mot);
  console.log("Step 2 success");
} catch(e) {
  console.error("Error:", e);
  process.exit(1);
}
