// scene.js

export const REGIONS = [
  {id:'intake',  boxes:[[104,56,478,210]]},
  {id:'sorter',  boxes:[[548,170,120,188],[428,236,180,364]]},
  {id:'skyway',  boxes:[[688,96,700,30],[686,112,58,246],[742,126,80,40],[1296,126,128,576]]},
  {id:'works',   boxes:[[640,360,412,150]]},
  {id:'carousel',boxes:[[1040,372,160,138]]},
  {id:'check',   boxes:[[1190,470,140,200]]},
  {id:'dispatch',boxes:[[940,600,660,300], [-100,850,1800,200]]},
  {id:'crushers',boxes:[[20,220,180,180]]},
  {id:'painters',boxes:[[20,420,300,350]]},
  {id:'pinball', boxes:[[350,680,500,250]]}
];

export function regionAt(x,y){
  for(const r of REGIONS)
    for(const b of r.boxes)
      if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return r.id;
  return null;
}

export function S(id,x1,y1,x2,y2,opt){
  const len=Math.hypot(x2-x1,y2-y1);
  return Object.assign({id,x1,y1,x2,y2,len,
    tx:(x2-x1)/len,ty:(y2-y1)/len,
    kind:'static',speed:0,region:'works',onEnd:'fall',next:null},opt);
}

export function buildSurfaces(){
  const s=[
    S('hop_l',120,80,206,150,{region:'intake'}),
    S('hop_r',310,80,230,150,{region:'intake'}),
    S('sieve',190,170,260,170,{kind:'belt', speed:45, region:'intake', onEnd:'fall'}),
    S('beltA',250,215,560,215,{kind:'belt',speed:55,region:'intake',stopIf:m=>m('sorter')<0.5}),
    
    // NEW REGIONS: CRUSHERS, PAINTERS, PINBALL
    // (cr_chute removed as small things no longer go to crushers)
    S('cr_bypass', 580, 236, 160, 250, {kind:'belt', speed:120, region:'sorter'}),
    S('cr_belt', 180, 260, 40, 260, {kind:'belt', speed: 80, region:'crushers', next: 'cr_out'}),
    S('cr_out', 40, 260, 250, 450, {region:'crushers', next: 'pt_in'}), 
    
    // Grey bucket drops here, feeding into pt_in
    S('pt_feed', 850, 526, 250, 450, {kind: 'belt', speed: 120, region: 'painters', next: 'pt_in'}),
    S('pt_in', 320, 460, 30, 460, {kind: 'belt', speed: 120, region: 'painters', next: 'pt_drop1'}), 
    S('pt_drop1', 30, 460, 30, 510, {region: 'painters', next: 'pt_b1'}),
    S('pt_b1', 30, 510, 235, 510, {kind: 'belt', speed: 120, region: 'painters', painter: 'magenta', next: 'pt_drop2'}), 
    S('pt_drop2', 235, 510, 235, 560, {region: 'painters', next: 'pt_b2'}),
    S('pt_b2', 235, 560, 30, 560, {kind: 'belt', speed: 120, region: 'painters', painter: 'green', next: 'pt_drop3'}),
    S('pt_drop3', 30, 560, 30, 610, {region: 'painters', next: 'pt_b3'}),
    S('pt_b3', 30, 610, 235, 610, {kind: 'belt', speed: 120, region: 'painters', painter: 'cyan', next: 'pt_drop4'}),
    S('pt_drop4', 235, 610, 235, 650, {region: 'painters', next: 'pt_b4'}),
    S('pt_b4', 235, 650, 30, 650, {kind: 'belt', speed: 120, region: 'painters', painter: 'white', next: 'pt_drop5'}),
    S('pt_drop5', 30, 650, 30, 660, {region: 'painters', next: 'pt_out'}),
    S('pt_out', 20, 660, 500, 670, {kind: 'belt', speed: 120, region: 'painters'}),

    S('pb_l', 350, 700, 550, 850, {region: 'pinball'}),
    S('pb_r', 800, 700, 650, 850, {region: 'pinball'}),
    S('pb_out', 550, 850, 700, 850, {kind: 'belt', speed: 120, region: 'pinball', next: 'ledge_base'}),
    S('ledge_base', 702, 874, 736, 882, {region: 'skyway', endStop: true}),
    
    // Bucket elevator dynamic surfaces
    S('bucket_0', 694, 880, 734, 880, {region: 'skyway'}),
    S('bucket_1', 694, 880, 734, 880, {region: 'skyway'}),
    S('bucket_2', 694, 880, 734, 880, {region: 'skyway'}),
    S('bucket_3', 694, 880, 734, 880, {region: 'skyway'}),
    S('bucket_4', 694, 880, 734, 880, {region: 'skyway'}),
    S('bucket_5', 694, 880, 734, 880, {region: 'skyway'}),
    
    // Bucket bin physical boundaries (slanted walls + floor)
    S('grey_wall_l', 412, 310, 427, 404, {region: 'sorter'}),
    S('grey_wall_r', 536, 310, 521, 404, {region: 'sorter'}),
    S('grey_floor', 412, 404, 536, 404, {region: 'sorter', endStop: true}),
    
    S('blue_wall_l', 980, 250, 995, 304, {region: 'skyway'}),
    S('blue_wall_r', 1068, 250, 1053, 304, {region: 'skyway'}),
    S('blue_floor', 980, 304, 1068, 304, {region: 'skyway', endStop: true}),

    S('arm_track_1', 1050, 480, 1100, 950, {region: 'carousel'}),
    S('arm_track_2', 1190, 480, 1150, 950, {region: 'carousel'}),

    S('ret_l', -100, 874, 702, 874, {kind: 'belt', speed: 200, region: 'dispatch', next: 'ledge_base'}),
    S('ret_r', 1700, 874, 736, 874, {kind: 'belt', speed: -200, region: 'dispatch', next: 'ledge_base'}),
    
    // PREVIOUS SURFACES
    S('gy1',578,246,498,330,{region:'sorter',next:'gy2'}),
    S('gy2',498,330,480,390,{region:'sorter'}),
    S('wm1',587,248,642,330,{region:'sorter',next:'wm2'}),
    S('wm2',642,330,656,386,{region:'sorter'}),
    S('bl1',594,244,700,314,{region:'sorter'}),
    S('ledge_lo',702,318,736,326,{region:'skyway',endStop:true}),
    S('ledge_hi',744,148,808,154,{region:'skyway',endStop:true}),
    S('pk1',1396,178,1320,226,{region:'skyway'}),
    S('pk2',1308,264,1396,314,{region:'skyway'}),
    S('pk3',1398,352,1316,404,{region:'skyway'}),
    S('pk4',1320,442,1402,494,{region:'skyway'}),
    S('bl2',1406,516,1424,668,{region:'skyway'}),
    S('beltB_l',652,395,812,395,{kind:'belt',speed:55,region:'works',
      onEnd:(w,p)=> p.wid>=17 ? {link:'beltB_r'} : 'fall'}),
    S('beltB_r',828,395,984,395,{kind:'belt',speed:55,region:'works'}),
    S('beltB_lo',800,470,1044,470,{kind:'belt',speed:55,region:'works'}),
    S('mrgL',990,400,1044,484,{region:'works'}),
    S('merge',1046,490,1188,490,{kind:'belt',speed:55,region:'carousel'}),
    S('ck_in',1194,498,1234,522,{region:'check',next:'ck_belt'}),
    S('ck_belt',1236,526,1304,526,{kind:'belt',speed:45,region:'check',
      onEnd:(w,p)=>{const rej=(p.size==='lg'&&!p.stamped);
        w.ckFlap.target=rej?0.95:0.15;
        return rej?{link:'ck_rej'}:{link:'ck_pass'};}}),
    S('ck_rej',1306,528,1318,566,{region:'check'}),
    S('ck_pass',1306,528,1338,614,{region:'check'}),
    S('pickup',1240,700,1446,700,{region:'dispatch'}),
  ];
  const map={};for(const x of s)map[x.id]=x;return {list:s,map};
}

export const WALLS=[
  {x:1302,y1:170,y2:510},
  {x:1408,y1:126,y2:512},
  {x:1446,y1:660,y2:700},
  {x:1240,y1:660,y2:700},
  {x:25,y1:450,y2:700},
  {x:240,y1:450,y2:650},
];

export const BINS=[
  {id:'grey', x:412,y:310,w:124,h:94},
  {id:'blue', x:980,y:250,w:88,h:54},
  {id:'rej',  x:1280,y:612,w:74,h:50},
  {id:'A',    x:990,y:828,w:88,h:58},
  {id:'B',    x:1120,y:828,w:88,h:58},
];
