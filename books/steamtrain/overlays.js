/* ============================================================
   Steam Train overlays — interactive hotspots for each page.
   All px/py/x1/y1/x2/y2/lx/ly values are IMAGE pixel coordinates
   (1216 x 832). shared/overlays.js auto-converts to viewBox 1000x667.
   Labels avoid the bottom-right watermark zone (x>1020, y>740).
   ============================================================ */
window.OVL = {
  // 1. 整体部件 — assets/02_overview_v2.webp (labeled map)
  st_parts(){
    return svgWrap(
      partSVG({px:220, py:300, lx:90,  ly:220, anc:'end',   name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方'}) +
      partSVG({px:555, py:275, lx:430, ly:145, anc:'end',   name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽聚集在顶上的圆包'}) +
      partSVG({px:690, py:340, lx:850, ly:280, anc:'start', name:'Cab', nameZh:'司机室', fact:'where the driver sits and steers', factZh:'司机坐着开火车的地方'}) +
      partSVG({px:430, py:560, lx:430, ly:660, anc:'middle', name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that pulls the train', factZh:'拉着火车跑的大轮子'}) +
      partSVG({px:940, py:420, lx:850, ly:500, anc:'end',   name:'Tender', nameZh:'煤水车', fact:'carries coal and water', factZh:'装着煤和水的车厢'})
    );
  },

  // 2. 炉膛 剖面图 — assets/03_firebox_v3.webp
  // Cutaway showing firebox with fire inside + fireman shoveling coal.
  st_firebox(){
    return svgWrap(
      partSVG({px:720, py:400, lx:430, ly:240, anc:'end', name:'Firebox', nameZh:'炉膛', fact:'where the coal burns', factZh:'煤炭燃烧的地方'}) +
      partSVG({px:730, py:660, lx:480, ly:740, anc:'end', name:'Coal',    nameZh:'煤',   fact:'shoveled in to feed the fire', factZh:'铲进炉膛喂火的黑色燃料'}) +
      partSVG({px:1050,py:470, lx:1150,ly:580, anc:'start', name:'Fireman', nameZh:'司炉', fact:'shovels coal into the firebox', factZh:'把煤铲进炉膛的人'})
    );
  },

  // 3. 锅炉 剖面图 — assets/04_boiler_v3.webp
  // Cutaway of boiler showing water (blue) below and steam bubbles above.
  st_boiler(){
    return svgWrap(
      partSVG({px:600, py:380, lx:850, ly:280, anc:'start', name:'Boiler', nameZh:'锅炉', fact:'the long tube full of water', factZh:'装满水的长管子'}) +
      partSVG({px:600, py:470, lx:850, ly:560, anc:'start', name:'Water',  nameZh:'水',   fact:'boils and turns into steam', factZh:'烧开后变成蒸汽'}) +
      partSVG({px:600, py:300, lx:850, ly:200, anc:'start', name:'Steam',  nameZh:'蒸汽', fact:'hot bubbles gather at the top', factZh:'热气在顶部聚集'})
    );
  },

  // 4. 蒸汽包 特写 — assets/05_steamdome_v3.webp
  // Close-up cutaway of the brass dome with steam inside, pressure arrow pushing up.
  st_steamdome(){
    return svgWrap(
      partSVG({px:700, py:280, lx:400, ly:160, anc:'end', name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽在顶部聚集的地方'}) +
      partSVG({px:900, py:480, lx:1100,ly:520, anc:'start', name:'Steam', nameZh:'蒸汽', fact:'fills the dome and pushes hard', factZh:'充满蒸汽包，使劲往上顶'}) +
      arrowSVG({x1:900, y1:400, x2:900, y2:130, col:'#ef476f', mk:'ar', tx:1010, ty:260, anc:'start', name:'Pressure', nameZh:'压力', fact:'the strong push of trapped steam', factZh:'蒸汽被憋住的强大推力'})
    );
  },

  // 5. 活塞 剖面图 — assets/06_piston_v3.webp
  // Cutaway of cylinder showing piston disc and steam pushing from one side.
  st_piston(){
    return svgWrap(
      partSVG({px:220, py:380, lx:80,  ly:290, anc:'end',   name:'Steam', nameZh:'蒸汽', fact:'pushes the piston hard', factZh:'使劲推活塞'}) +
      partSVG({px:540, py:380, lx:540, ly:530, anc:'middle', name:'Piston', nameZh:'活塞', fact:'a disc that slides back and forth', factZh:'来回滑动的圆盘'}) +
      partSVG({px:780, py:380, lx:1080,ly:300, anc:'start', name:'Cylinder', nameZh:'气缸', fact:'the round tube where the piston slides', factZh:'活塞在里面滑动的圆管'}) +
      arrowSVG({x1:280, y1:420, x2:780, y2:420, col:'#2a9d8f', mk:'agrn', tx:380, ty:475, anc:'start', name:'Push', nameZh:'推力', fact:'steam pushes the piston this way', factZh:'蒸汽这样推活塞'})
    );
  },

  // 6. 连杆带动车轮 特写 — assets/07_rod_v3.webp
  // Close-up mechanism: piston rod, connecting rod, driving wheel.
  st_rod(){
    return svgWrap(
      partSVG({px:330, py:420, lx:180, ly:320, anc:'end',   name:'Piston rod', nameZh:'活塞杆', fact:'slides back and forth from steam', factZh:'蒸汽推动的一来一回的杆'}) +
      partSVG({px:600, py:500, lx:430, ly:620, anc:'end',   name:'Connecting rod', nameZh:'连杆', fact:'links the piston to the wheel', factZh:'把活塞和轮子连起来'}) +
      partSVG({px:950, py:430, lx:1140,ly:360, anc:'start', name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that rolls the train', factZh:'让火车滚动的大轮子'})
    );
  },

  // 7. 动轮与钢轨 特写 — assets/08_wheels_v3.webp
  // Close-up: two driving wheels on rail, connecting rod between them.
  st_wheels(){
    return svgWrap(
      partSVG({px:320, py:400, lx:520, ly:300, anc:'start', name:'Driving wheels', nameZh:'动轮', fact:'big wheels that grip the rails', factZh:'紧紧抓住铁轨的大轮子'}) +
      partSVG({px:520, py:480, lx:850, ly:420, anc:'start', name:'Connecting rod', nameZh:'连杆', fact:'links all the wheels together', factZh:'把所有轮子连起来的杆'}) +
      partSVG({px:520, py:660, lx:850, ly:720, anc:'start', name:'Rail', nameZh:'钢轨', fact:'the shiny steel track the train rolls on', factZh:'火车滚动的亮亮铁轨'})
    );
  },

  // 8. 汽笛 场景 — assets/09_whistle_v3.webp
  // Cab-roof close-up: big brass whistle blowing, driver pulling cord.
  st_whistle(){
    return svgWrap(
      partSVG({px:520, py:280, lx:280, ly:200, anc:'end',   name:'Whistle', nameZh:'汽笛', fact:'a brass trumpet that says TOOT!', factZh:'会发出"呜——！"的铜喇叭'}) +
      partSVG({px:900, py:120, lx:1110,ly:80,  anc:'start', name:'Steam',   nameZh:'蒸汽', fact:'puffs out of the whistle', factZh:'从汽笛里喷出来的蒸汽'}) +
      partSVG({px:520, py:600, lx:300, ly:700, anc:'end',   name:'Driver',  nameZh:'司机', fact:'pulls the cord to blow the whistle', factZh:'拉绳子让汽笛响起来的人'}) +
      partSVG({px:510, py:430, lx:300, ly:430, anc:'end',   name:'Cord',    nameZh:'拉绳', fact:'the line the driver pulls', factZh:'司机拉的那根绳子'})
    );
  },

  // 9. 烟囱与烟 正面 — assets/10_chimney_v3.webp
  // Front view: tall chimney centered, big smoke clouds billowing out.
  st_chimney(){
    return svgWrap(
      partSVG({px:560, py:200, lx:830, ly:130, anc:'start', name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方'}) +
      partSVG({px:300, py:140, lx:80,  ly:90,  anc:'end',   name:'Smoke',   nameZh:'烟',   fact:'soft grey clouds floating up', factZh:'飘到天上的灰色云'}) +
      partSVG({px:600, py:480, lx:830, ly:480, anc:'start', name:'Engine',  nameZh:'发动机', fact:'the front of the locomotive', factZh:'火车的前脸'})
    );
  },

  // 10. 煤水车 剖面图 — assets/11_tender_v3.webp
  // Cutaway of tender: coal pile on top, water tank below.
  st_tender(){
    return svgWrap(
      partSVG({px:950, py:400, lx:1150, ly:380, anc:'start', name:'Tender', nameZh:'煤水车', fact:'the car behind the engine', factZh:'发动机后面的车厢'}) +
      partSVG({px:380, py:280, lx:140, ly:220, anc:'end',   name:'Coal', nameZh:'煤', fact:'black lumps to burn in the fire', factZh:'黑色的煤块，在火里燃烧'}) +
      partSVG({px:600, py:480, lx:900, ly:540, anc:'start', name:'Water', nameZh:'水', fact:'turns to steam in the boiler', factZh:'在锅炉里变成蒸汽'})
    );
  },

  // 11. 一起跑起来 场景 — assets/12_journey_v3.webp
  // Whole train on curving track, motion lines and trailing smoke.
  st_journey(){
    return svgWrap(
      partSVG({px:430, py:440, lx:200,  ly:400, anc:'end',   name:'Engine',         nameZh:'发动机', fact:'the front part with the boiler', factZh:'前面装锅炉的部分'}) +
      partSVG({px:560, py:110, lx:320,  ly:100, anc:'end',   name:'Steam & smoke',  nameZh:'蒸汽与烟', fact:'rises up and puffs out', factZh:'升起来，飘出去'}) +
      partSVG({px:300, py:580, lx:100,  ly:620, anc:'end',   name:'Driving wheels', nameZh:'动轮',    fact:'rolling along the rails', factZh:'沿着铁轨滚动'}) +
      partSVG({px:800, py:440, lx:1000, ly:400, anc:'start', name:'Tender',         nameZh:'煤水车', fact:'brings coal and water', factZh:'带来煤和水'})
    );
  },

  // 12. 词汇表图 — assets/13_vocab_v3.webp (decorative; main vocab is in cards)
  st_vocab(){
    return svgWrap(
      partSVG({px:550, py:400, lx:320, ly:380, anc:'end', name:'Engine', nameZh:'发动机', fact:'makes the train go', factZh:'让火车跑起来的部分'})
    );
  }
};