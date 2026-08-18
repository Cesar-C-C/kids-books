/* Big Bang overlays — BUBBLE-MODE hotspots (v2).
   All px/py are IMAGE pixel coordinates (1216 x 832).
   shared/overlays.js auto-converts px/py to SVG viewBox.
   BUBBLE MODE: every partSVG carries line + lineZh (first-person speech
   line) + lineKey (unique key for the pre-generated line MP3). No leader
   lines / SVG labels — the reader pops an HTML speech bubble with name +
   line + fact. Coordinates calibrated page-by-page with GLM vision assist. */
window.OVL = {
  singularity(){
    const parts=[
      {name:'Singularity', nameZh:'奇点', fact:'the tiny, super-hot point where the whole universe began.', factZh:'宇宙开始的地方，一个又小又超级热的点。', px:580,py:380,
       line:"Hi! I'm the Singularity — where the whole universe began!", lineZh:'嗨！我是奇点，整个宇宙都从我这里开始！', lineKey:'singularity_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  bigbang(){
    const parts=[
      {name:'Big Bang', nameZh:'大爆炸', fact:'the giant fiery explosion that started the universe.', factZh:'让宇宙诞生的一场巨大火热爆炸。', px:600,py:400,
       line:"BOOM! I'm the Big Bang — I started everything!", lineZh:'轰！我是大爆炸，一切都是我开始的！', lineKey:'bigbang_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  expanding(){
    const parts=[
      {name:'Universe', nameZh:'宇宙', fact:'all of space is stretching and getting bigger — it is expanding!', factZh:'整个空间都在拉伸、变大——它在膨胀！', px:590,py:380,
       line:"I'm the universe — I keep stretching bigger and bigger!", lineZh:'我是宇宙，我一直在变大变大！', lineKey:'expanding_0'},
      {name:'Expanding', nameZh:'膨胀', fact:'space keeps stretching outward, bigger and bigger.', factZh:'空间不停地向外拉伸，越来越大。', px:780,py:370,
       line:"Watch me grow — space stretches outward!", lineZh:'看我长大——空间不停向外拉伸！', lineKey:'expanding_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  light(){
    const parts=[
      {name:'Light', nameZh:'光', fact:'the first warm glow that filled the whole universe.', factZh:'充满整个宇宙的第一缕温暖光芒。', px:550,py:600,
       line:"I'm Light — the first warm glow everywhere!", lineZh:'我是光，填满宇宙的第一缕暖光！', lineKey:'light_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  particles(){
    const parts=[
      {name:'Particles', nameZh:'粒子', fact:'tiny cosmic building blocks that clump together to make everything.', factZh:'像宇宙积木一样的小颗粒，聚在一起组成万物。', px:680,py:500,
       line:"We're Particles — tiny building blocks of everything!", lineZh:'我们是粒子，组成万物的小积木！', lineKey:'particles_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  star(){
    const parts=[
      {name:'Star', nameZh:'恒星', fact:'a bright, shining ball of hot gas in space.', factZh:'太空中一颗明亮发光的热气球。', px:540,py:410,
       line:"I'm a Star — a bright hot ball shining in space!", lineZh:'我是恒星，太空里发亮的热气球！', lineKey:'star_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  galaxy(){
    const parts=[
      {name:'Galaxy', nameZh:'星系', fact:'a giant spinning family of billions of stars.', factZh:'由无数恒星组成的巨大旋转大家庭。', px:360,py:220,
       line:"I'm a Galaxy — billions of stars spinning together!", lineZh:'我是星系，几十亿颗恒星一起转！', lineKey:'galaxy_0'},
      {name:'Galaxy', nameZh:'星系', fact:'galaxies come in many pretty shapes and colors.', factZh:'星系有各种各样漂亮的形状和颜色。', px:945,py:415,
       line:"We galaxies come in many pretty shapes!", lineZh:'我们星系有好多漂亮的形状！', lineKey:'galaxy_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  solar(){
    const parts=[
      {name:'Sun', nameZh:'太阳', fact:'our nearest star, a big warm ball of light at the center.', factZh:'离我们最近的恒星，中心一颗温暖的大光球。', px:750,py:290,
       line:"I'm the Sun — your nearest star, warm and bright!", lineZh:'我是太阳，离你最近的恒星，又暖又亮！', lineKey:'solar_0'},
      {name:'Earth', nameZh:'地球', fact:'our home planet, a tiny blue-and-green world.', factZh:'我们的家园，一颗蓝绿色的小星球。', px:350,py:570,
       line:"I'm Earth — your blue-and-green home!", lineZh:'我是地球，你蓝绿色的家！', lineKey:'solar_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  universe(){
    const parts=[
      {name:'Star', nameZh:'恒星', fact:'huge numbers of stars make up the universe.', factZh:'无数恒星一起组成了宇宙。', px:580,py:410,
       line:"So many stars make up the universe!", lineZh:'好多恒星一起组成宇宙！', lineKey:'universe_0'},
      {name:'Galaxy', nameZh:'星系', fact:'countless galaxies float in the universe.', factZh:'无数星系漂浮在宇宙之中。', px:840,py:190,
       line:"Countless galaxies float in me!", lineZh:'无数星系在我里面漂浮！', lineKey:'universe_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
};
