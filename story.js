// story.js
export const beats=[
 {cap:"This is the system. Expanded 10x.",
  sub:"Fully operational. Boxes go in; boxes end up in four different bins, or stuck in endless chaotic loops.",
  set:(t, REG)=>{t.dim=0;t.hero=0;t.cam={x:800,y:500,z:1};
    for(const id in REG)t[id]={crisp:0,mot:1,wash:0,label:0};}},
 {cap:"First move: stop time.",
  sub:"A snapshot. Nothing moves, and nothing hides. Static analysis starts here.",
  set:(t, REG)=>{for(const id in REG)t[id].mot=0;}},
 {cap:"Zoom in. Read the fine detail.",
  sub:"Two sloped walls, a throat, a belt. Named parts, pencilled guesses — nothing moves yet.",
  set:(t, REG)=>{t.cam={x:330,y:168,z:2.5};t.intake.crisp=1;}},
 {cap:"Now let just this piece run.",
  sub:"Dynamic analysis. The hopper feeds, the belt drives — and everything jams at the frozen edge below.",
  set:(t, REG)=>{t.intake.mot=1;t.intake.wash=1;t.intake.label=1;}},
 {cap:"Climb sideways from the foothold.",
  sub:"One region over, still frozen: an eye, a flap, three exits. Statics can count the exits.",
  set:(t, REG)=>{t.cam={x:560,y:300,z:2.2};t.sorter.crisp=1;}},
 {cap:"Run it. The flap reads colour.",
  sub:"Blue is thrown toward the tower. Warm carries on. Grey goes straight in the bin. One experiment, three answers.",
  set:(t, REG)=>{t.sorter.mot=1;t.sorter.wash=1;t.sorter.label=1;}},
 {cap:"But what about the overflow?",
  sub:"The new factory has massive deep regions. Let's trace the leftmost drop.",
  set:(t, REG)=>{t.cam={x:150,y:250,z:2.2};t.crushers={crisp:1,mot:0,wash:0,label:1};}},
 {cap:"The Crushers.",
  sub:"These actuators delete large boxes and spawn a violent burst of smaller ones.",
  set:(t, REG)=>{t.cam={x:150,y:320,z:2.8};}},
 {cap:"Run it. Absolute destruction.",
  sub:"Watch the heavy impacts translate into smaller components racing out the other side.",
  set:(t, REG)=>{t.crushers.mot=1;t.crushers.wash=1;}},
 {cap:"Where do they fall? The Paint Shop.",
  sub:"Four belts, four distinct applicators. Waiting static down below.",
  set:(t, REG)=>{t.cam={x:150,y:580,z:2.2};t.painters={crisp:1,mot:0,wash:0,label:1};}},
 {cap:"Cyan, Magenta, Green, White.",
  sub:"Identity theft purely by intersection. The belts are moving.",
  set:(t, REG)=>{t.painters.mot=1;t.painters.wash=1;}},
 {cap:"They launch out violently into the void.",
  sub:"And into the Pachinko zone. Floating pinball bumpers covering the massive empty space.",
  set:(t, REG)=>{t.cam={x:550,y:680,z:1.8};t.pinball={crisp:1,mot:0,wash:0,label:1};}},
 {cap:"Run the physics engine repulsive logic.",
  sub:"Every collision applies raw velocity vectors. The factory is now a casino.",
  set:(t, REG)=>{t.pinball.mot=1;t.pinball.wash=1;}},
 {cap:"A sweeping catch basin.",
  sub:"The entire bottom floor is a high-speed return belt ensuring nothing ever truly falls out of bounds.",
  set:(t, REG)=>{t.cam={x:800,y:850,z:1.2};t.dispatch={crisp:1,mot:1,wash:1,label:1};}},
 {cap:"But where is the output?",
  sub:"The return belts feed blindly into the void... no, into the Teleporters.",
  set:(t, REG)=>{t.cam={x:420,y:880,z:2.5};t.teleport={crisp:1,mot:0,wash:0,label:1};}},
 {cap:"Instantaneous displacement.",
  sub:"Boxes hitting these portals vanish instantly and fall straight out of the sky back at coordinates (220, 20).",
  set:(t, REG)=>{t.teleport.mot=1;t.teleport.wash=1;}},
 {cap:"Let's return to the main line.",
  sub:"Back up to the stamp press works. It hasn't changed.",
  set:(t, REG)=>{t.cam={x:845,y:430,z:2.0};t.works={crisp:1,mot:1,wash:1,label:1};}},
 {cap:"Wait, look closely at the weighing bucket.",
  sub:"When the works loop drops tallies into it, the scale gets heavier. What happens at the limit?",
  set:(t, REG)=>{t.cam={x:918,y:460,z:3.0};}},
 {cap:"Physical cascade.",
  sub:"When the bucket fills, it spectacularly spills its contents physically onto the belts below.",
  set:(t, REG)=>{t.works.mot=1;}},
 {cap:"So that's where the blue ones go.",
  sub:"Scooped up the tower, carried across the rail, dropped down the pegs. The long way round — blue only.",
  set:(t, REG)=>{t.cam={x:1050,y:310,z:1.7};t.skyway={crisp:1,mot:1,wash:1,label:1};}},
 {cap:"A machine that swaps its own parts.",
  sub:"The carousel dwells, snaps a third of a turn, and a different tool marks the line. No snapshot could have told you that.",
  set:(t, REG)=>{t.cam={x:1122,y:462,z:2.35};t.carousel={crisp:1,mot:1,wash:1,label:1};}},
 {cap:"The last unknowns.",
  sub:"The eye pulls exactly what the press missed. The crane reads colour and delivers. Cause, meet effect.",
  set:(t, REG)=>{t.cam={x:1230,y:645,z:1.5};
    t.check={crisp:1,mot:1,wash:1,label:1};
    t.dispatch={crisp:1,mot:1,wash:1,label:1};}},
 {cap:"The same machine as frame one.",
  sub:"Nothing was added — only ignorance removed. Except the 10x mechanics expansion.",
  set:(t, REG)=>{t.cam={x:800,y:500,z:1};}},
 {cap:"Follow one blue parcel.",
  sub:"Hopper, belt, flap, bucket, rail, pegs, platform, crane, bin. It was all in the first frame — you just couldn't read it yet.",
  set:(t, REG)=>{t.dim=1;t.hero=1;}},
];

export function computeTargets(idx, REG){
  const t={dim:0,hero:0,cam:{x:800,y:500,z:1}};
  for(const id in REG)t[id]={crisp:0,mot:1,wash:0,label:0};
  for(let i=0;i<=idx;i++){
    const prev={};for(const id in REG)prev[id]={...t[id]};
    beats[i].set(t, REG);
    for(const id in REG)t[id]={...prev[id],...t[id]};
  }
  return t;
}

export function setBeat(i, pipsEl, capEl, subEl, REDUCED, REG, callback) {
  let beat=Math.max(0,Math.min(beats.length-1,i));
  let target=computeTargets(beat, REG);
  pipsEl.textContent=(beat+1)+' / '+beats.length;
  capEl.classList.add('capfade');subEl.classList.add('capfade');
  setTimeout(()=>{
    capEl.textContent=beats[beat].cap;subEl.textContent=beats[beat].sub;
    capEl.classList.remove('capfade');subEl.classList.remove('capfade');
  }, REDUCED ? 0 : 220);
  callback({beat, target});
}
