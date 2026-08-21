/* Big Bang — unified book data */
window.BOOK = {
  id:'bigbang',
  title:'The Big Bang',
  titleZh:'宇宙大爆炸',
  subtitle:'A Space Story for Curious Kids',
  subtitleZh:'给好奇宝宝看的太空故事',
  age:'4-8 岁',
  audioDir:'audio',
  coverImg:'assets/00_cover_c.webp'
};

window.PAGES = [
  { cover:true },

  { img:'assets/01_singularity_c.webp',
    en:"Long, long ago, everything in the whole universe was squeezed into one tiny, super-hot point. We call it a <span class='word'>singularity</span>.",
    zh:"很久很久以前，宇宙里所有的东西都被挤在一个又小又超级热的点里。我们叫它「奇点」。",
    ov:'singularity', interactive:true },

  { img:'assets/03_bang_c.webp',
    en:"Then — BOOM! The universe was born in a giant, fiery explosion we call the <span class='word'>Big Bang</span>.",
    zh:"然后——砰！宇宙在一场巨大的火热爆炸中诞生了，我们叫它「大爆炸」。",
    ov:'bigbang', interactive:true },

  { img:'assets/02_expand_c.webp',
    en:"Space began to stretch, bigger and bigger, like a balloon slowly getting larger. The universe was <span class='word'>expanding</span>.",
    zh:"空间开始拉伸，越变越大，就像一个慢慢吹大的气球。宇宙正在「膨胀」。",
    ov:'expanding', interactive:true },

  { img:'assets/04_light_c.webp',
    en:"Tiny bits of energy turned into the first <span class='word'>light</span>, filling space with a warm, gentle glow.",
    zh:"小小的能量变成了最早的「光」，让宇宙充满了温暖柔和的光。",
    ov:'light', interactive:true },

  { img:'assets/05_particles_c.webp',
    en:"As the universe cooled, tiny <span class='word'>particles</span> began to stick together, like cosmic building blocks.",
    zh:"宇宙慢慢变凉，小小的「粒子」开始黏在一起，就像宇宙的积木。",
    ov:'particles', interactive:true },

  { img:'assets/06_star_c.webp',
    en:"Those clumps grew hotter and hotter until they shone as bright <span class='word'>stars</span>.",
    zh:"这些团块越变越热，最后变成了明亮发光的「恒星」。",
    ov:'star', interactive:true },

  { img:'assets/07_galaxy_c.webp',
    en:"Many stars gathered into beautiful, spinning groups called <span class='word'>galaxies</span>.",
    zh:"许多恒星聚在一起，组成了美丽的旋转大家庭，叫做「星系」。",
    ov:'galaxy', interactive:true },

  { img:'assets/08_solar_c.webp',
    en:"In one galaxy, our <span class='word'>Sun</span> formed, with little worlds like <span class='word'>Earth</span> traveling around it.",
    zh:"在一个星系里，我们的「太阳」形成了，还有像「地球」这样的小星球绕着它转。",
    ov:'solar', interactive:true },

  { img:'assets/09_universe_c.webp',
    en:"Today the <span class='word'>universe</span> is huge and full of stars, galaxies, and wonderful surprises.",
    zh:"今天，「宇宙」浩瀚无垠，充满了恒星、星系和等待发现的奇妙惊喜。",
    ov:'universe', interactive:true },

  { img:'assets/10_vocab_c.webp',
    en:"Great job! You just learned how the universe began. Tap the cards to hear the space words again!",
    zh:"太棒了！你刚学会了宇宙是怎么开始的。点一点卡片，再听一遍太空词汇吧！",
    ov:null, interactive:false,
    glossary:[
      {en:'Big Bang', zh:'大爆炸', def:'the giant explosion that started everything', defZh:'让一切开始的巨大爆炸'},
      {en:'singularity', zh:'奇点', def:'the tiny point where it all began', defZh:'一切开始的那个小点'},
      {en:'expand', zh:'膨胀', def:'to grow bigger and bigger', defZh:'变得越来越大'},
      {en:'light', zh:'光', def:'the first warm glow in space', defZh:'太空中第一缕温暖的光'},
      {en:'particles', zh:'粒子', def:'tiny bits that build everything', defZh:'组成万物的小颗粒'},
      {en:'star', zh:'恒星', def:'a shining ball of hot gas', defZh:'发光的热气球'},
      {en:'galaxy', zh:'星系', def:'a huge family of stars', defZh:'由恒星组成的大家庭'},
      {en:'Sun', zh:'太阳', def:'our nearest star', defZh:'离我们最近的恒星'},
      {en:'Earth', zh:'地球', def:'our blue-and-green home', defZh:'我们蓝绿色的家园'},
      {en:'universe', zh:'宇宙', def:'everything in all of space', defZh:'太空中所有的一切'}
    ] },
];

/* boot the reader once all globals are ready */
Reader.init();
