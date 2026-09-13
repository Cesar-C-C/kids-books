/* Whole-rocket parts for the v3 studio. Same contract as PLANE_PARTS / HSR_PARTS:
   one entry per navigable region, one assembly per entry in the geometry module. */
window.ROCKET_PARTS = [
  {
    id: 'fairing', name: 'Payload fairing', zhName: '整流罩', category: 'A SAFE COVER',
    color: '#dd8950',
    en: 'This cover protects the satellite during launch. Its two halves open and fall away when they are no longer needed.',
    zh: '这个外罩在发射时保护卫星。不再需要它时，两半罩体会分离脱落。',
    tip: '拖动动作滑杆，看两片外罩向两边张开；里面藏着什么？'
  },
  {
    id: 'satellite', name: 'Satellite', zhName: '卫星', category: 'OUR SPACE CARGO',
    color: '#bd922e',
    en: 'This satellite is the rocket\u2019s cargo. Its solar panels are folded for the ride into space.',
    zh: '这颗卫星是火箭运送的载荷。它的太阳能板在发射时折叠收好，进入太空后再展开。',
    tip: '打开整流罩，找到金色的星体和两侧的蓝色太阳能板。'
  },
  {
    id: 'upperstage', name: 'Upper stage', zhName: '上面级', category: 'KEEP GOING',
    color: '#579f94',
    en: 'This smaller rocket sits above the main stage. Its engine helps carry the satellite toward its orbit.',
    zh: '这个较小的火箭级位于主级上方。它的发动机继续加速，帮助把卫星送向预定轨道。',
    tip: '找到绿色短圆筒，再转到下方，观察它自己的小发动机喷管。'
  },
  {
    id: 'interstage', name: 'Interstage', zhName: '级间段', category: 'JOIN THE STAGES',
    color: '#6b809a',
    en: 'This hollow section joins two rocket stages. It surrounds the upper stage\u2019s engine before the stages separate.',
    zh: '这段中空结构连接上下两级火箭。在两级分离前，它包围着上面级的发动机。',
    tip: '拆解后看看蓝灰色的短圆环，中间有空洞。它不是另一个燃料箱。'
  },
  {
    id: 'structure', name: 'Rocket structure', zhName: '箭体结构', category: 'STRONG AND LIGHT',
    color: '#759686',
    en: 'The rocket has a strong, light structure. In this model, we open its outer skin to see the tanks inside.',
    zh: '火箭有坚固而轻巧的结构。这个教学模型把外壳打开，让我们观察内部的贮箱。',
    tip: '打开剖面，找出沿箭体一圈圈的环框和竖直的加强条。'
  },
  {
    id: 'fuel', name: 'Fuel tank', zhName: '燃料箱', category: 'STORE THE FUEL',
    color: '#d38752',
    en: 'This tank holds liquid fuel. The engine uses fuel with an oxidizer to make hot gas.',
    zh: '这个贮箱储存液体燃料。发动机让燃料与氧化剂反应，产生高温气体。',
    tip: '拆开外壳，找到橙色贮箱，看看它两端圆鼓鼓的封头。'
  },
  {
    id: 'oxidizer', name: 'Oxidizer tank', zhName: '氧化剂箱', category: 'OXYGEN ON BOARD',
    color: '#508dab',
    en: 'This tank holds liquid oxygen. It helps the fuel burn, even where there is no air.',
    zh: '这个贮箱储存作为氧化剂的液氧。它让燃料在没有空气的太空中也能燃烧。',
    tip: '找到蓝色贮箱，和橙色燃料箱比较：火箭把两样都带在身上。'
  },
  {
    id: 'boosters', name: 'Boosters', zhName: '助推器', category: 'AN EXTRA PUSH',
    color: '#547ea4',
    en: 'These two side rockets give an extra push at liftoff. They separate after their propellant is used up.',
    zh: '两侧的助推火箭在起飞时提供额外推力。推进剂耗尽后，它们会与主火箭分离。',
    tip: '数一数两侧的蓝白色助推器，再从下方找找各自的喷管。'
  },
  {
    id: 'engines', name: 'Main engines', zhName: '主发动机', category: 'PUSH UPWARD',
    color: '#c07550',
    en: 'These engines send hot gas down through their nozzles. That gives the rocket a push upward.',
    zh: '这些发动机把高温气体从喷管向下喷出，产生推动火箭向上的推力。',
    tip: '转到火箭下方，找出钟形喷管，再打开剖面看看里面的涡轮泵。'
  }
];
