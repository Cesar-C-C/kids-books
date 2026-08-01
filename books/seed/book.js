/* ============================================================
   Seed book data: How a Seed Travels / 一颗种子的旅行
   ============================================================ */
window.BOOK = {
  id: 'seed',
  title: 'How a Seed Travels',
  titleZh: '一颗种子的旅行',
  subtitle: 'From a tiny seed to a big, strong plant',
  subtitleZh: '从一颗小小的种子,长成强壮的植物',
  age: '4-8 岁',
  coverImg: 'assets/01_cover.png',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/01_cover.png',
    cover: true,
    en: 'How a Seed Travels',
    zh: '一颗种子的旅行',
    ov: 'seed_cover'
  },
  {
    img: 'assets/02_sleep.png',
    en: 'A tiny seed sleeps in the warm, cozy soil. It dreams of sunshine and gentle rain.',
    zh: '一颗小小的种子睡在温暖又舒服的泥土里。它梦见阳光和温柔的雨水。',
    interactive: true,
    ov: 'seed_02'
  },
  {
    img: 'assets/03_sprout.png',
    en: 'Pitter-patter! Raindrops wake the seed up. A little green sprout peeks out and says hello!',
    zh: '滴答滴答！雨点叫醒了种子。一个小小的绿芽探出头来，跟大家打招呼！',
    interactive: true,
    ov: 'seed_03'
  },
  {
    img: 'assets/04_root.png',
    en: 'The roots grow down, down, down. They meet a friendly worm and hold the plant tight.',
    zh: '根往下长呀长。它们遇到了一条友好的蚯蚓，紧紧抓住泥土。',
    interactive: true,
    ov: 'seed_04'
  },
  {
    img: 'assets/05_stem.png',
    en: 'The stem grows up, up, up. Two round leaves reach for the smiling sun.',
    zh: '茎往上长呀长。两片圆圆的叶子伸向微笑的太阳。',
    interactive: true,
    ov: 'seed_05'
  },
  {
    img: 'assets/06_flower.png',
    en: 'Look! A pretty pink flower opens. A happy butterfly comes to visit.',
    zh: '看！一朵漂亮的粉花开放了。一只开心的蝴蝶飞来拜访。',
    interactive: true,
    ov: 'seed_06'
  },
  {
    img: 'assets/07_pollinate.png',
    en: 'A busy bee lands on the flower. It carries tiny yellow pollen from flower to flower.',
    zh: '一只勤劳的小蜜蜂落在花上。它把小小的黄色花粉从一朵花带到另一朵花。',
    interactive: true,
    ov: 'seed_07'
  },
  {
    img: 'assets/08_fruit.png',
    en: 'The flower turns into a juicy red apple. New seeds hide inside, waiting for their own journey.',
    zh: '花变成了一个多汁的红苹果。新的种子藏在里面，等待自己的旅程。',
    interactive: true,
    ov: 'seed_08'
  },
  {
    img: 'assets/09_spread.png',
    en: 'Whoosh! The wind blows fluffy seeds away. A little bird helps carry one far, far away.',
    zh: '呼——风吹走了毛茸茸的种子。一只小鸟帮忙把一颗种子带到很远很远的地方。',
    interactive: true,
    ov: 'seed_09'
  },
  {
    img: 'assets/10_newgrowth.png',
    en: 'In a new green field, the seed grows into a little plant. The journey begins again!',
    zh: '在一片新的绿草地上，种子长成了一棵小苗。旅程又开始啦！',
    interactive: true,
    ov: 'seed_10'
  },
  {
    img: 'assets/11_important.png',
    en: 'Plants give us fresh air to breathe and yummy food to eat. Thank you, green friends!',
    zh: '植物给我们新鲜空气呼吸，还有美味的食物吃。谢谢你，绿色的朋友！',
    interactive: true,
    ov: 'seed_11'
  },
  {
    img: 'assets/12_vocab.png',
    en: 'Words from our garden',
    zh: '我们的花园词汇表',
    glossary: [
      {en:'Seed', zh:'种子', def:'a baby plant waiting to grow', defZh:'等待长大的小宝宝植物'},
      {en:'Root', zh:'根', def:'grows down to hold the plant', defZh:'往下长，抓住泥土'},
      {en:'Stem', zh:'茎', def:'the plant\'s green body', defZh:'植物绿色的身体'},
      {en:'Leaf', zh:'叶', def:'catches sunlight', defZh:'吸收阳光'},
      {en:'Flower', zh:'花', def:'makes seeds', defZh:'能制造种子'},
      {en:'Fruit', zh:'果实', def:'holds new seeds', defZh:'藏着新种子'}
    ]
  }
];

Reader.init();
