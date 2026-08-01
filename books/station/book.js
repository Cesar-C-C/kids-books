/* ============================================================
   Space Station book data: The Space Station / 太空站
   Structure + operating principles, for ages 4-8
   ============================================================ */
window.BOOK = {
  id: 'station',
  title: 'The Space Station',
  titleZh: '太空站',
  subtitle: 'our home among the stars',
  subtitleZh: '我们在星星之间的家',
  age: '4-8 岁',
  coverImg: 'assets/00_cover.png',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover.png',
    cover: true,
    en: 'Space Station — Our Home Among the Stars',
    zh: '太空站：我们在星星之间的家'
  },
  {
    img: 'assets/01_what.png',
    en: 'A space station is a big house in space where astronauts live and work. It flies high above our Earth.',
    zh: '太空站是建在太空里的大房子，宇航员在这里生活、做实验。它高高地飞行在地球之上。',
    ov: 'station_what', interactive: true
  },
  {
    img: 'assets/02_overview.png',
    en: 'The station is made of round modules joined together, with big wings and a long arm. It is like a little town in space.',
    zh: '太空站由几个圆筒舱段连在一起，还有大翅膀和一条长手臂。它就像太空里的一座小城市。',
    ov: 'station_overview', interactive: true
  },
  {
    img: 'assets/03_living.png',
    en: 'In the living module, astronauts sleep in bags, eat at a table, and run on a treadmill to stay strong.',
    zh: '在生活舱里，宇航员睡在睡袋里、在餐桌吃饭、在跑步机上锻炼，保持身体健康。',
    ov: 'station_living', interactive: true
  },
  {
    img: 'assets/04_lab.png',
    en: 'In the lab module, scientists grow plants, make crystals, and study how our bodies work up high.',
    zh: '在实验舱里，科学家种植物、造晶体，研究人体在太空中是怎么运作的。',
    ov: 'station_lab', interactive: true
  },
  {
    img: 'assets/05_solar.png',
    en: 'Huge solar panels catch sunlight and turn it into electricity — that is the power for the whole station.',
    zh: '巨大的太阳能板像翅膀，把阳光变成电，给整个太空站供电。',
    ov: 'station_solar', interactive: true
  },
  {
    img: 'assets/06_arm.png',
    en: 'The robot arm is like a long hand. It reaches out and catches visiting spacecraft to hold them safe.',
    zh: '机械臂像一条长手臂，伸出去抓住来访的飞船，把它们稳稳地接住。',
    ov: 'station_arm', interactive: true
  },
  {
    img: 'assets/07_docking.png',
    en: 'Cargo and crew ships fly up and dock — clicking together with the station so people and food can come aboard.',
    zh: '货运飞船和载人飞船飞上来，和太空站“对接”连在一起，人和补给就能进入站内。',
    ov: 'station_docking', interactive: true
  },
  {
    img: 'assets/08_orbit.png',
    en: 'The station is always falling — but it moves so fast it keeps circling Earth and never lands! That round path is its orbit.',
    zh: '太空站其实一直在“往下掉”，只是它飞得很快，永远绕地球转圈，所以掉不下来！这条圆圆的路线就是轨道。',
    ov: 'station_orbit', interactive: true
  },
  {
    img: 'assets/09_float.png',
    en: 'Because it is always falling, everything floats — even the astronauts sleep while floating in the air!',
    zh: '因为一直在自由下落，舱里东西都飘起来了，宇航员也飘在半空中睡觉呢！',
    ov: 'station_float', interactive: true
  },
  {
    img: 'assets/10_life.png',
    en: 'The station makes oxygen to breathe and recycles water to drink, so astronauts can live far from home.',
    zh: '太空站会制造氧气让人呼吸，还会回收水让人喝，这样宇航员就能远离地球生活。',
    ov: 'station_life', interactive: true
  },
  {
    img: 'assets/11_earth.png',
    en: 'From the station, you can see blue Earth, white clouds, and glowing ribbons of aurora far below.',
    zh: '从太空站往下看，能看见蓝色的地球、白云，还有远处发光的一条条极光。',
    ov: 'station_earth', interactive: true
  },
  {
    img: 'assets/12_return.png',
    en: 'When the mission ends, astronauts ride a spacecraft away from the station and fly back down to Earth.',
    zh: '任务结束，宇航员坐飞船离开太空站，飞回地球家园。',
    ov: 'station_return', interactive: true
  },
  {
    img: 'assets/13_glossary.png',
    en: 'Great job, little explorer! You learned what a space station is, how it stays up, and how astronauts live among the stars.',
    zh: '做得好，小探险家！你学会了太空站是什么、怎么不掉下来，还有宇航员怎么在星星之间生活。',
    ov: 'station_glossary', interactive: true,
    glossary: [
      {en:'Space station', zh:'太空站', def:'a house in space where astronauts live', defZh:'宇航员在太空生活的大房子'},
      {en:'Astronaut', zh:'宇航员', def:'a person who travels to space', defZh:'去太空旅行的人'},
      {en:'Module', zh:'舱段', def:'a round room joined to the station', defZh:'连在太空站上的圆圆房间'},
      {en:'Solar panel', zh:'太阳能板', def:'catches sunlight and makes electricity', defZh:'收集阳光变成电的翅膀'},
      {en:'Robot arm', zh:'机械臂', def:'a long arm that catches spacecraft', defZh:'抓住飞船的长手臂'},
      {en:'Orbit', zh:'轨道', def:'the round path around the Earth', defZh:'绕着地球的圆圆路线'},
      {en:'Microgravity', zh:'失重', def:'when everything floats in the air', defZh:'东西都飘在空中的状态'},
      {en:'Docking', zh:'对接', def:'clicking a ship to the station', defZh:'把飞船连到太空站上'},
      {en:'Oxygen', zh:'氧气', def:'the air we breathe to live', defZh:'我们呼吸、赖以存活的气体'},
      {en:'Earth', zh:'地球', def:'our blue and green home planet', defZh:'我们蓝绿相间的家园星球'}
    ]
  }
];

Reader.init();
