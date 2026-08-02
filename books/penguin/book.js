/* ============================================================
   Penguin book data: Penguins' Icy Home / 企鹅的冰雪家园
   ============================================================ */
window.BOOK = {
  id: 'penguin',
  title: "Penguins' Icy Home",
  titleZh: '企鹅的冰雪家园',
  subtitle: 'How penguins live in the coldest place on Earth',
  subtitleZh: '企鹅如何在地球上最冷的地方生活',
  age: '4-8 岁',
  coverImg: 'assets/01_cover.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/01_cover.webp',
    cover: true,
    en: "Penguins' Icy Home",
    zh: '企鹅的冰雪家园'
  },
  {
    img: 'assets/02_home.webp',
    en: 'Penguins live in Antarctica, the coldest place on Earth. Everything is white and blue, and giant icebergs float in the water.',
    zh: '企鹅生活在南极洲，地球上最冷的地方。到处都是白色和蓝色，巨大的冰山漂浮在水中。',
    ov: 'penguin_02', interactive: true
  },
  {
    img: 'assets/03_baby.webp',
    en: 'A penguin family has a mama, a papa, and a fluffy chick. They stand close together to stay warm and safe.',
    zh: '企鹅家庭有妈妈、爸爸和毛茸茸的宝宝。它们紧紧靠在一起取暖，保证安全。',
    ov: 'penguin_03', interactive: true
  },
  {
    img: 'assets/04_egg.webp',
    en: 'Papa penguin keeps the egg warm on top of his feet. He tucks it under his soft belly so it does not freeze.',
    zh: '企鹅爸爸把蛋放在脚背上保暖。他用柔软的肚皮把蛋盖住，这样蛋就不会冻坏。',
    ov: 'penguin_04', interactive: true
  },
  {
    img: 'assets/05_hatch.webp',
    en: 'Tap, tap, tap! The chick breaks the eggshell. Mama and papa are so happy to meet their little baby.',
    zh: '笃、笃、笃！企鹅宝宝啄破蛋壳。妈妈和爸爸见到小宝宝非常开心。',
    ov: 'penguin_05', interactive: true
  },
  {
    img: 'assets/06_fish.webp',
    en: 'Penguins are excellent swimmers. They glide through the cold water and catch small fish to eat.',
    zh: '企鹅是游泳高手。它们在冰冷的水中滑行，捕食小鱼当食物。',
    ov: 'penguin_06', interactive: true
  },
  {
    img: 'assets/07_slide.webp',
    en: 'Sometimes penguins slide on their bellies down snowy hills. It is faster than walking and a lot of fun!',
    zh: '有时候企鹅会趴在肚子上从雪坡上滑下来。这比走路快，也很好玩！',
    ov: 'penguin_07', interactive: true
  },
  {
    img: 'assets/08_feathers.webp',
    en: 'Penguins have thick, waterproof feathers. The feathers keep the cold water out and the warm air in.',
    zh: '企鹅有厚厚的防水羽毛。羽毛能挡住冷水，留住温暖的空气。',
    ov: 'penguin_08', interactive: true
  },
  {
    img: 'assets/09_waddle.webp',
    en: 'Penguins waddle when they walk. They walk in a long line with friends so everyone stays safe.',
    zh: '企鹅走路时摇摇摆摆。它们和朋友们排成一长队走，这样大家都安全。',
    ov: 'penguin_09', interactive: true
  },
  {
    img: 'assets/10_aurora.webp',
    en: 'At night, colorful lights dance across the sky. It is called the aurora, and penguins look up in wonder.',
    zh: '夜晚，彩色的光在天空中跳舞。这叫做极光，企鹅们惊奇地抬头看着。',
    ov: 'penguin_10', interactive: true
  },
  {
    img: 'assets/11_help.webp',
    en: 'We can help penguins by keeping the ocean clean. When we take care of nature, penguins stay happy and healthy.',
    zh: '我们可以通过保持海洋清洁来帮助企鹅。当我们爱护自然时，企鹅就会健康快乐。',
    ov: 'penguin_11', interactive: true
  },
  {
    img: 'assets/12_vocab.webp',
    en: 'Great job! You learned how penguins hatch, swim, slide, and keep warm in their icy home.',
    zh: '真棒！你学到了企鹅如何在冰雪家园里孵化、游泳、滑行和保暖。',
    ov: 'penguin_12', interactive: true,
    glossary: [
      {en:'Penguin', zh:'企鹅', def:'a black-and-white bird that swims', defZh:'一种会游泳的黑白相间的鸟'},
      {en:'Antarctica', zh:'南极洲', def:'the coldest place on Earth', defZh:'地球上最冷的地方'},
      {en:'Iceberg', zh:'冰山', def:'a giant floating piece of ice', defZh:'巨大的漂浮冰块'},
      {en:'Chick', zh:'雏鸟', def:'a baby penguin', defZh:'企鹅宝宝'},
      {en:'Feathers', zh:'羽毛', def:'soft covers that keep penguins warm', defZh:'让企鹅保暖的软软覆盖物'},
      {en:'Aurora', zh:'极光', def:'colorful lights in the polar sky', defZh:'极地天空中彩色的光'}
    ]
  }
];

Reader.init();
