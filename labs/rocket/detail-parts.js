/* Inside discoveries for the rocket studio. Geometry is schematic: the outer skin
   opens only so the tanks can be seen, and no real separation sequence is claimed. */
window.ROCKET_DETAILS = [
  /* ---------- fairing ---------- */
  {
    id: 'fairing.half', region: 'fairing', name: 'Two halves', zhName: '两瓣罩体',
    en: 'The nose cone is made of two halves.', zh: '整流罩由左右两瓣拼成。',
    tip: '拖动动作滑杆，看两瓣罩体一起向外张开。',
    principle: '两瓣罩体用爆炸螺栓或火工装置锁在一起；到高空后再解锁、张开并分离。'
  },
  {
    id: 'fairing.tip', region: 'fairing', name: 'Pointed tip', zhName: '尖顶',
    en: 'The pointed tip cuts through the air.', zh: '尖尖的顶部划开空气。',
    tip: '从正上方看看最尖的那一点。',
    principle: '尖锥形的头部让激波更“贴”着飞行器，从而减小阻力。'
  },
  {
    id: 'fairing.skin', region: 'fairing', name: 'Fairing skin', zhName: '罩体蒙皮',
    en: 'The smooth skin keeps the air flowing around it.', zh: '光滑的蒙皮让空气顺着流过。',
    tip: '打开剖面，看看罩体里面那层浅色的内壁。',
    principle: '罩体由碳纤维或铝蜂窝夹层做成，既轻又硬，能挡住发射时的噪声与气动加热。'
  },
  {
    id: 'fairing.seam', region: 'fairing', name: 'Seam', zhName: '对接缝',
    en: 'This line is where the two halves meet.', zh: '这条线是两瓣罩体合在一起的地方。',
    tip: '转到侧面，找找那条从上到下的竖缝。',
    principle: '缝隙里有密封条，防止湿气和热气进入货物舱。'
  },

  /* ---------- satellite ---------- */
  {
    id: 'satellite.body', region: 'satellite', name: 'Satellite body', zhName: '卫星本体',
    en: 'The box in the middle holds the instruments.', zh: '中间的方盒装着各种仪器。',
    tip: '放大卫星，看看金色的方盒和上面的小盒子。',
    principle: '星体是承力主结构，里面放计算机、电池和通信设备，外面贴多层隔热毯控温。'
  },
  {
    id: 'satellite.panels', region: 'satellite', name: 'Solar wings', zhName: '太阳翼',
    en: 'These wings make electricity from sunlight.', zh: '这两片翅膀把阳光变成电。',
    tip: '拖动动作滑杆，看太阳翼从折叠状态展开。',
    principle: '太阳翼用光电材料把阳光直接变成电，展开后能获得更大的受光面积。'
  },
  {
    id: 'satellite.dish', region: 'satellite', name: 'Antenna', zhName: '天线',
    en: 'The dish talks with stations on the ground.', zh: '碟形天线和地面的站台通话。',
    tip: '找找卫星顶上那个小圆盘。',
    principle: '抛物面天线把无线电波聚成一束，让信号传得更远、更清楚。'
  },

  /* ---------- upperstage ---------- */
  {
    id: 'upperstage.engine', region: 'upperstage', name: 'Upper engine', zhName: '上面级发动机',
    en: 'This small engine fires again once in space.', zh: '这台小发动机在太空中再次点火。',
    tip: '转到上面级下方，找出小小的钟形喷管。',
    principle: '上面级在接近真空的环境工作，喷管做得更大更薄，才能把气体充分膨胀出去。'
  },
  {
    id: 'upperstage.tanks', region: 'upperstage', name: 'Small tanks', zhName: '小贮箱',
    en: 'These smaller tanks feed the upper engine.', zh: '这两个小贮箱给上面级发动机供料。',
    tip: '打开剖面，看看绿色外壳里面的两个小罐子。',
    principle: '贮箱之间用管路和阀门隔开，燃烧时按比例把燃料和氧化剂送进推力室。'
  },

  /* ---------- interstage ---------- */
  {
    id: 'interstage.ring', region: 'interstage', name: 'Connector ring', zhName: '连接环',
    en: 'This ring holds the two stages together.', zh: '这个环把上下两级牢牢连住。',
    tip: '找找深色的圆环，它像一条腰带卡在两级之间。',
    principle: '连接环要同时承受上面级的重量和发动机的推力，所以做成闭合的环形承力结构。'
  },
  {
    id: 'interstage.cavity', region: 'interstage', name: 'Engine space', zhName: '发动机空间',
    en: 'Inside is an empty space for the upper engine.', zh: '里面是给上面级发动机留的空位。',
    tip: '打开剖面，看看圆环中间那圈空腔。',
    principle: '分离时这一环被抛掉，上面级发动机的喷管才有空间点火工作。'
  },

  /* ---------- structure ---------- */
  {
    id: 'structure.frame', region: 'structure', name: 'Ring frames', zhName: '环形框',
    en: 'These rings keep the body round and stiff.', zh: '一道道环形框让箭体保持圆形、不易变形。',
    tip: '打开剖面，数一数沿箭体排下来的圆环。',
    principle: '环框抵抗箭体被压扁；和纵向长梁一起，把薄薄的蒙皮变成受力的筒壳。'
  },
  {
    id: 'structure.stringers', region: 'structure', name: 'Stringers', zhName: '纵向长梁',
    en: 'These long beams run from top to bottom.', zh: '这些长梁从上一直通到下。',
    tip: '顺着箭体的长度方向，找找那些细长的竖条。',
    principle: '长梁主要承担轴向的拉力和压力，把发动机的推力一路传到顶部。'
  },
  {
    id: 'structure.skin', region: 'structure', name: 'Outer skin', zhName: '外壳蒙皮',
    en: 'The thin skin is the outside wall of the rocket.', zh: '薄薄的蒙皮就是火箭的外墙。',
    tip: '拆解后看看那片浅色的外壁，它很薄但很结实。',
    principle: '蒙皮和内部骨架一起受力，这就是“半硬壳”式结构又轻又强的道理。'
  },
  {
    id: 'structure.separation', region: 'structure', name: 'Separation line', zhName: '分离面',
    en: 'This is where the rocket comes apart in flight.', zh: '火箭在空中就从这个位置分开。',
    tip: '找找箭体中间那道横向的接缝。',
    principle: '分离面用火工解锁装置固定，收到指令后瞬间解锁，让下面级带着空贮箱落下。'
  },

  /* ---------- fuel ---------- */
  {
    id: 'fuel.tank', region: 'fuel', name: 'Fuel chamber', zhName: '燃料舱',
    en: 'Liquid fuel is stored in here.', zh: '液体燃料就储存在这里面。',
    tip: '打开剖面，看看橙色贮箱的内部空间。',
    principle: '贮箱内壁光滑，减少流动阻力；箱内加压后，燃料被稳定地压向发动机。'
  },
  {
    id: 'fuel.dome', region: 'fuel', name: 'Rounded dome', zhName: '球形封头',
    en: 'The rounded ends are the strongest shape.', zh: '两端圆鼓鼓的封头是最结实的形状。',
    tip: '比较贮箱两端，看看它们怎样由圆柱变成圆弧。',
    principle: '球形封头让压力均匀分布，同样的厚度能承受更高的内部压力。'
  },
  {
    id: 'fuel.pipe', region: 'fuel', name: 'Feed line', zhName: '输送管',
    en: 'This pipe carries fuel down to the engines.', zh: '这条管子把燃料送到下面的发动机。',
    tip: '顺着贮箱底部往下找，看看通到喷管的那条主管路。',
    principle: '管路要足够粗，才能在发动机全功率工作时每秒送进去大量推进剂。'
  },

  /* ---------- oxidizer ---------- */
  {
    id: 'oxidizer.tank', region: 'oxidizer', name: 'Oxidizer chamber', zhName: '氧化剂舱',
    en: 'Liquid oxygen is kept cold in here.', zh: '液氧在低温下保存在这里面。',
    tip: '打开剖面，看看蓝色贮箱的内部空间。',
    principle: '液氧温度低到零下一百八十多度，所以贮箱要做绝热处理，也要防止结冰堵塞管路。'
  },
  {
    id: 'oxidizer.insulation', region: 'oxidizer', name: 'Insulation', zhName: '绝热层',
    en: 'This layer keeps the cold liquid cold.', zh: '这一层让低温液体保持低温。',
    tip: '看看蓝色贮箱外面那层浅色的包覆。',
    principle: '绝热层减少外部热量传入，降低液氧蒸发损失；发射前还要持续补充蒸发的部分。'
  },

  /* ---------- boosters ---------- */
  {
    id: 'boosters.case', region: 'boosters', name: 'Booster case', zhName: '助推器壳体',
    en: 'The strong case holds the booster fuel.', zh: '结实的壳体装着助推器的燃料。',
    tip: '放大一侧助推器，看看蓝白相间的细长圆筒。',
    principle: '助推器壳体是承受内压的压力容器，起飞时还要传递整支火箭的重量。'
  },
  {
    id: 'boosters.nozzle', region: 'boosters', name: 'Booster nozzle', zhName: '助推器喷管',
    en: 'Hot gas shoots out from here.', zh: '高温气体从这里喷出去。',
    tip: '转到助推器底部，找出它自己的小喷管。',
    principle: '每台助推器有自己的喷管，喷流方向可以略微偏转，用来帮助火箭转向。'
  },

  /* ---------- engines ---------- */
  {
    id: 'engines.nozzle', region: 'engines', name: 'Bell nozzle', zhName: '钟形喷管',
    en: 'The bell shape speeds up the hot gas.', zh: '钟形的喷管让高温气体加速喷出。',
    tip: '转到火箭底部，找出三个喇叭形的喷管。',
    principle: '喷管先收缩再扩张，把燃烧室里的高压气体变成高速喷流；速度越大，推力越大。'
  },
  {
    id: 'engines.chamber', region: 'engines', name: 'Combustion chamber', zhName: '燃烧室',
    en: 'Fuel and oxidizer burn here.', zh: '燃料和氧化剂在这里燃烧。',
    tip: '打开剖面，找出喷管上方那个圆鼓鼓的腔体。',
    principle: '燃烧室里温度可达三千摄氏度以上，所以要靠自身推进剂循环冷却，否则壁面会被烧穿。'
  },
  {
    id: 'engines.turbopump', region: 'engines', name: 'Turbopump', zhName: '涡轮泵',
    en: 'The pump pushes propellant in very fast.', zh: '涡轮泵把推进剂飞快地压进燃烧室。',
    tip: '打开剖面，在喷管旁边找找那个带叶轮的小装置。',
    principle: '涡轮泵用一部分推进剂驱动涡轮，再带动泵轮，每秒能把几百公斤推进剂压进燃烧室。'
  },
  {
    id: 'engines.gimbal', region: 'engines', name: 'Gimbal mount', zhName: '摇摆支架',
    en: 'The engine can tilt to steer the rocket.', zh: '发动机可以摆动，用来给火箭转向。',
    tip: '拖动动作滑杆，看喷管怎样绕支点轻轻摆动。',
    principle: '发动机整体偏转一个小小的角度，推力方向随之改变，火箭就能俯仰或偏航。'
  }
];
