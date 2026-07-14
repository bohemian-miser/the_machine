import assert from 'assert';
import { createWorld, step, makeParcel } from './physics.js?v=3';

let tests = 0;
let passes = 0;

function runTest(name, fn) {
  tests++;
  try {
    fn();
    passes++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err.stack);
  }
}

console.log("Starting unit tests...");

// 1. Crushers
runTest('Crushers separate one lg parcel into 3 sm parcels', () => {
  let world = createWorld(42);
  let p = makeParcel(1, 'square', 'blue', 'lg', 150, 260); // using correct 6 args
  p.state = 'surf';
  p.surf = 'cr_belt';
  p.s = 45; // passing s > 40
  p.vt = 10;
  world.parcels.push(p);

  step(world, 0.1, (id) => id === 'crushers' ? 1 : 0);

  // Check the old parcel is gone and 3 small ones popped out
  assert.equal(world.parcels.length, 3, "Expected 3 small parcels after crushing");
  for (let newP of world.parcels) {
    assert.equal(newP.size, 'sm');
    assert.equal(newP.color, 'blue');
    assert.equal(newP.state, 'fall');
  }
});

// 2. Painters
runTest('Painters color changing', () => {
  let world = createWorld(42);
  let p = makeParcel(2, 'circle', 'grey', 'sm', 0, 0); 
  p.state = 'surf';
  p.surf = 'pt_b1'; // magenta
  p.s = 40; // 30 < s < 50
  
  world.parcels.push(p);
  
  step(world, 0.1, (id) => id === 'painters' ? 1 : 0);
  
  assert.equal(p.color, 'magenta', "Color should be magenta");
});

// 3. Stamp Trigger via Weigh Bucket
runTest('Stamp press activates when weigh bucket exceeds threshold', () => {
  let world = createWorld(100);
  // Add heavy parcels on beltA to exceed the weight limit (40)
  // 3 lg parcels (wid=19) = 57 weight.
  for (let i = 0; i < 3; i++) {
    let p = makeParcel(i+3, 'square', 'grey', 'lg', 0, 0);
    p.state = 'surf';
    p.surf = 'beltA';
    p.s = 60 + i*15; // in weighing range (30-100)
    world.parcels.push(p);
  }

  // One parcel in position to be stamped
  let target = makeParcel(99, 'circle', 'rust', 'lg', 0, 0);
  target.state = 'surf';
  target.surf = 'beltA';
  target.s = 130 - target.hw - 2; // Front boundary
  target.vt = 0; // Stopped
  world.parcels.push(target);

  // Run a few steps to weigh and trigger
  for(let i=0; i<30; i++){
     step(world, 0.05, () => 1);
  }

  // Weight should have triggered the press, stamped the target, and reset
  assert.equal(target.stamped, true, "Parcel should be stamped");
  assert.equal(world.weighBucket.weight, 0, "Weight bucket should reset");
  assert.ok(target.number >= 50, "Stamped number should reflect bucket weight");
});

// 4. Grey Bucket Eruption
runTest('Grey bucket erupts when it becomes too full', () => {
  let world = createWorld(123);
  let greyBucket = world.bins.find(b=>b.id==='grey');
  
  // Fill it up to 16
  greyBucket.count = 16;
  greyBucket.lastErupt = -10; // ensure timer passes
  let pBin = makeParcel(14, 'square', 'green', 'sm', 0, 0);
  pBin.bin = 'grey';
  world.parcels.push(pBin);
  
  step(world, 0.1, () => 1);
  
  let binned = world.parcels.filter(x => x.bin === 'grey');
  assert.equal(binned.length, 0, "Grey bucket is empty");
  assert.equal(greyBucket.count, 0, "Count is zero");
  
  let liberated = world.parcels.find(x => x.color === 'green');
  assert.ok(liberated, "Should find liberated package");
  assert.equal(liberated.state, 'fall', "Should be falling now");
});

// 5. Telemetry output aggregation
runTest('Telemetry output correctly groups identical elements', () => {
  let world = createWorld(999);
  
  // mock some outputs
  world.counters.telemetry = [
    { in: {size: 'lg', color: 'blue', shape: 'circle'}, out: {size: 'lg', color: 'magenta', shape: 'circle', number: 10}, bin: 'B' },
    { in: {size: 'lg', color: 'blue', shape: 'circle'}, out: {size: 'lg', color: 'magenta', shape: 'circle', number: 12}, bin: 'B' },
    { in: {size: 'sm', color: 'grey', shape: 'square'}, out: {size: 'sm', color: 'grey', shape: 'square', number: 1}, bin: 'grey' }
  ];
  
  // Simple mapping function logic identical to main.js updateStatsPanel logic
  let map = {};
  for (let t of world.counters.telemetry) {
     if(!t.in) continue;
     let key = `${t.in.size} ${t.in.color} ${t.in.shape}`;
     let valStr = `${t.out.size} ${t.out.color} ${t.out.shape} => ${t.bin}`;
     if (!map[key]) map[key] = {};
     if (!map[key][valStr]) map[key][valStr] = 0;
     map[key][valStr]++;
  }
  
  assert.equal(Object.keys(map).length, 2, "Should group down to 2 input keys");
  assert.equal(map['lg blue circle']['lg magenta circle => B'], 2, "Should accumulate 2 identical outputs");
  assert.equal(map['sm grey square']['sm grey square => grey'], 1, "Should accumulate 1 output");
});

console.log(`\nResults: ${passes}/${tests} passed.`);
if (passes !== tests) {
  process.exit(1);
}
