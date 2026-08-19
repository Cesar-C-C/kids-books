/* ============================================================
   Kindergarten School Bus book data:
   幼儿园校车 · bubble-mode interactive hotspots.
   Order: cover → parts map → driver cab → inside → wheels →
   stop sign → doors → bus aide → road → arrival → vocab recap.
   ============================================================ */
window.BOOK = {
  id: 'schoolbus',
  title: 'The Kindergarten School Bus',
  titleZh: '幼儿园校车',
  subtitle: 'a happy yellow bus that brings children to school',
  subtitleZh: '一辆快乐的黄色巴士，接送小朋友上幼儿园',
  age: '4-8 岁',
  coverImg: 'assets/00_cover.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover.webp',
    cover: true,
    en: 'The Kindergarten School Bus',
    zh: '幼儿园校车'
  },
  {
    img: 'assets/01_parts.webp',
    en: 'This is our kindergarten school bus! It is a happy yellow bus that picks children up and brings them safely to school. Big windows let us watch the world go by.',
    zh: '这是我们的幼儿园校车！它是一辆快乐的黄色巴士，接上小朋友，把他们安全送到幼儿园。大大的车窗让我们看外面的世界。',
    ov: 'sb_parts', interactive: true
  },
  {
    img: 'assets/02_driver.webp',
    en: 'The driver sits up front and holds the big steering wheel. The driver watches the road carefully and keeps every child safe on the trip.',
    zh: '司机坐在最前面，握着大方向盘。司机认真看着路，一路上保护每个小朋友的安全。',
    ov: 'sb_driver', interactive: true
  },
  {
    img: 'assets/03_inside_v2.webp',
    en: 'Inside, there are rows of cozy seats and a wide aisle down the middle. Friends sit together, talk, and sing on the way to school!',
    zh: '车里有一排排舒服的座位，中间是一条宽宽的走道。小伙伴们坐在一起，聊天、唱歌，开开心心去幼儿园！',
    ov: 'sb_inside', interactive: true
  },
  {
    img: 'assets/04_wheels.webp',
    en: 'Look at the wheels! Thick black tires grip the road, and shiny hubcaps spin round and round. The wheels roll the bus all the way to school.',
    zh: '看车轮！厚厚的黑色轮胎抓住路面，亮亮的轮毂转呀转。车轮带着巴士一路开到幼儿园。',
    ov: 'sb_wheels', interactive: true
  },
  {
    img: 'assets/05_stopsign.webp',
    en: 'When the bus stops, the red stop sign swings out and the yellow lights flash. Cars must wait. Then children can cross the road safely.',
    zh: '巴士一停下，红色停车牌就伸出来，黄灯一闪一闪。小汽车必须等着。这样小朋友才能安全过马路。',
    ov: 'sb_stopsign', interactive: true
  },
  {
    img: 'assets/06_doors.webp',
    en: 'At the kindergarten, the door opens with a friendly beep. One by one, children hop down the steps and wave goodbye to the driver.',
    zh: '到了幼儿园，车门"哔"的一声打开。小朋友一个接一个跳下台阶，跟司机挥手说再见。',
    ov: 'sb_doors', interactive: true
  },
  {
    img: 'assets/07_aide.webp',
    en: 'A kind bus aide rides along to help. The aide finds each child a seat, fastens a belt, and makes sure everyone is happy and safe.',
    zh: '一位亲切的随车老师也坐车上帮忙。她帮每个小朋友找到座位、系好安全带，让大家又开心又安全。',
    ov: 'sb_aide', interactive: true
  },
  {
    img: 'assets/08_road_v2.webp',
    en: 'On the road, the bus follows the rules. It waits at red lights, slows at the crosswalk, and shares the street with cars and people.',
    zh: '在路上，巴士遵守规则。红灯前停下，斑马线前放慢，和小汽车、行人一起走。',
    ov: 'sb_road', interactive: true
  },
  {
    img: 'assets/09_arrive.webp',
    en: 'Here we are! The bus arrives at the kindergarten gate. Children run to the slide and swings, ready for a fun day of play and learning.',
    zh: '到啦！巴士停在幼儿园门口。小朋友跑向滑梯和秋千，准备开始快乐的一天——玩耍和学本领。',
    ov: 'sb_arrive', interactive: true
  },
  {
    img: 'assets/10_vocab.webp',
    en: 'Great job, little rider! You learned the parts of the school bus. Can you name them all?',
    zh: '做得好，小车友！你认识了校车的各个部件。你能叫出它们的名字吗？',
    ov: 'sb_vocab', interactive: true,
    glossary: [
      {en:'School bus',      zh:'校车',     def:'a yellow bus for children', defZh:'接送孩子的黄色巴士'},
      {en:'Window',          zh:'车窗',     def:'where we look out',         defZh:'看外面的窗'},
      {en:'Seat',            zh:'座位',     def:'where children sit',        defZh:'小朋友坐的地方'},
      {en:'Wheel',           zh:'车轮',     def:'rolls the bus along',       defZh:'带着巴士跑'},
      {en:'Steering wheel',  zh:'方向盘',   def:'turns the bus',             defZh:'让巴士转弯'},
      {en:'Stop sign',       zh:'停车牌',   def:'tells cars to wait',        defZh:'让车停下的牌'},
      {en:'Flashing light',  zh:'警示灯',   def:'warns other drivers',       defZh:'提醒别的司机'},
      {en:'Bus aide',        zh:'随车老师', def:'helps the children',        defZh:'照顾小朋友的老师'}
    ]
  }
];

Reader.init();
