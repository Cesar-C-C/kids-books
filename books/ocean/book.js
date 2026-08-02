/* Ocean — unified book data */
window.BOOK = {
  id:'ocean',
  title:'Secrets of the Deep Ocean',
  titleZh:'海洋深处的秘密',
  subtitle:'A Journey from Sunlight to the Deep Sea',
  subtitleZh:'从阳光区到深海的旅程',
  age:'4-8 岁',
  audioDir:'audio',
  coverImg:'assets/01_cover.webp'
};

window.PAGES = [
  { cover:true },

  { img:'assets/02_sunlight.webp',
    en:"The ocean has layers. The top layer is called the <span class='word'>SUNLIGHT ZONE</span>. It is bright and warm, and many fish play here.",
    zh:"海洋有很多层。最上面一层叫「阳光区」。这里明亮又温暖，许多小鱼在这里玩耍。",
    ov:'sunlight', interactive:true },

  { img:'assets/03_coral.webp',
    en:"Under the waves, you can find a <span class='word'>CORAL REEF</span>. It is a colorful city made of tiny animals. Clownfish and turtles love to live here.",
    zh:"海浪下面，你会发现「珊瑚礁」。它是一座由小动物组成的彩色城市。小丑鱼和海龟喜欢住在这里。",
    ov:'coral', interactive:true },

  { img:'assets/04_kelp.webp',
    en:"Tall green <span class='word'>KELP</span> grows like an underwater forest. Tiny seahorses hold on tight so they do not float away.",
    zh:"高高的绿色「海藻」像水下的森林一样生长。小海马紧紧抓着海藻，这样就不会漂走。",
    ov:'kelp', interactive:true },

  { img:'assets/05_twilight.webp',
    en:"Deeper down, we enter the <span class='word'>TWILIGHT ZONE</span>. The water gets darker, but a big gentle whale shark and glowing jellyfish still swim here.",
    zh:"再往下，我们来到「微光区」。水变得更暗了，但巨大的鲸鲨和发光的水母还在这里游动。",
    ov:'twilight', interactive:true },

  { img:'assets/06_angler.webp',
    en:"In the deep, dark sea lives the funny <span class='word'>ANGLERFISH</span>. It has a tiny glowing lure on its head, like a built-in flashlight!",
    zh:"在又深又暗的大海里，住着滑稽的「鮟鱇鱼」。它头上有一个发光的小灯，就像自带的手电筒！",
    ov:'angler', interactive:true },

  { img:'assets/07_midnight.webp',
    en:"Now we are in the <span class='word'>MIDNIGHT ZONE</span>, where it is almost totally dark. Some animals make their own light—bioluminescence!",
    zh:"现在我们到了「午夜区」，这里几乎一片漆黑。有些动物会自己发光——这就是生物发光！",
    ov:'midnight', interactive:true },

  { img:'assets/08_abyss.webp',
    en:"The <span class='word'>ABYSS</span> is near the very bottom. It is cold and dark, but soft sea cucumbers and red tube worms still call it home.",
    zh:"「深渊」靠近海底。这里又冷又黑，但柔软的海参和红色的管虫仍然把这里当家。",
    ov:'abyss', interactive:true },

  { img:'assets/09_vents.webp',
    en:"Look! A <span class='word'>HYDROTHERMAL VENT</span> is like a hot chimney on the seafloor. Warm bubbles rise up, and special crabs live nearby.",
    zh:"看！「热泉」就像海底的一个热烟囱。温暖的气泡升上来，特殊的螃蟹住在旁边。",
    ov:'vents', interactive:true },

  { img:'assets/10_trench.webp',
    en:"The <span class='word'>MARIANA TRENCH</span> is the deepest part of the ocean. Even here, a tiny snailfish can live. It is shaped to handle great pressure.",
    zh:"「马里亚纳海沟」是海洋最深的地方。即使在这里，小小的狮子鱼也能生存。它的身体能适应巨大的压力。",
    ov:'trench', interactive:true },

  { img:'assets/11_matters.webp',
    en:"The ocean is very important. It gives us air to breathe, food to eat, and a beautiful world to explore. Let's protect it together!",
    zh:"海洋非常重要。它给我们呼吸的空气、吃的食物，还有美丽的世界去探索。让我们一起保护海洋吧！",
    ov:'matters', interactive:true },

  { img:'assets/12_vocab.webp',
    en:"You did it! You explored from the sunny surface to the deep trench. Tap the cards to hear the ocean words again!",
    zh:"太棒了！你从阳光明媚的海面一路探索到了深深的海沟。点一点卡片，再听一遍海洋词汇吧！",
    ov:null, interactive:false,
    glossary:[
      {en:'Sunlight Zone', zh:'阳光区', def:'the bright top layer of the ocean', defZh:'海洋明亮的顶层'},
      {en:'Coral Reef', zh:'珊瑚礁', def:'a colorful home for sea animals', defZh:'海洋动物们的彩色家园'},
      {en:'Kelp', zh:'海藻', def:'tall underwater seaweed', defZh:'高高的水下海藻'},
      {en:'Twilight Zone', zh:'微光区', def:'the dim middle layer of the ocean', defZh:'海洋昏暗的中层'},
      {en:'Anglerfish', zh:'鮟鱇鱼', def:'a deep-sea fish with a glowing lure', defZh:'头上有发光小灯的深海鱼'},
      {en:'Midnight Zone', zh:'午夜区', def:'the very dark deep layer of the ocean', defZh:'海洋漆黑一片的深层'},
      {en:'Abyss', zh:'深渊', def:'the cold dark seafloor area', defZh:'又冷又黑的海底区域'},
      {en:'Hydrothermal Vent', zh:'热泉', def:'a hot chimney on the seafloor', defZh:'海底的热烟囱'},
      {en:'Mariana Trench', zh:'马里亚纳海沟', def:'the deepest place in the ocean', defZh:'海洋最深的地方'},
      {en:'Ocean', zh:'海洋', def:'the big blue home for sea life', defZh:'海洋生物的蓝色家园'}
    ] },
];

/* boot the reader once all globals are ready */
Reader.init();
