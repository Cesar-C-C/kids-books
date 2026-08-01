/* ============================================================
   Rocket book data: How a Rocket Flies to Space / 火箭飞向太空
   Principle-focused: construction → launch → satellite return
   ============================================================ */
window.BOOK = {
  id: 'rocket',
  title: 'How a Rocket Flies to Space',
  titleZh: '火箭飞向太空',
  subtitle: 'build it, launch it, bring the satellite home',
  subtitleZh: '造火箭、送上天、把卫星带回家',
  age: '4-8 岁',
  coverImg: 'assets/01_cover.png',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/01_cover.png',
    cover: true,
    en: 'How a Rocket Flies to Space',
    zh: '火箭飞向太空'
  },
  {
    img: 'assets/13_parts.png',
    en: 'A rocket is made of parts. The pointy nose cone cuts through the air. A window lets us peek outside. The fuel tank holds the fuel, the engine makes fire, and the fins keep it steady.',
    zh: '火箭是由许多部件组成的。尖尖的整流罩帮它穿过空气，舷窗让我们往外看。燃料箱装燃料，发动机生火，尾翼让它飞得稳稳的。',
    ov: 'rocket_parts', interactive: true
  },
  {
    img: 'assets/05_thrust.png',
    en: 'Inside, the rocket carries fuel. The engine burns the fuel into a very hot fire. The hot fire wants to escape, so it shoots out the bottom fast.',
    zh: '火箭里面装着燃料。发动机把燃料烧成炽热的火。火想跑出去，就飞快地从底部喷出来。',
    ov: 'rocket_fuel', interactive: true
  },
  {
    img: 'assets/03_countdown.png',
    en: 'Before it leaves the ground, people count down: 3, 2, 1… GO! Everyone checks that the rocket is ready, then presses the launch button.',
    zh: '火箭离地前，人们会倒计时：3、2、1……发射！大家确认火箭准备好了，就按下发射按钮。',
    ov: 'rocket_countdown', interactive: true
  },
  {
    img: 'assets/04_launch.png',
    en: 'Fire blasts down out of the bottom. The rocket goes up, up, up! The push of the fire is stronger than the pull of gravity, so the rocket lifts off.',
    zh: '火焰从底部往下喷。火箭向上、向上飞！火的推力比地球的引力更强，所以火箭就升空了。',
    ov: 'rocket_launch', interactive: true
  },
  {
    img: 'assets/17_thrust.png',
    en: 'Why does it go up? When the engine pushes hot gas DOWN, the rocket is pushed UP. This is a rule of pushing: push one way, and you move the other way. Try letting go of a blown-up balloon!',
    zh: '为什么它会往上飞？当发动机把热气往“下”推，火箭就被推着往“上”走。这是一条用力的规律：往一个方向推，自己就往反方向走。你松开吹饱的气球试试看！',
    ov: 'rocket_thrust', interactive: true
  },
  {
    img: 'assets/14_stage.png',
    en: 'Rockets have stages. When the lower fuel tank is empty, it falls away. The rocket becomes lighter and can fly higher and faster into space.',
    zh: '火箭有好几级。当下方的燃料箱用完，它就掉下去。火箭变轻了，就能飞得更高、更快，冲向太空。',
    ov: 'rocket_stage', interactive: true
  },
  {
    img: 'assets/06_space.png',
    en: 'Soon the rocket is above the air, in space. There is no air up here, so everything floats. Earth looks small and beautiful from far away.',
    zh: '很快，火箭飞到了空气之上，进入了太空。这里没有空气，所有东西都漂浮着。从远处看，地球又小又美丽。',
    ov: 'rocket_space', interactive: true
  },
  {
    img: 'assets/15_orbit.png',
    en: 'High above Earth, the rocket lets go of a satellite. The satellite keeps flying around and around Earth. That round trip is called an orbit.',
    zh: '在地球高空，火箭把卫星放了出来。卫星一直绕着地球飞来飞去。这种绕圈的飞行叫做“轨道”。',
    ov: 'rocket_orbit', interactive: true
  },
  {
    img: 'assets/18_satellite.png',
    en: 'What does the satellite do? Its camera takes pictures of Earth. Its antenna sends TV and phone signals. Its solar panels catch sunlight to make power.',
    zh: '卫星是干什么的？它的相机给地球拍照，天线发送电视和电话信号，太阳能板收集阳光来产生能量。',
    ov: 'rocket_satellite', interactive: true
  },
  {
    img: 'assets/16_reentry.png',
    en: 'When its job is done, the satellite comes home. It falls back through the air. Rubbing the air makes it very hot, but a heat shield protects it from the flame.',
    zh: '工作完成后，卫星要回家了。它穿过空气往回掉。和空气摩擦会变得很烫，但防热盾保护它不被火焰烤坏。',
    ov: 'rocket_reentry', interactive: true
  },
  {
    img: 'assets/11_return.png',
    en: 'A parachute opens above it, or soft engines slow it down. The capsule lands gently and safely back on the ground.',
    zh: '头顶打开降落伞，或者用柔和的发动机让它慢下来。返回舱轻轻、稳稳地落回地面。',
    ov: 'rocket_return', interactive: true
  },
  {
    img: 'assets/02_earth.png',
    en: 'Welcome home, little satellite! It is back on our blue and green Earth, where it can rest after its big trip to space.',
    zh: '欢迎回家，小卫星！它回到了蓝绿相间的地球，在太空大旅行之后可以好好休息了。',
    ov: 'rocket_home', interactive: true
  },
  {
    img: 'assets/12_vocab.png',
    en: 'Great job, little explorer! You learned how a rocket is built, how it lifts off, and how a satellite flies home.',
    zh: '做得好，小探险家！你学会了火箭怎么造、怎么升空，还有卫星怎么飞回家。',
    ov: 'rocket_home', interactive: true,
    glossary: [
      {en:'Rocket', zh:'火箭', def:'a machine that flies to space', defZh:'能飞向太空的机器'},
      {en:'Fuel', zh:'燃料', def:'the food that makes fire', defZh:'生火需要的能量来源'},
      {en:'Thrust', zh:'推力', def:'the push that moves a rocket up', defZh:'推动火箭向上的力'},
      {en:'Stage', zh:'分级', def:'a part that drops off when empty', defZh:'燃料用完后掉下去的一段'},
      {en:'Satellite', zh:'卫星', def:'a machine that circles the Earth', defZh:'绕着地球转的小机器'},
      {en:'Orbit', zh:'轨道', def:'the round path around the Earth', defZh:'绕着地球的圆圆路线'},
      {en:'Heat shield', zh:'防热盾', def:'protects a capsule from hot flame', defZh:'保护返回舱不被火焰烤坏'}
    ]
  }
];

Reader.init();
