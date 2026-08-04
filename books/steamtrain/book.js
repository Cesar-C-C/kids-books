/* ============================================================
   Steam Train book data: How a Steam Train Works / 蒸汽火车怎么跑起来
   Principle-focused: fire → steam → piston → wheels → motion
   ============================================================ */
window.BOOK = {
  id: 'steamtrain',
  title: 'How a Steam Train Works',
  titleZh: '蒸汽火车怎么跑起来',
  subtitle: 'fire, steam, and wheels working together',
  subtitleZh: '火、蒸汽和轮子齐心合力',
  age: '4-8 岁',
  coverImg: 'assets/01_cover_v2.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/01_cover_v2.webp',
    cover: true,
    en: 'How a Steam Train Works',
    zh: '蒸汽火车怎么跑起来'
  },
  {
    img: 'assets/02_overview_v2.webp',
    en: 'A steam train is a giant metal machine on wheels. Up front is the engine that makes it go. Behind it rides the tender, full of coal and water. Let us look inside!',
    zh: '蒸汽火车是一台带轮子的巨型金属机器。最前面是让它跑起来的发动机，后面跟着装满煤和水的煤水车。我们进去看看吧！',
    ov: 'st_parts', interactive: true
  },
  {
    img: 'assets/03_firebox_v3.webp',
    en: 'Deep inside the engine is the firebox. The fireman shovels coal into the fire. The coal burns with a bright, hot flame — this is where the train’s energy begins!',
    zh: '发动机最里面是炉膛。司炉把煤铲进火里。煤炭烧起明亮炽热的火焰——火车的能量就是从这里开始的！',
    ov: 'st_firebox', interactive: true
  },
  {
    img: 'assets/04_boiler_v3.webp',
    en: 'Above the fire sits the boiler, a long tube full of water. The hot fire heats the water until it boils and turns into steam — just like a giant kettle!',
    zh: '火的上面是锅炉，一根装满水的长管子。炽热的火把水加热，直到水沸腾变成蒸汽——就像一把巨大的水壶！',
    ov: 'st_boiler', interactive: true
  },
  {
    img: 'assets/05_steamdome_v3.webp',
    en: 'The steam rises and gathers under a round dome on top. As more steam piles up, it pushes hard. This strong push is called pressure!',
    zh: '蒸汽升起来，聚集在顶部圆圆的蒸汽包里。蒸汽越聚越多，使劲往外挤。这种强大的推力叫“压力”！',
    ov: 'st_steamdome', interactive: true
  },
  {
    img: 'assets/06_piston_v3.webp',
    en: 'The strong steam rushes into a cylinder and pushes a sliding rod called a piston. Push — it slides one way. More steam — it slides back. Back and forth!',
    zh: '强大的蒸汽冲进气缸，推动一根叫活塞的滑杆。推一下，活塞滑过去；再来蒸汽，又滑回来。一来一回！',
    ov: 'st_piston', interactive: true
  },
  {
    img: 'assets/07_rod_v3.webp',
    en: 'The piston is linked to a long connecting rod. As the piston slides, the rod swings the big driving wheel around and around. The wheel turns, and the train rolls forward!',
    zh: '活塞连着一根长长的连杆。活塞一滑，连杆就带着大动轮转啊转。轮子转起来，火车就往前开啦！',
    ov: 'st_rod', interactive: true
  },
  {
    img: 'assets/08_wheels_v3.webp',
    en: 'The big driving wheels grip the steel rails. The heavier the train, the more wheels help it hold on and pull the cars behind. Chug, chug, forward!',
    zh: '大大的动轮紧紧咬住钢轨。火车越重，就需要更多轮子帮忙抓牢轨道、拉动后面的车厢。哐当，哐当，前进！',
    ov: 'st_wheels', interactive: true
  },
  {
    img: 'assets/09_whistle_v3.webp',
    en: 'On top of the cab is a shiny steam whistle. The driver pulls a cord, and a puff of steam makes a loud TOOT! to say “here comes the train!”',
    zh: '司机室顶上有一只亮亮的汽笛。司机拉一下绳子，一团蒸汽就发出响亮的“呜——！”，好像在说“火车来啦！”',
    ov: 'st_whistle', interactive: true
  },
  {
    img: 'assets/10_chimney_v3.webp',
    en: 'After the steam does its work, the leftover smoke puffs out of the tall funnel. The smoke rolls up into the sky in soft grey clouds.',
    zh: '蒸汽干完活之后，剩下的烟从高高的烟囱里冒出来，变成一团团灰色的云，飘上天空。',
    ov: 'st_chimney', interactive: true
  },
  {
    img: 'assets/11_tender_v3.webp',
    en: 'Behind the engine rides the tender. It carries the coal to burn and the water to boil — the two things the train needs to keep going all day long.',
    zh: '发动机后面跟着煤水车。它装着要烧的煤和要煮开的水——火车一整天跑下去，就靠这两样！',
    ov: 'st_tender', interactive: true
  },
  {
    img: 'assets/12_journey_v3.webp',
    en: 'Fire makes steam, steam pushes the piston, the piston turns the wheels, and the train chugs down the track! Every part works together. All aboard!',
    zh: '火生出蒸汽，蒸汽推动活塞，活塞带动车轮，火车就沿着铁轨哐当哐当跑起来！每个部件齐心合力。上车啦！',
    ov: 'st_journey', interactive: true
  },
  {
    img: 'assets/13_vocab_v3.webp',
    en: 'Great job, little engineer! You learned how fire, steam, and wheels work together to make a steam train roll. Can you name the parts?',
    zh: '做得好，小工程师！你学会了火、蒸汽和轮子怎么齐心合力，让蒸汽火车跑起来。你能叫出这些部件的名字吗？',
    ov: 'st_vocab', interactive: true,
    glossary: [
      {en:'Steam', zh:'蒸汽', def:'hot gas made from boiling water', defZh:'水烧开后变成的热气'},
      {en:'Firebox', zh:'炉膛', def:'the place where coal burns', defZh:'煤炭燃烧的地方'},
      {en:'Boiler', zh:'锅炉', def:'the tube that holds the water', defZh:'装水的长管子'},
      {en:'Piston', zh:'活塞', def:'a rod pushed by the steam', defZh:'被蒸汽推动的滑杆'},
      {en:'Driving wheel', zh:'动轮', def:'the big wheel that pulls the train', defZh:'拉动火车的大轮子'},
      {en:'Whistle', zh:'汽笛', def:'makes the loud TOOT sound', defZh:'发出响亮“呜”声的部件'},
      {en:'Tender', zh:'煤水车', def:'carries coal and water', defZh:'装着煤和水的车厢'}
    ]
  }
];

Reader.init();
