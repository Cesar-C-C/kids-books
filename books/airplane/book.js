/* Airplane — unified book data */
window.BOOK = {
  id:'airplane',
  title:'How Airplanes Work',
  titleZh:'飞机是怎么飞的',
  subtitle:'Airplane Parts & Flight',
  subtitleZh:'飞机的构造与飞行',
  age:'4-8 岁',
  audioDir:'audio',
  coverImg:'assets/01_cover_c.webp'
};

window.PAGES = [
  { cover:true },

  { img:'assets/02_overview_c.webp',
    en:"An airplane has many parts that work together. Tap a part to learn its name!",
    zh:"飞机由许多部件协同工作。点一点零件，听听它的名字！",
    ov:'overview', interactive:true },

  { img:'assets/03_fuselage_c.webp',
    en:"The <span class='word'>FUSELAGE</span> is the body. The cockpit is for pilots. The cabin carries passengers. The cargo hold carries bags.",
    zh:"机身是主体。驾驶舱给飞行员用，客舱载乘客，货舱装行李。",
    ov:'fuselage', interactive:true },

  { img:'assets/04_wing_c.webp',
    en:"The <span class='word'>WING</span> makes LIFT — the upward push that holds the plane in the sky. A small flap, the <span class='word'>AILERON</span>, helps it roll and turn.",
    zh:"机翼产生升力——把飞机托在空中的向上力量。小襟翼（副翼）帮助飞机滚转和转弯。",
    ov:'wing', interactive:true },

  { img:'assets/05_lift_c.webp',
    en:"Air flows FAST over the curved top and SLOW under the bottom. Fast air presses less, so the wing is pushed UP. That push is <span class='word'>LIFT</span>.",
    zh:"气流在弯曲的机翼上方流得快、下方流得慢。上方流速快、压力小，于是机翼被向上推——这股推力就是升力。",
    ov:'lift', interactive:false },

  { img:'assets/06_tail_c.webp',
    en:"The <span class='word'>TAIL</span> keeps the plane steady. The RUDDER turns it left or right. The ELEVATOR tips the nose up or down.",
    zh:"尾翼让飞机保持平稳。方向舵控制左右转向，升降舵控制机头上仰或下俯。",
    ov:'tail', interactive:true },

  { img:'assets/07_engine_c.webp',
    en:"The <span class='word'>ENGINE</span> sucks in air, burns fuel, and shoots hot air BACKWARD. That push makes <span class='word'>THRUST</span>, moving the plane FORWARD.",
    zh:"引擎吸入空气、燃烧燃料，把热气向后喷出。这股推力就是推力，推动飞机向前。",
    ov:'engine', interactive:true },

  { img:'assets/08_forces_c.webp',
    en:"Four forces act on a plane: <span class='word'>LIFT</span> up, WEIGHT down, <span class='word'>THRUST</span> forward, DRAG back. When lift = weight and thrust = drag, it flies straight.",
    zh:"作用在飞机上有四种力：升力向上、重力向下、推力向前、阻力向后。当升力=重力、推力=阻力时，飞机平稳直线飞行。",
    ov:'forces', interactive:true },

  { img:'assets/09_gear_c.webp',
    en:"<span class='word'>LANDING GEAR</span> are the wheels. They come DOWN for takeoff and landing, and fold UP in the air to go faster.",
    zh:"起落架就是轮子。起飞和降落时放下，在空中收起以飞得更快。",
    ov:'gear', interactive:true },

  { img:'assets/10_takeoff_c.webp',
    en:"The plane speeds up the runway. When <span class='word'>LIFT</span> grows bigger than WEIGHT, it leaves the ground — TAKEOFF!",
    zh:"飞机在跑道上加速。当升力大于重力时，它就离开地面——起飞！",
    ov:'takeoff', interactive:false },

  { img:'assets/11_cruise_c.webp',
    en:"Up high, <span class='word'>LIFT</span> balances WEIGHT and <span class='word'>THRUST</span> balances DRAG. The plane flies smooth and steady.",
    zh:"在高空，升力平衡重力、推力平衡阻力，飞机平稳飞行。",
    ov:'cruise', interactive:false },

  { img:'assets/12_landing_c.webp',
    en:"To land, the plane slows down and drops its wheels. It touches the ground gently. Welcome back!",
    zh:"降落时，飞机减速并放下轮子，轻轻接触地面。欢迎回家！",
    ov:'landing', interactive:false },

  { img:'assets/11_cruise_c.webp',
    en:"Now you know how an airplane is built and how it flies!",
    zh:"现在你懂飞机的构造和飞行原理啦！",
    ov:null, interactive:false,
    glossary:[
      {en:'Fuselage', zh:'机身', def:'the body', defZh:'飞机的身子'},
      {en:'Wing', zh:'机翼', def:'makes Lift', defZh:'产生升力'},
      {en:'Engine', zh:'引擎', def:'makes Thrust', defZh:'产生推力'},
      {en:'Tail', zh:'尾翼', def:'steady (rudder)', defZh:'保持平稳（方向舵）'},
      {en:'Lift', zh:'升力', def:'upward push', defZh:'向上的推力'},
      {en:'Thrust', zh:'推力', def:'forward push', defZh:'向前的推力'}
    ] },
];

/* boot the reader once all globals are ready */
Reader.init();
