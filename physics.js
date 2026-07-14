import { regionAt, buildSurfaces, WALLS, BINS } from './scene.js?v=3';
import { TOOLS } from './modules/index.js?v=3';

export const G = 420;            
export const VMAX_SLIDE = 120;   
export const VMAX_FALL  = 400;
export const W = 1600, H = 1000;

export let NEXT_ID=1;
export function makeParcel(number,shape,color,size,x,y){
  const wid=size==='lg'?19:12, hgt=size==='lg'?14:9;
  return {id:NEXT_ID++,number: null,shape,color,size,wid,hgt,hw:wid/2,
    original:{shape,color,size},
    x,y,vx:0,vy:0,state:'fall',surf:null,s:0,vt:0,
    carrier:null,stamped:false,tool:-1,misfired:false,
    hero:false,rec:[],recT:0,done:false,bin:null,fade:0,
    isProjectile:false, weight: size==='lg'?15:5};
}
export function pickColor(rnd){const r=rnd();return r<.30?'blue':r<.55?'ochre':r<.78?'rust':'grey';}
export function pickShape(rnd){const r=rnd();return r<.33?'square':r<.66?'circle':'triangle';}

export function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;
  let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;};}

export function createWorld(seed){
  const {list,map}=buildSurfaces();
  return {
    t:0, surfaces:list, smap:map, walls:WALLS, bins:BINS.map(b=>({...b,count:0,slots:[],colors:{}})),
    parcels:[], rnd:mulberry(seed||7),
    spawnT:1.0, spawnCap:Infinity, forceBlue:false,
    escaped:0, escapeLog:[],
    bluePath:null,
    press:{state:'ARMED',timer:0,pinOn:true,piston:0,misfire:false},
    buckets:{speed:65,spacing:125,cycle:750,n:6,phase:0,riders:[null,null,null,null,null,null]},
    trolley:{x:814,state:'WAIT',timer:0,carrying:null,dir:1},
    crane:{x:1350,state:'IDLE',hook:0,carrying:null,targetX:1350,timer:0},
    flap:{angle:0,targetAngle:0},
    ckFlap:{angle:0.15,target:0.15},
    caro:{riders:[null,null,null]}, 
    arms:[
      {id:'arm1', match:{size:'sm'}, state:'IDLE', target:null, x:1050, y:350, baseX:1050, baseY:350},
      {id:'arm2', match:{size:'sm'}, state:'IDLE', target:null, x:1190, y:350, baseX:1190, baseY:350}
    ],
    vacuumTubes:[],
    counters:{spawned:0,delivered:{grey:0,rej:0,A:0,B:0}, seen:{colors:{}, sizes:{}}, deliveredStats:{total:0, colors:{}, sizes:{}}},
    weighBucket: {weight: 0},
    bumpers: [
      {x: 500, y: 750, r: 25}, {x: 620, y: 700, r: 35}, {x: 600, y: 840, r: 30},
      {x: 700, y: 760, r: 25}, {x: 750, y: 880, r: 20}, {x: 520, y: 820, r: 25}
    ],
  };
}

export function caroState(mt){
  const T=3.4,DW=2.4;
  const k=Math.floor(mt/T),f=mt%T;
  let frac=0,rotating=false;
  if(f>DW){const u=(f-DW)/(T-DW);frac=u*u*(3-2*u);rotating=true;}
  return {angle:(k+frac)*Math.PI*2/3,tool:k%3,rotating};
}

export function surfPos(sf,s){return [sf.x1+sf.tx*s, sf.y1+sf.ty*s];}
export function leaveSurf(world,p,sf,atS,dir){ 
  const [x,y]=surfPos(sf,atS);
  p.state='fall';p.surf=null;
  p.x=x+sf.tx*2.5*dir; p.y=y+1.2;
  p.vx=sf.tx*p.vt; p.vy=Math.max(0,sf.ty*p.vt);
  if(Math.abs(sf.ty)>0.6&&sf.kind!=='belt')p.vx*=0.3; 
  p.noLandId=sf.id; p.noLandT=world.t;
}
export function segCross(ax,ay,bx,by, cx,cy,dx,dy){
  const rX=bx-ax,rY=by-ay,sX=dx-cx,sY=dy-cy;
  const den=rX*sY-rY*sX;
  if(Math.abs(den)<1e-9)return null;
  const t=((cx-ax)*sY-(cy-ay)*sX)/den;
  const u=((cx-ax)*rY-(cy-ay)*rX)/den;
  if(t<-0.001||t>1.001||u<-0.001||u>1.001)return null;
  return {t,u};
}
export function step(world,dt,motOf){
  world.t+=dt;
  const mot=id=>Math.max(0,Math.min(1,motOf(id)));
  // Arbitrary projectile and teleport mechanics removed in favor of physical routing.


  const frozenAt=(x,y,p)=>{
    let r=regionAt(x,y);
    if(p){ if(r)p.regionId=r; else r=p.regionId||null; }
    return r?mot(r)<0.5:false;
  };

  /* -------- actuators -------- */
  for (const regId in TOOLS) {
      if (TOOLS[regId] && TOOLS[regId].step) {
          TOOLS[regId].step(world, dt, mot);
      }
  }

  /* -------- parcel integration -------- */
  for(const p of world.parcels){
    if(p.bin){p.fade+=dt;continue;}
    if(p.state==='carried')continue;                 // moved by actuator
    if(frozenAt(p.x,p.y,p))continue;                   // snapshot: time stopped here

    if(p.state==='surf'){
      const sf=world.smap[p.surf];
      const m=mot(sf.region);
      // drive
      if(sf.kind==='belt'){
        p.vt+=(sf.speed*m-p.vt)*Math.min(1,10*dt);
      }else{
        // gravity along tangent + friction
        const at=G*sf.ty;
        if(Math.abs(sf.ty)<0.08){ p.vt*=Math.exp(-6*dt); } // level: friction
        else p.vt+=at*dt*0.9;
        p.vt=Math.max(-VMAX_SLIDE,Math.min(VMAX_SLIDE,p.vt));
      }
      const sPrev=p.s;
      p.s+=p.vt*dt;
      { // hold at a frozen region boundary
        const [nx2,ny2]=surfPos(sf,Math.min(sf.len,Math.max(0,p.s)));
        if(frozenAt(nx2,ny2)&&!frozenAt(p.x,p.y)){p.s=sPrev;p.vt=0;}
      }
      // end-stop walls on queue ledges (and conditional jams)
      if((sf.endStop||(sf.stopIf&&sf.stopIf(mot)))&&p.s>sf.len-2){p.s=sf.len-2;p.vt=0;}
      // conditional inline holds (e.g. stamp press)
      if (sf.holdIf && sf.holdIf(mot, p)) {
         let holdS = sf.holdAt || 130;
         if (p.s > holdS) { p.s = holdS; p.vt = 0; }
      }
      // Re-enable size filter dropping small packages:
      if(sf.id==='sieve'&&p.size==='sm'&&p.s>30&&p.s<40){
        leaveSurf(world,p,sf,p.s,1);
        continue;
      }
      if(p.s<0){ // slid backwards off the start
        leaveSurf(world,p,sf,0,-1);
      }else if(p.s>=sf.len){
        // leaving the far end
        let act=sf.onEnd;
        if(typeof act==='function')act=act(world,p);
        if(act==='fall')act=null;
        if(!act&&sf.next)act={link:sf.next};
        if(act&&typeof act==='object'&&act.link){
          const nx=world.smap[act.link];
          p.surf=nx.id;p.s=Math.max(0,p.s-sf.len);
          // keep speed magnitude
        }else{
          leaveSurf(world,p,sf,sf.len,1);
        }
      }else{
        const [x,y]=surfPos(sf,p.s);p.x=x;p.y=y;
        if(p.tool<0&&sf.id==='merge'&&p.x>1112&&p.x<1132&&mot('carousel')>0.5&&!world.caro.rotating)
          p.tool=world.caro.tool;
      }
    }
    else if(p.state==='fall'){
      const ox=p.x,oy=p.y;
      p.vy=Math.min(VMAX_FALL,p.vy+G*dt);
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      
      // Pinball Bumpers moved entirely to tool_pinball.js

      if(frozenAt(p.x,p.y)&&!frozenAt(ox,oy)){ // hover at the frozen edge
        p.x=ox;p.y=oy;p.vy=0;continue;
      }
      // sorter colour router: crossing the flap line while falling
      if(oy<236&&p.y>=236&&p.x>548&&p.x<630){

        if(mot('sorter')<0.5){p.x=ox;p.y=oy;p.vy=0;continue;} // frozen flap blocks the drop
        const chute=p.color==='blue'?'bl1':(p.color==='grey'?'gy1':'wm1');
        const sf=world.smap[chute];
        p.state='surf';p.surf=chute;p.s=4;p.vt=48;
        const [x,y]=surfPos(sf,p.s);p.x=x;p.y=y;
        world.flap.targetAngle=p.color==='blue'?0.55:(p.color==='grey'?-0.6:0);
        continue;
      }
      // walls
      for(const wl of world.walls){
        if(p.y>wl.y1&&p.y<wl.y2){
          if(ox<=wl.x&&p.x>wl.x){p.x=wl.x-p.hw*0.4;p.vx*=-0.15;}
          else if(ox>=wl.x&&p.x<wl.x){p.x=wl.x+p.hw*0.4;p.vx*=-0.15;}
        }
      }
      // bins
      let binned=false;
      for(const b of world.bins){
        if(p.vy>0&&oy<=b.y&&p.y>b.y&&p.x>b.x+6&&p.x<b.x+b.w-6){
          if (b.id === 'grey' || b.id === 'blue') {
             // do NOT set p.state to settled or delete them! Let them physically pile natively
             binned = true;
             break;
          }
          p.bin=b.id;p.state='settled';
          const n=b.count;b.count++;
          b.colors[p.color]=(b.colors[p.color]||0)+1;
          p.x=b.x+16+(n%4)*(b.w-30)/3;p.y=b.y+b.h-8-(Math.floor(n/4)%2)*12;
          world.counters.delivered[b.id]++;
          world.counters.deliveredStats.total++;
          world.counters.deliveredStats.colors[p.color] = (world.counters.deliveredStats.colors[p.color]||0)+1;
          world.counters.deliveredStats.sizes[p.size] = (world.counters.deliveredStats.sizes[p.size]||0)+1;
          if(!world.counters.telemetry) world.counters.telemetry = [];
          world.counters.telemetry.push({ id: p.id, in: p.original, out: { size: p.size, color: p.color, shape: p.shape, number: p.number, hero: p.hero }, bin: b.id });
          if(b.id==='B'&&p.rec.length>10)world.bluePath=p.rec.slice();
          binned=true;break;
        }
      }
      if(binned)continue;
      // land on surfaces
      if(p.vy>0){
        let hit=null;
        for(const sf of world.surfaces){
          if(p.noLandId===sf.id&&world.t-p.noLandT<0.12)continue;
          // must approach from the up-side of the surface
          let nx=sf.ty,ny=-sf.tx;
          if(ny>0){nx=-nx;ny=-ny;}
          if((ox-sf.x1)*nx+(oy-sf.y1)*ny < -0.5)continue;
          const c=segCross(ox,oy,p.x,p.y, sf.x1,sf.y1,sf.x2,sf.y2);
          if(c&&(!hit||c.t<hit.c.t))hit={sf,c};
        }
        if(hit){
          const sf=hit.sf;
          p.state='surf';p.surf=sf.id;p.s=hit.c.u*sf.len;
          const proj=p.vx*sf.tx+p.vy*sf.ty;
          p.vt=sf.kind==='belt'?0:proj*0.7;
          p.vt=Math.max(-VMAX_SLIDE,Math.min(VMAX_SLIDE,p.vt));
          const [x,y]=surfPos(sf,p.s);p.x=x;p.y=y;p.vx=0;p.vy=0;
        }
      }
    }

    // trail recording (blue only — cheap, used for the finale trace)
    if(p.color==='blue'){
      p.recT+=dt;
      if(p.recT>0.06){p.recT=0;p.rec.push([p.x,p.y]);if(p.rec.length>500)p.rec.shift();}
    }
  }

  /* -------- queue / spacing pass (per surface) -------- */
  {
    const bySurf={};
    for(const p of world.parcels)
      if(p.state==='surf'&&!p.bin)(bySurf[p.surf]=bySurf[p.surf]||[]).push(p);
    for(const id in bySurf){
      const arr=bySurf[id];arr.sort((a,b)=>b.s-a.s); // front first
      const sf=world.smap[id];
      let leadS=Infinity;
      for(const p of arr){
        // the pin slots in as an obstacle only for parcels still behind it
        if(id==='beltB_r'&&world.press.pinOn&&p.s<84&&leadS>84)leadS=Math.min(leadS,84);
        const maxS=Math.max(p.hw+1, leadS-p.hw-2);
        if(p.s>maxS){p.s=maxS;if(p.vt>0)p.vt=0;const [x,y]=surfPos(sf,p.s);p.x=x;p.y=y;}
        leadS=p.s-p.hw;
      }
    }
  }

  /* -------- weigh bucket logic (spatial counts & eruption) -------- */
  let greySum = 0;
  let blueSum = 0;
  
  // 1. Spatially count the items dynamically resting in the boundaries
  for(const p of world.parcels){
    if (p.x > 432 && p.x < 516 && p.y > 350 && p.y <= 404) greySum++; 
    if (p.x > 980 && p.x < 1068 && p.y > 250 && p.y <= 304 && p.color === 'blue') blueSum++;
  }
  
  // Update the static counters for the renderer
  const gb = world.bins.find(b => b.id === 'grey');
  if (gb) gb.count = greySum;
  const bb = world.bins.find(b => b.id === 'blue');
  if (bb) bb.count = blueSum;

  const oldTipping = (world.weighBucket && world.weighBucket.tipping) ? world.weighBucket.tipping : 0;
  world.weighBucket = {weight: greySum};
  world.weighBucket.tipping = oldTipping;
  if (world.weighBucket.tipping > 0) world.weighBucket.tipping -= dt;
  if(blueSum >= 5) {
    world.weighBucket.tipping = 0.5; // for rendering animation
  }
  
  // Handle spatial boundaries and eruption mechanics!
  const erupting = world.weighBucket.tipping > 0;
  
  const floorG = world.smap['grey_floor'];
  if (floorG) { floorG.y1 = erupting ? -1000 : 404; floorG.y2 = floorG.y1; }
  
  const floorB = world.smap['blue_floor'];
  if (floorB) { floorB.y1 = erupting ? -1000 : 304; floorB.y2 = floorB.y1; }

  for (const p of world.parcels) {
    // Left/Right Walls for Grey Bucket (432, 516)
    if (p.y > 350 && p.y <= 404) {
      if (p.x > 410 && p.x < 460) p.x = Math.max(432 + p.hw, p.x); // Left wall
      if (p.x > 480 && p.x < 530) p.x = Math.min(516 - p.hw, p.x); // Right wall
      if (erupting && p.x > 420 && p.x < 530) {
        if (p.state === 'surf' && p.surf === 'grey_floor') {
            p.state = 'fall'; p.surf = null; p.vy = 20;
        }
      }
    }
    // Left/Right Walls for Blue Bucket (980, 1068)
    if (p.y > 250 && p.y <= 304) {
      if (p.x > 960 && p.x < 1010) p.x = Math.max(980 + p.hw, p.x); // Left wall
      if (p.x > 1030 && p.x < 1090) p.x = Math.min(1068 - p.hw, p.x); // Right wall
      if (erupting && p.x > 970 && p.x < 1080) {
        if (p.state === 'surf' && p.surf === 'blue_floor') {
            p.state = 'fall'; p.surf = null; p.vy = 20;
        }
      }
    }
  }

  /* -------- global 2D collision resolution -------- */
  for (let iter = 0; iter < 2; iter++) {
    for (let i = 0; i < world.parcels.length; i++) {
      const p1 = world.parcels[i];
      if (p1.bin || p1.state === 'carried') continue;
      for (let j = i + 1; j < world.parcels.length; j++) {
        const p2 = world.parcels[j];
        if (p2.bin || p2.state === 'carried') continue;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = p1.hw + p2.hw + 2; 
        if (dist > 0 && dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          let nx = dx / dist, ny = dy / dist;
          
          if (Math.abs(nx) < 0.1 && ny < -0.8) {
             nx += (world.rnd() < 0.5 ? 0.3 : -0.3); // Tumble jitter!
          }
          
          if (p1.state === 'surf') {
            const sf = world.smap[p1.surf];
            p1.s -= (nx * sf.tx + ny * sf.ty) * overlap;
            const [sx, sy] = surfPos(sf, p1.s);
            p1.x = sx; p1.y = sy;
          } else {
            p1.x -= nx * overlap; p1.y -= ny * overlap;
          }
          
          if (p2.state === 'surf') {
            const sf = world.smap[p2.surf];
            p2.s += (nx * sf.tx + ny * sf.ty) * overlap;
            const [sx, sy] = surfPos(sf, p2.s);
            p2.x = sx; p2.y = sy;
          } else {
            p2.x += nx * overlap; p2.y += ny * overlap;
          }
        }
      }
    }
  }

  /* -------- cleanup: escapes & faded settles -------- */
  for(let i=world.parcels.length-1;i>=0;i--){
    const p=world.parcels[i];
    if(!p.bin&&(p.y>H+40||p.x<-20||p.x>W+20)){
      world.escaped++;
      world.escapeLog.push({id:p.id,color:p.color,size:p.size,x:Math.round(p.x),y:Math.round(p.y),lastSurf:p.surf});
      world.parcels.splice(i,1);
    }else if(p.bin && p.bin !== 'grey' && p.fade>7){
      world.parcels.splice(i,1);
    }else if(!Number.isFinite(p.x)||!Number.isFinite(p.y)){
      world.escaped++;world.escapeLog.push({id:p.id,nan:true});
      world.parcels.splice(i,1);
    }
  }
}
