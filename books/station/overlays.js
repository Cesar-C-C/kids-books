/* ============================================================
   Space Station book interactive SVG overlays (BUBBLE-MODE hotspots, v2).
   viewBox 1000x667, uses shared/overlays.js helpers.
   Image pixels 1216x832 (shared/overlays.js converts).
   Every hotspot carries line + lineZh (first-person speech) + lineKey.
   No leader lines / SVG labels. Coordinates calibrated with GLM vision.
   ============================================================ */
window.OVL = {
  station_what: () => svgWrap(
    partSVG({px:600,py:280,name:'Space station',nameZh:'太空站',fact:'a big house in space where astronauts live',factZh:'宇航员在太空生活的大房子',
      line:"I'm the space station — a big house in space!", lineZh:'我是太空站，太空里的大房子！', lineKey:'station_what_0'}) +
    partSVG({px:480,py:600,name:'Astronaut',nameZh:'宇航员',fact:'a person who travels and works in space',factZh:'去太空旅行和工作的人',
      line:"I'm an astronaut — I travel and work in space!", lineZh:'我是宇航员，去太空旅行和工作！', lineKey:'station_what_1'})
  ),
  station_overview: () => svgWrap(
    partSVG({px:600,py:350,name:'Module',nameZh:'舱段',fact:'a round room joined to the station',factZh:'连在太空站上的圆圆房间',
      line:"I'm a module — a round room joined to the station!", lineZh:'我是舱段，连在太空站上的圆圆房间！', lineKey:'station_overview_0'}) +
    partSVG({px:200,py:200,name:'Solar panel',nameZh:'太阳能板',fact:'the big blue wings that catch sunlight',factZh:'收集阳光的大蓝翅膀',
      line:"I'm a solar panel — big blue wings that catch sunlight!", lineZh:'我是太阳能板，收集阳光的大蓝翅膀！', lineKey:'station_overview_1'}) +
    partSVG({px:750,py:400,name:'Robot arm',nameZh:'机械臂',fact:'a long arm that reaches out into space',factZh:'伸到太空里的长手臂',
      line:"I'm the robot arm — a long arm reaching into space!", lineZh:'我是机械臂，伸到太空里的长手臂！', lineKey:'station_overview_2'})
  ),
  station_living: () => svgWrap(
    partSVG({px:440,py:400,name:'Sleeping bag',nameZh:'睡袋',fact:'a cozy bag to sleep in, stuck to the wall',factZh:'贴在墙上的睡袋，可以睡觉',
      line:"I'm the sleeping bag — a cozy bag stuck to the wall!", lineZh:'我是睡袋，贴在墙上的舒服袋子！', lineKey:'station_living_0'}) +
    partSVG({px:290,py:660,name:'Table',nameZh:'餐桌',fact:'where astronauts eat their space meals',factZh:'宇航员吃饭的小桌子',
      line:"I'm the table — where astronauts eat in space!", lineZh:'我是餐桌，宇航员在太空吃饭的地方！', lineKey:'station_living_1'}) +
    partSVG({px:620,py:500,name:'Treadmill',nameZh:'跑步机',fact:'keeps astronauts strong in space',factZh:'让宇航员在太空保持强壮',
      line:"I'm the treadmill — I keep astronauts strong in space!", lineZh:'我是跑步机，让宇航员在太空保持强壮！', lineKey:'station_living_2'})
  ),
  station_lab: () => svgWrap(
    partSVG({px:240,py:480,name:'Plant',nameZh:'植物',fact:'grown in a clear box to study in space',factZh:'在透明盒子里种，研究太空种植',
      line:"I'm a plant — grown in a clear box to study space!", lineZh:'我是植物，在透明盒子里研究太空种植！', lineKey:'station_lab_0'}) +
    partSVG({px:520,py:600,name:'Crystal',nameZh:'晶体',fact:'made by scientists for space study',factZh:'科学家在太空里造出来的晶体',
      line:"I'm a crystal — made by scientists in space!", lineZh:'我是晶体，科学家在太空里造出来的！', lineKey:'station_lab_1'}) +
    partSVG({px:950,py:480,name:'Experiment rack',nameZh:'实验柜',fact:'holds science tools and tubes',factZh:'装科学工具和试管的柜子',
      line:"I'm the experiment rack — I hold science tools and tubes!", lineZh:'我是实验柜，装科学工具和试管的柜子！', lineKey:'station_lab_2'})
  ),
  station_solar: () => svgWrap(
    partSVG({px:250,py:350,name:'Solar panel',nameZh:'太阳能板',fact:'catches sunlight and turns it into power',factZh:'收集阳光，变成电',
      line:"I'm a solar panel — I turn sunlight into power!", lineZh:'我是太阳能板，把阳光变成电！', lineKey:'station_solar_0'}) +
    partSVG({px:190,py:200,name:'Sunlight',nameZh:'阳光',fact:'the bright light from the Sun',factZh:'太阳发出来的明亮光线',
      line:"I'm sunlight — the bright light from the Sun!", lineZh:'我是阳光，太阳发出来的明亮光线！', lineKey:'station_solar_1'})
  ),
  station_arm: () => svgWrap(
    partSVG({px:750,py:500,name:'Robot arm',nameZh:'机械臂',fact:'reaches out like a long hand to catch ships',factZh:'像长手一样伸出去抓飞船',
      line:"I'm the robot arm — I reach out to catch visiting ships!", lineZh:'我是机械臂，伸出去抓来访的飞船！', lineKey:'station_arm_0'})
  ),
  station_docking: () => svgWrap(
    partSVG({px:370,py:500,name:'Visiting spacecraft',nameZh:'来访飞船',fact:'a ship that flies up to the station',factZh:'飞上来找太空站的飞船',
      line:"I'm a visiting spacecraft — I fly up to the station!", lineZh:'我是来访飞船，飞上来找太空站！', lineKey:'station_docking_0'}) +
    partSVG({px:600,py:340,name:'Docking port',nameZh:'对接端口',fact:'where the ship clicks onto the station',factZh:'飞船连到太空站的地方',
      line:"I'm the docking port — where ships click onto the station!", lineZh:'我是对接端口，飞船连到太空站的地方！', lineKey:'station_docking_1'})
  ),
  station_orbit: () => svgWrap(
    partSVG({px:600,py:350,name:'Space station',nameZh:'太空站',fact:'always falling, but flying so fast it circles Earth',factZh:'一直往下掉，但飞太快，永远绕地球转',
      line:"I'm the space station — always falling but flying fast around Earth!", lineZh:'我是太空站，一直往下掉，但飞太快绕地球转！', lineKey:'station_orbit_0'}) +
    partSVG({px:1100,py:80,name:'Orbit',nameZh:'轨道',fact:'the round path the station follows',factZh:'太空站走的圆圆路线',
      line:"I'm the orbit — the round path the station follows!", lineZh:'我是轨道，太空站走的圆圆路线！', lineKey:'station_orbit_1'}) +
    partSVG({px:1020,py:700,name:'Earth',nameZh:'地球',fact:'the planet the station circles around',factZh:'太空站绕着转的星球',
      line:"I'm Earth — the planet the station circles around!", lineZh:'我是地球，太空站绕着转的星球！', lineKey:'station_orbit_2'})
  ),
  station_float: () => svgWrap(
    partSVG({px:600,py:460,name:'Floating astronaut',nameZh:'漂浮的宇航员',fact:'sleeps and plays while floating in the air',factZh:'飘在半空里睡觉、玩耍',
      line:"I'm the floating astronaut — I sleep and play up in the air!", lineZh:'我是漂浮的宇航员，飘在半空里睡觉玩耍！', lineKey:'station_float_0'}) +
    partSVG({px:300,py:250,name:'Floating pencil',nameZh:'漂浮的铅笔',fact:'even a little pencil floats up high',factZh:'连小铅笔都飘了起来',
      line:"I'm a floating pencil — even I float up high!", lineZh:'我是漂浮的铅笔，连我都飘了起来！', lineKey:'station_float_1'})
  ),
  station_life: () => svgWrap(
    partSVG({px:310,py:450,name:'Oxygen',nameZh:'氧气',fact:'the air the station makes for breathing',factZh:'太空站制造的、用来呼吸的空气',
      line:"I'm oxygen — the air the station makes for breathing!", lineZh:'我是氧气，太空站制造的呼吸空气！', lineKey:'station_life_0'}) +
    partSVG({px:620,py:500,name:'Water recycler',nameZh:'水循环器',fact:'cleans and reuses water again and again',factZh:'把水一遍遍净化和再利用',
      line:"I'm the water recycler — I clean and reuse water!", lineZh:'我是水循环器，把水一遍遍净化和再利用！', lineKey:'station_life_1'})
  ),
  station_earth: () => svgWrap(
    partSVG({px:560,py:600,name:'Earth',nameZh:'地球',fact:'our blue and green home seen from space',factZh:'从太空看到的蓝绿家园',
      line:"I'm Earth — our blue and green home from space!", lineZh:'我是地球，从太空看到的蓝绿家园！', lineKey:'station_earth_0'}) +
    partSVG({px:500,py:300,name:'Aurora',nameZh:'极光',fact:'glowing ribbons of light in the sky',factZh:'天上发光的一条条光带',
      line:"I'm the aurora — glowing ribbons of light in the sky!", lineZh:'我是极光，天上发光的一条条光带！', lineKey:'station_earth_1'})
  ),
  station_return: () => svgWrap(
    partSVG({px:770,py:290,name:'Return spacecraft',nameZh:'返回飞船',fact:'carries astronauts back down to Earth',factZh:'载着宇航员飞回地球',
      line:"I'm the return spacecraft — I carry astronauts home to Earth!", lineZh:'我是返回飞船，载着宇航员飞回地球！', lineKey:'station_return_0'})
  ),
  station_glossary: () => svgWrap(
    partSVG({px:600,py:300,name:'Space station',nameZh:'太空站',fact:'our home among the stars',factZh:'我们在星星之间的家',
      line:"I'm the space station — our home among the stars!", lineZh:'我是太空站，我们在星星之间的家！', lineKey:'station_glossary_0'}) +
    partSVG({px:700,py:650,name:'Astronaut',nameZh:'宇航员',fact:'a brave traveler to space',factZh:'去太空的勇敢旅行者',
      line:"I'm an astronaut — a brave traveler to space!", lineZh:'我是宇航员，去太空的勇敢旅行者！', lineKey:'station_glossary_1'}) +
    partSVG({px:270,py:250,name:'Solar panel',nameZh:'太阳能板',fact:'catches sunlight to make power',factZh:'收集阳光变成电的翅膀',
      line:"I'm a solar panel — I catch sunlight to make power!", lineZh:'我是太阳能板，收集阳光变成电的翅膀！', lineKey:'station_glossary_2'})
  )
};
