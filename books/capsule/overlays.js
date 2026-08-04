/* ============================================================
   Return Capsule overlays — interactive hotspots for each page.
   All px/py/x1/y1/x2/y2/lx/ly values are IMAGE pixel coordinates
   (1216 x 832). shared/overlays.js auto-converts to viewBox 1000x667.
   Labels avoid the bottom-right watermark zone (x>1020, y>740).
   ============================================================ */
window.OVL = {
  // 1. 部件地图 — assets/01_parts.webp (upright front view)
  cp_parts(){
    return svgWrap(
      partSVG({px:608, py:360, lx:400, ly:285, anc:'end',   name:'Parachute bay', nameZh:'伞舱', fact:'where the parachute hides on top', factZh:'顶部藏降落伞的地方'}) +
      partSVG({px:608, py:430, lx:400, ly:430, anc:'end',   name:'Capsule body',  nameZh:'返回舱体', fact:'the bell-shaped ship', factZh:'钟形的小飞船'}) +
      partSVG({px:608, py:499, lx:815, ly:475, anc:'start', name:'Window',        nameZh:'舷窗', fact:'the round window to see outside', factZh:'看外面的圆窗'}) +
      partSVG({px:608, py:665, lx:815, ly:660, anc:'start', name:'Heat shield',   nameZh:'防热盾', fact:'the thick bottom that takes the heat', factZh:'底部厚厚的挡热层'})
    );
  },

  // 2. 外壳三层结构 剖面 — assets/02_layers.webp
  // Cutaway: black outer heat shield, brown ablative layer, silver metal hull.
  cp_layers(){
    return svgWrap(
      partSVG({px:608, py:690, lx:830, ly:690, anc:'start', name:'Heat shield',  nameZh:'防热盾', fact:'the black outside that takes the heat first', factZh:'黑色的最外层，先挡住热量'}) +
      partSVG({px:608, py:545, lx:830, ly:525, anc:'start', name:'Ablative layer', nameZh:'烧蚀层', fact:'the brown layer that burns away slowly', factZh:'棕色的中间层，会慢慢烧掉'}) +
      partSVG({px:608, py:400, lx:400, ly:380, anc:'end',   name:'Pressure hull', nameZh:'金属舱壁', fact:'the silver wall that keeps the cabin safe', factZh:'保护舱内安全的银色舱壁'})
    );
  },

  // 3. 防热盾烧蚀 特写 — assets/03_heatshield.webp
  // Close-up: charred black heat shield with orange friction glow.
  cp_heatshield(){
    return svgWrap(
      partSVG({px:670, py:560, lx:880, ly:560, anc:'start', name:'Heat shield', nameZh:'防热盾', fact:'takes the heat and gets charred', factZh:'挡下热量，被烧得焦黑'}) +
      partSVG({px:470, py:430, lx:260, ly:400, anc:'end',   name:'Friction glow', nameZh:'摩擦火焰', fact:'the fire made by rubbing against air', factZh:'和空气摩擦产生的火焰'}) +
      arrowSVG({x1:470, y1:560, x2:470, y2:420, col:'#ef476f', mk:'ar', tx:250, ty:560, anc:'end', name:'Heat', nameZh:'高温', fact:'the burning heat of reentry', factZh:'再入大气层时灼热的高温'})
    );
  },

  // 4. 乘员舱 剖面 — assets/04_cabin.webp
  // Cutaway: three seats, astronaut, round window, control panel.
  cp_cabin(){
    return svgWrap(
      partSVG({px:334, py:374, lx:150, ly:340, anc:'end',   name:'Window',        nameZh:'舷窗', fact:'the round window showing the sky', factZh:'能看到天空的圆窗'}) +
      partSVG({px:334, py:478, lx:150, ly:500, anc:'end',   name:'Control panel', nameZh:'控制面板', fact:'buttons that help fly the capsule', factZh:'帮助驾驶返回舱的按钮面板'}) +
      partSVG({px:638, py:540, lx:860, ly:480, anc:'start', name:'Astronaut',     nameZh:'航天员', fact:'the person who rides home', factZh:'坐着回家的人'}) +
      partSVG({px:608, py:630, lx:860, ly:630, anc:'start', name:'Seat',          nameZh:'座椅', fact:'a soft seat with straps', factZh:'带安全带的小座椅'})
    );
  },

  // 5. 伞舱 剖面特写 — assets/05_parachute.webp
  // Cutaway of parachute bay: folded parachute + pilot chute + dome cover.
  cp_parachute(){
    return svgWrap(
      partSVG({px:608, py:170, lx:840, ly:120, anc:'start', name:'Dome cover',   nameZh:'穹顶盖', fact:'the round lid of the parachute bay', factZh:'伞舱的圆盖子'}) +
      partSVG({px:608, py:330, lx:840, ly:310, anc:'start', name:'Parachute bay', nameZh:'伞舱', fact:'the bay where the parachute hides', factZh:'藏着降落伞的舱室'}) +
      partSVG({px:608, py:430, lx:390, ly:400, anc:'end',   name:'Main parachute', nameZh:'主伞', fact:'the big orange-and-white parachute', factZh:'橙白相间的大降落伞'}) +
      partSVG({px:608, py:495, lx:390, ly:520, anc:'end',   name:'Pilot chute',  nameZh:'引导伞', fact:'the little chute that pulls out the big one', factZh:'把大伞拉出来的小伞'})
    );
  },

  // 6. 反推火箭 特写 — assets/06_retro.webp
  // Close-up bottom: retro rockets firing down, meadow below.
  cp_retro(){
    return svgWrap(
      partSVG({px:608, py:470, lx:860, ly:440, anc:'start', name:'Retro rockets', nameZh:'反推火箭', fact:'small rockets that fire down to land softly', factZh:'向下点火让着陆变轻柔的小火箭'}) +
      partSVG({px:608, py:560, lx:860, ly:570, anc:'start', name:'Exhaust',       nameZh:'喷焰', fact:'the fire shooting down', factZh:'向下喷出的火焰'})
    );
  },

  // 7. 舷窗看地球 场景 — assets/07_window.webp
  // View from cabin: astronaut looking out round window at Earth.
  cp_window(){
    return svgWrap(
      partSVG({px:530, py:390, lx:270, ly:300, anc:'end',   name:'Window', nameZh:'舷窗', fact:'the round window to the outside', factZh:'通往外面的圆窗'}) +
      partSVG({px:480, py:430, lx:270, ly:450, anc:'end',   name:'Earth',  nameZh:'地球', fact:'our blue home planet', factZh:'我们蓝色的家园星球'}) +
      partSVG({px:851, py:499, lx:1060,ly:499, anc:'start', name:'Astronaut', nameZh:'航天员', fact:'looking out at Earth', factZh:'望着地球的航天员'})
    );
  },

  // 8. 舱门对接 场景 — assets/08_dock.webp
  // Capsule docking with space station, solar panels, Earth below.
  cp_dock(){
    return svgWrap(
      partSVG({px:547, py:374, lx:330, ly:300, anc:'end',   name:'Capsule',      nameZh:'返回舱', fact:'the little ship coming home', factZh:'回家的那艘小飞船'}) +
      partSVG({px:730, py:458, lx:940, ly:440, anc:'start', name:'Docking port', nameZh:'对接端口', fact:'the door where the capsule connects', factZh:'返回舱连接上的舱门'}) +
      partSVG({px:851, py:333, lx:940, ly:280, anc:'start', name:'Space station', nameZh:'空间站', fact:'the big home in space', factZh:'太空中的大家园'}) +
      partSVG({px:182, py:250, lx:70,  ly:210, anc:'end',   name:'Solar panel',  nameZh:'太阳能板', fact:'turns sunlight into power', factZh:'把阳光变成电'})
    );
  },

  // 9. 穿越大气层 场景 — assets/09_reentry.webp
  // Fireball reentry: capsule wrapped in plasma, heat shield down.
  cp_reentry(){
    return svgWrap(
      partSVG({px:547, py:458, lx:330, ly:400, anc:'end',   name:'Capsule',    nameZh:'返回舱', fact:'plunging back to Earth', factZh:'冲回地球的返回舱'}) +
      partSVG({px:547, py:570, lx:330, ly:610, anc:'end',   name:'Heat shield', nameZh:'防热盾', fact:'facing the fire head-on', factZh:'直面火焰的防热盾'}) +
      partSVG({px:640, py:320, lx:880, ly:270, anc:'start', name:'Plasma fire', nameZh:'等离子火焰', fact:'the giant fireball of reentry', factZh:'再入时巨大的火球'})
    );
  },

  // 10. 开伞减速 场景 — assets/10_parachute.webp
  // Big parachute open above capsule, meadow below.
  cp_parachute_open(){
    return svgWrap(
      partSVG({px:608, py:330, lx:280, ly:260, anc:'end',   name:'Parachute', nameZh:'降落伞', fact:'the giant umbrella that slows the fall', factZh:'让下降变慢的巨伞'}) +
      partSVG({px:608, py:516, lx:890, ly:500, anc:'start', name:'Capsule',   nameZh:'返回舱', fact:'swinging gently beneath the chute', factZh:'在伞下轻轻摇晃的返回舱'}) +
      partSVG({px:608, py:690, lx:890, ly:710, anc:'start', name:'Meadow',    nameZh:'草地', fact:'the green landing spot below', factZh:'下面绿色的着陆点'})
    );
  },

  // 11. 着陆 场景 — assets/11_landing.webp
  // Capsule on meadow, astronaut waving, rescue team running.
  cp_landing(){
    return svgWrap(
      partSVG({px:547, py:499, lx:310, ly:440, anc:'end',   name:'Capsule',      nameZh:'返回舱', fact:'resting safely on the grass', factZh:'安全停在草地上'}) +
      partSVG({px:815, py:516, lx:1010,ly:480, anc:'start', name:'Astronaut',    nameZh:'航天员', fact:'waving hello to Earth', factZh:'向地球挥手问好'}) +
      partSVG({px:997, py:505, lx:1060,ly:570, anc:'start', name:'Rescue team',  nameZh:'救援队', fact:'running to welcome the astronauts', factZh:'跑来迎接航天员的救援队'}) +
      partSVG({px:547, py:700, lx:310, ly:720, anc:'end',   name:'Landing site', nameZh:'着陆点', fact:'the soft green landing spot', factZh:'柔软的绿色着陆点'})
    );
  },

  // 12. 词汇表 海报 — assets/12_vocab.webp
  // Capsule center with floating part icons around.
  cp_vocab(){
    return svgWrap(
      partSVG({px:365, py:349, lx:200, ly:320, anc:'end',   name:'Heat shield',   nameZh:'防热盾', fact:'takes the heat on the way down', factZh:'下降时挡住热量'}) +
      partSVG({px:268, py:557, lx:130, ly:560, anc:'end',   name:'Parachute',     nameZh:'降落伞', fact:'the big umbrella that slows the fall', factZh:'让下降变慢的大伞'}) +
      partSVG({px:268, py:682, lx:130, ly:700, anc:'end',   name:'Seat',          nameZh:'座椅', fact:'where astronauts strap in', factZh:'航天员系安全带的地方'}) +
      partSVG({px:669, py:458, lx:540, ly:565, anc:'end',   name:'Return capsule', nameZh:'返回舱', fact:'the little ship that brings astronauts home', factZh:'带航天员回家的小飞船'}) +
      partSVG({px:973, py:191, lx:1110,ly:180, anc:'start', name:'Retro rocket',  nameZh:'反推火箭', fact:'fires down to land softly', factZh:'向下点火让着陆更轻柔'}) +
      partSVG({px:997, py:591, lx:1110,ly:580, anc:'start', name:'Window',        nameZh:'舷窗', fact:'the round window to see outside', factZh:'看外面的圆窗'}) +
      partSVG({px:973, py:674, lx:1110,ly:690, anc:'start', name:'Docking ring',  nameZh:'对接环', fact:'connects to the space station', factZh:'和空间站连接的部分'})
    );
  }
};
