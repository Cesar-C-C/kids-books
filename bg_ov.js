/* Big Bang overlays — interactive hotspots.
   Image: 1216x832. Mapping: ovx = 12.6 + px/1216*974.8, ovy = py/832*667. */
window.OVL = {
  singularity(){
    const parts=[
      {name:'Singularity', nameZh:'奇点', fact:'the tiny, super-hot point where the whole universe began.', factZh:'宇宙开始的地方，一个又小又超级热的点。', px:580,py:380, lx:120,ly:110, anc:'start'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  bigbang(){
    const parts=[
      {name:'Big Bang', nameZh:'大爆炸', fact:'the giant fiery explosion that started the universe.', factZh:'让宇宙诞生的一场巨大火热爆炸。', px:600,py:400, lx:500,ly:80, anc:'middle'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  expanding(){
    const parts=[
      {name:'Universe', nameZh:'宇宙', fact:'all of space is stretching and getting bigger — it is expanding!', factZh:'整个空间都在拉伸、变大——它在膨胀！', px:590,py:380, lx:840,ly:120, anc:'end'},
    ];
    const arrows=[
      arrowSVG({name:'Expanding', nameZh:'膨胀', fact:'space keeps stretching outward, bigger and bigger.', factZh:'空间不停地向外拉伸，越来越大。', x1:590,y1:380,x2:910,y2:380, col:'#3a86ff', mk:'ab', tx:920,ty:360, anc:'end'}),
    ];
    return svgWrap(parts.map(partSVG).join('')+arrows.join(''));
  },
  light(){
    const parts=[
      {name:'Light', nameZh:'光', fact:'the first warm glow that filled the whole universe.', factZh:'充满整个宇宙的第一缕温暖光芒。', px:550,py:600, lx:500,ly:80, anc:'middle'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  particles(){
    const parts=[
      {name:'Particles', nameZh:'粒子', fact:'tiny cosmic building blocks that clump together to make everything.', factZh:'像宇宙积木一样的小颗粒，聚在一起组成万物。', px:680,py:500, lx:900,ly:500, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  star(){
    const parts=[
      {name:'Star', nameZh:'恒星', fact:'a bright, shining ball of hot gas in space.', factZh:'太空中一颗明亮发光的热气球。', px:540,py:410, lx:500,ly:80, anc:'middle'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  galaxy(){
    const parts=[
      {name:'Galaxy', nameZh:'星系', fact:'a giant spinning family of billions of stars.', factZh:'由无数恒星组成的巨大旋转大家庭。', px:360,py:220, lx:120,ly:120, anc:'start'},
      {name:'Galaxy', nameZh:'星系', fact:'galaxies come in many pretty shapes and colors.', factZh:'星系有各种各样漂亮的形状和颜色。', px:920,py:430, lx:900,ly:560, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  solar(){
    const parts=[
      {name:'Sun', nameZh:'太阳', fact:'our nearest star, a big warm ball of light at the center.', factZh:'离我们最近的恒星，中心一颗温暖的大光球。', px:750,py:290, lx:900,ly:200, anc:'end'},
      {name:'Earth', nameZh:'地球', fact:'our home planet, a tiny blue-and-green world.', factZh:'我们的家园，一颗蓝绿色的小星球。', px:320,py:580, lx:120,ly:600, anc:'start'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  universe(){
    const parts=[
      {name:'Star', nameZh:'恒星', fact:'huge numbers of stars make up the universe.', factZh:'无数恒星一起组成了宇宙。', px:580,py:410, lx:500,ly:80, anc:'middle'},
      {name:'Galaxy', nameZh:'星系', fact:'countless galaxies float in the universe.', factZh:'无数星系漂浮在宇宙之中。', px:810,py:200, lx:900,ly:170, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
};
