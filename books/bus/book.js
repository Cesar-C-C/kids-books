/* ============================================================
   Double-Decker Bus book data:
   详细构造 · bubble-mode interactive hotspots.
   Order: cover → parts map → upper deck cutaway → lower deck
   cutaway → staircase → driver cab → engine → wheel → doors
   scene → open-top scene → street scene → vocab recap.
   ============================================================ */
window.BOOK = {
  id: 'bus',
  title: 'The Double-Decker Bus',
  titleZh: '双层巴士的秘密',
  subtitle: 'a two-story bus for busy city streets',
  subtitleZh: '跑在城市街道上的两层大巴士',
  age: '4-8 岁',
  coverImg: 'assets/00_cover.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover.webp',
    cover: true,
    en: 'The Double-Decker Bus',
    zh: '双层巴士的秘密'
  },
  {
    img: 'assets/01_parts.webp',
    en: 'Meet the double-decker bus! It is a bus with two floors — an upper deck on top and a lower deck below. A staircase inside joins the two. It carries lots of passengers around the city.',
    zh: '来认识双层巴士吧！它是有两层车厢的巴士——上面是上层，下面是下层。里面有一段楼梯把两层连起来。它能载着好多乘客在城市里跑。',
    ov: 'bs_parts', interactive: true
  },
  {
    img: 'assets/02_upper.webp',
    en: 'Upstairs is the upper deck. Passengers love to sit here because the windows are high and the view is wonderful. Rows of soft seats line both sides, with a walkway in the middle.',
    zh: '楼上是上层车厢。乘客最爱坐这里，因为窗户高、风景好。一排排软软的座位分列两边，中间是走道。',
    ov: 'bs_upper', interactive: true
  },
  {
    img: 'assets/03_lower.webp',
    en: 'Downstairs is the lower deck. The doors are here, so passengers get on and off easily. There is a wide open space for a wheelchair or stroller, and a special seat for people who need it most.',
    zh: '楼下是下层车厢。车门在这里，乘客上下车很方便。这里有一片空地放轮椅或婴儿车，还有一个留给最需要的人的爱心座。',
    ov: 'bs_lower', interactive: true
  },
  {
    img: 'assets/04_stairs.webp',
    en: 'A staircase connects the two decks. Hold the handrail and climb up step by step! At the top you pop out onto the upper deck — what a fun ride!',
    zh: '一段楼梯把两层连起来。扶着扶手，一步一步爬上去！到了顶上你就来到上层车厢——多有趣的旅程啊！',
    ov: 'bs_stairs', interactive: true
  },
  {
    img: 'assets/05_cab.webp',
    en: 'The driver sits in the cab at the front. A big steering wheel turns the bus, and a dashboard full of dials helps the driver stay safe and on time.',
    zh: '司机坐在最前面的驾驶室里。一个大方向盘转动巴士，一排仪表帮助司机安全准点地开车。',
    ov: 'bs_cab', interactive: true
  },
  {
    img: 'assets/06_engine.webp',
    en: 'At the back of the bus hides the engine. It is the strong heart that makes the wheels turn and pushes the heavy bus along the road. PUM-PUM, goes the engine!',
    zh: '巴士尾部藏着发动机。它是强壮的心脏，让车轮转动，推动沉重的巴士在路上跑。咚——咚——发动机响起来！',
    ov: 'bs_engine', interactive: true
  },
  {
    img: 'assets/07_wheel.webp',
    en: 'Look at the wheel! The double-decker bus has big black rubber tires with shiny silver hubcaps. The thick rubber grips the road so the heavy bus does not slip.',
    zh: '看车轮！双层巴士有黑色大橡胶轮胎，配着亮亮的银色轮毂。厚厚的橡胶抓紧路面，让沉重的巴士不打滑。',
    ov: 'bs_wheel', interactive: true
  },
  {
    img: 'assets/08_doors.webp',
    en: 'At the bus stop, the doors open! Passengers hop on at the front and tap their card. When the bus stops again, people hop off at the back. On and off, all day long!',
    zh: '到站了，车门打开！乘客在前门上车，刷一下卡。巴士再停，人们在后面下车。上上下下，一整天！',
    ov: 'bs_doors', interactive: true
  },
  {
    img: 'assets/09_opentop.webp',
    en: 'Some double-decker buses have an open top! Tourists love to ride up here in the sunshine, looking at all the sights of the city. What a fun way to travel!',
    zh: '有些双层巴士的车顶是敞开的！游客最爱在阳光下坐在这里，看遍城市的风景。多有趣的旅行方式啊！',
    ov: 'bs_opentop', interactive: true
  },
  {
    img: 'assets/10_street.webp',
    en: 'Off we go! The bus rumbles down the street. It stops for red lights, opens its doors at the bus stop, and shares the road with cars and people.',
    zh: '出发啦！巴士轰隆隆驶过街道。它在红灯前停下，在公交站开门，和小汽车、行人一起走。',
    ov: 'bs_street', interactive: true
  },
  {
    img: 'assets/11_vocab.webp',
    en: 'Great job, little conductor! You learned the parts of a double-decker bus. Can you name them all?',
    zh: '做得好，小小列车员！你学会了双层巴士的部件。你能叫出它们的名字吗？',
    ov: 'bs_vocab', interactive: true,
    glossary: [
      {en:'Double-decker bus', zh:'双层巴士',     def:'a bus with two floors', defZh:'有两层车厢的巴士'},
      {en:'Tire',              zh:'轮胎',         def:'the rubber wheel', defZh:'橡胶车轮'},
      {en:'Window',            zh:'窗户',         def:'glass to look out', defZh:'看外面的玻璃'},
      {en:'Seat',              zh:'座位',         def:'where passengers sit', defZh:'乘客坐的地方'},
      {en:'Steering wheel',    zh:'方向盘',       def:'turns the bus', defZh:'让巴士转弯'},
      {en:'Engine',            zh:'发动机',       def:'the powerful heart', defZh:'巴士有力的心脏'},
      {en:'Staircase',         zh:'楼梯',         def:'links the two floors', defZh:'连接两层'},
      {en:'Door',              zh:'车门',         def:'open to hop on or off', defZh:'打开就能上下车'}
    ]
  }
];

Reader.init();
