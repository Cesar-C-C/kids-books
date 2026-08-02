/* ============================================================
   Space Station overlays — interactive hotspots for each page.
   Coordinate space: 1000 x 667 (matches shared/overlays.js)
   Image: 1216x832. Mapping: ovx = 12.6 + px/1216*974.8, ovy = py/832*667
   ============================================================ */
window.OVL = {

  // 1. 什么是太空站 — assets/01_what.png
  station_what(){
    return svgWrap(
      partSVG({px:600, py:280, lx:800, ly:240, anc:'start', name:'Space station', nameZh:'太空站', fact:'a big house in space where astronauts live', factZh:'宇航员在太空生活的大房子'}) +
      partSVG({px:480, py:600, lx:200, ly:600, anc:'end',  name:'Astronaut', nameZh:'宇航员', fact:'a person who travels and works in space', factZh:'去太空旅行和工作的人'})
    );
  },

  // 2. 太空站长什么样 — assets/02_overview.png
  station_overview(){
    return svgWrap(
      partSVG({px:600, py:350, lx:880, ly:280, anc:'start', name:'Module', nameZh:'舱段', fact:'a round room joined to the station', factZh:'连在太空站上的圆圆房间'}) +
      partSVG({px:200, py:200, lx:130, ly:180, anc:'end',  name:'Solar panel', nameZh:'太阳能板', fact:'the big blue wings that catch sunlight', factZh:'收集阳光的大蓝翅膀'}) +
      partSVG({px:750, py:400, lx:840, ly:340, anc:'start', name:'Robot arm', nameZh:'机械臂', fact:'a long arm that reaches out into space', factZh:'伸到太空里的长手臂'})
    );
  },

  // 3. 生活舱 — assets/03_living.png
  station_living(){
    return svgWrap(
      partSVG({px:440, py:400, lx:140, ly:330, anc:'end',  name:'Sleeping bag', nameZh:'睡袋', fact:'a cozy bag to sleep in, stuck to the wall', factZh:'贴在墙上的睡袋，可以睡觉'}) +
      partSVG({px:290, py:660, lx:130, ly:600, anc:'end',  name:'Table', nameZh:'餐桌', fact:'where astronauts eat their space meals', factZh:'宇航员吃饭的小桌子'}) +
      partSVG({px:620, py:500, lx:780, ly:430, anc:'start', name:'Treadmill', nameZh:'跑步机', fact:'keeps astronauts strong in space', factZh:'让宇航员在太空保持强壮'})
    );
  },

  // 4. 实验舱 — assets/04_lab.png
  station_lab(){
    return svgWrap(
      partSVG({px:240, py:480, lx:130, ly:410, anc:'end',  name:'Plant', nameZh:'植物', fact:'grown in a clear box to study in space', factZh:'在透明盒子里种，研究太空种植'}) +
      partSVG({px:520, py:600, lx:520, ly:580, anc:'middle', name:'Crystal', nameZh:'晶体', fact:'made by scientists for space study', factZh:'科学家在太空里造出来的晶体'}) +
      partSVG({px:950, py:480, lx:920, ly:410, anc:'start', name:'Experiment rack', nameZh:'实验柜', fact:'holds science tools and tubes', factZh:'装科学工具和试管的柜子'})
    );
  },

  // 5. 巨大的太阳能板 — assets/05_solar.png
  station_solar(){
    return svgWrap(
      partSVG({px:250, py:350, lx:130, ly:280, anc:'end',  name:'Solar panel', nameZh:'太阳能板', fact:'catches sunlight and turns it into power', factZh:'收集阳光，变成电'}) +
      partSVG({px:90,  py:200, lx:130, ly:160, anc:'end',  name:'Sunlight', nameZh:'阳光', fact:'the bright light from the Sun', factZh:'太阳发出来的明亮光线'})
    );
  },

  // 6. 机械臂 — assets/06_arm.png
  station_arm(){
    return svgWrap(
      partSVG({px:750, py:500, lx:850, ly:380, anc:'start', name:'Robot arm', nameZh:'机械臂', fact:'reaches out like a long hand to catch ships', factZh:'像长手一样伸出去抓飞船'})
    );
  },

  // 7. 飞船来串门（对接） — assets/07_docking.png
  station_docking(){
    return svgWrap(
      partSVG({px:370, py:500, lx:130, ly:380, anc:'end',  name:'Visiting spacecraft', nameZh:'来访飞船', fact:'a ship that flies up to the station', factZh:'飞上来找太空站的飞船'}) +
      partSVG({px:600, py:340, lx:790, ly:290, anc:'start', name:'Docking port', nameZh:'对接端口', fact:'where the ship clicks onto the station', factZh:'飞船连到太空站的地方'})
    );
  },

  // 8. 太空站怎么不掉下来 — assets/08_orbit.png
  station_orbit(){
    return svgWrap(
      partSVG({px:600, py:350, lx:880, ly:280, anc:'start', name:'Space station', nameZh:'太空站', fact:'always falling, but flying so fast it circles Earth', factZh:'一直往下掉，但飞太快，永远绕地球转'}) +
      partSVG({px: 1100, py: 80, lx:130, ly:140, anc:'end',  name:'Orbit', nameZh:'轨道', fact:'the round path the station follows', factZh:'太空站走的圆圆路线'}) +
      partSVG({px:1100, py:700, lx:915, ly:610, anc:'start', name:'Earth', nameZh:'地球', fact:'the planet the station circles around', factZh:'太空站绕着转的星球'})
    );
  },

  // 9. 失重漂浮 — assets/09_float.png
  station_float(){
    return svgWrap(
      partSVG({px:600, py:460, lx:200, ly:430, anc:'end',  name:'Floating astronaut', nameZh:'漂浮的宇航员', fact:'sleeps and plays while floating in the air', factZh:'飘在半空里睡觉、玩耍'}) +
      partSVG({px:300, py:200, lx:130, ly:160, anc:'end',  name:'Floating pencil', nameZh:'漂浮的铅笔', fact:'even a little pencil floats up high', factZh:'连小铅笔都飘了起来'})
    );
  },

  // 10. 生命保障 — assets/10_life.png
  station_life(){
    return svgWrap(
      partSVG({px:310, py:450, lx:130, ly:400, anc:'end',  name:'Oxygen', nameZh:'氧气', fact:'the air the station makes for breathing', factZh:'太空站制造的、用来呼吸的空气'}) +
      partSVG({px:620, py:500, lx:790, ly:430, anc:'start', name:'Water recycler', nameZh:'水循环器', fact:'cleans and reuses water again and again', factZh:'把水一遍遍净化和再利用'})
    );
  },

  // 11. 从太空看地球 — assets/11_earth.png
  station_earth(){
    return svgWrap(
      partSVG({px:560, py:600, lx:200, ly:580, anc:'end',  name:'Earth', nameZh:'地球', fact:'our blue and green home seen from space', factZh:'从太空看到的蓝绿家园'}) +
      partSVG({px:500, py:200, lx:720, ly:180, anc:'start', name:'Aurora', nameZh:'极光', fact:'glowing ribbons of light in the sky', factZh:'天上发光的一条条光带'})
    );
  },

  // 12. 宇航员回家 — assets/12_return.png
  station_return(){
    return svgWrap(
      partSVG({px:770, py:290, lx:850, ly:230, anc:'start', name:'Return spacecraft', nameZh:'返回飞船', fact:'carries astronauts back down to Earth', factZh:'载着宇航员飞回地球'})
    );
  },

  // 13. 词汇表 — assets/13_glossary.png
  station_glossary(){
    return svgWrap(
      partSVG({px:600, py:300, lx:740, ly:225, anc:'start', name:'Space station', nameZh:'太空站', fact:'our home among the stars', factZh:'我们在星星之间的家'}) +
      partSVG({px:700, py:650, lx:760, ly:580, anc:'start', name:'Astronaut', nameZh:'宇航员', fact:'a brave traveler to space', factZh:'去太空的勇敢旅行者'}) +
      partSVG({px:250, py:250, lx:130, ly:200, anc:'end',  name:'Solar panel', nameZh:'太阳能板', fact:'catches sunlight to make power', factZh:'收集阳光变成电的翅膀'})
    );
  }
};
