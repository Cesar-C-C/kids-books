/* ============================================================
   Steam Train overlays — interactive hotspots for each page.
   All px/py/x1/y1/x2/y2/lx/ly values are IMAGE pixel coordinates
   (1216 x 832). shared/overlays.js auto-converts to viewBox 1000x667.
   Labels avoid the bottom-right watermark zone (x>1020, y>740).
   ============================================================ */
window.OVL = {
  // 1. 整体部件 — assets/02_overview.png
  st_parts(){
    return svgWrap(
      partSVG({px:220, py:300, lx:90,  ly:220, anc:'end',   name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方'}) +
      partSVG({px:555, py:215, lx:430, ly:145, anc:'end',   name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽聚集在顶上的圆包'}) +
      partSVG({px:690, py:340, lx:850, ly:280, anc:'start', name:'Cab', nameZh:'司机室', fact:'where the driver sits and steers', factZh:'司机坐着开火车的地方'}) +
      partSVG({px:430, py:560, lx:430, ly:660, anc:'middle', name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that pulls the train', factZh:'拉着火车跑的大轮子'}) +
      partSVG({px:940, py:420, lx:850, ly:500, anc:'end',   name:'Tender', nameZh:'煤水车', fact:'carries coal and water', factZh:'装着煤和水的车厢'})
    );
  },

  // 2. 炉膛 — assets/03_firebox_v2.webp
  st_firebox(){
    return svgWrap(
      partSVG({px:1050, py:560, lx:1130, ly:500, anc:'start', name:'Firebox', nameZh:'炉膛', fact:'where the coal burns', factZh:'煤炭燃烧的地方'}) +
      partSVG({px:1110, py:640, lx:1150, ly:700, anc:'start', name:'Coal',   nameZh:'煤',   fact:'shoveled in to feed the fire', factZh:'铲进炉膛喂火的黑色燃料'})
    );
  },

  // 3. 锅炉 — assets/04_boiler_v2.webp
  st_boiler(){
    return svgWrap(
      partSVG({px:520, py:370, lx:760, ly:300, anc:'start', name:'Boiler', nameZh:'锅炉', fact:'the long tube full of water', factZh:'装满水的长管子'}) +
      partSVG({px:280, py:480, lx:120, ly:540, anc:'end',   name:'Water',  nameZh:'水',   fact:'boils and turns into steam', factZh:'烧开后变成蒸汽'}) +
      partSVG({px:560, py:240, lx:430, ly:200, anc:'end',   name:'Steam',  nameZh:'蒸汽', fact:'hot gas rising up', factZh:'升起来的热气'})
    );
  },

  // 4. 蒸汽包与压力 — assets/05_steamdome.png
  st_steamdome(){
    return svgWrap(
      partSVG({px:580, py:215, lx:800, ly:200, anc:'start', name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽在顶部聚集的地方'}) +
      partSVG({px:560, py:200, lx:350, ly:180, anc:'end',   name:'Steam', nameZh:'蒸汽', fact:'piles up and pushes hard', factZh:'越聚越多，使劲往外挤'}) +
      arrowSVG({x1:580, y1:250, x2:580, y2:120, col:'#ef476f', mk:'ar', tx:640, ty:190, anc:'start', name:'Pressure', nameZh:'压力', fact:'the strong push of trapped steam', factZh:'蒸汽被憋住的强大推力'})
    );
  },

  // 5. 活塞 — assets/06_piston.png
  st_piston(){
    return svgWrap(
      partSVG({px:240, py:440, lx:110, ly:370, anc:'end',   name:'Steam', nameZh:'蒸汽', fact:'pushes the piston hard', factZh:'使劲推活塞'}) +
      partSVG({px:400, py:430, lx:400, ly:330, anc:'middle', name:'Piston', nameZh:'活塞', fact:'a rod that slides back and forth', factZh:'一来一回滑动的杆'}) +
      partSVG({px:650, py:430, lx:880, ly:380, anc:'start', name:'Cylinder', nameZh:'气缸', fact:'the round tube where the piston slides', factZh:'活塞在里面滑动的圆管'}) +
      arrowSVG({x1:280, y1:500, x2:540, y2:500, col:'#2a9d8f', mk:'agrn', tx:340, ty:555, anc:'start', name:'Push', nameZh:'推力', fact:'steam pushes the piston this way', factZh:'蒸汽这样推活塞'})
    );
  },

  // 6. 连杆带动车轮 — assets/07_rod.png
  st_rod(){
    return svgWrap(
      partSVG({px:350, py:440, lx:200, ly:340, anc:'end',   name:'Piston rod', nameZh:'活塞杆', fact:'slides back and forth from steam', factZh:'蒸汽推动的一来一回的杆'}) +
      partSVG({px:600, py:440, lx:430, ly:340, anc:'end',   name:'Connecting rod', nameZh:'连杆', fact:'links the piston to the wheel', factZh:'把活塞和轮子连起来'}) +
      partSVG({px:950, py:440, lx:1100,ly:370, anc:'start', name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that rolls the train', factZh:'让火车滚动的大轮子'})
    );
  },

  // 7. 动轮与钢轨 — assets/08_wheels.png
  st_wheels(){
    return svgWrap(
      partSVG({px:520, py:460, lx:520, ly:300, anc:'middle', name:'Driving wheels', nameZh:'动轮', fact:'big wheels that grip the rails', factZh:'紧紧抓住铁轨的大轮子'}) +
      partSVG({px:520, py:520, lx:850, ly:600, anc:'start',  name:'Connecting rod', nameZh:'连杆', fact:'links all the wheels together', factZh:'把所有轮子连起来的杆'}) +
      partSVG({px:520, py:740, lx:230, ly:680, anc:'start',  name:'Rail', nameZh:'钢轨', fact:'the shiny steel track the train rolls on', factZh:'火车滚动的亮亮铁轨'})
    );
  },

  // 8. 汽笛 — assets/09_whistle.png
  st_whistle(){
    return svgWrap(
      partSVG({px:650, py:165, lx:870, ly:140, anc:'start', name:'Whistle', nameZh:'汽笛', fact:'a brass trumpet that says TOOT!', factZh:'会发出"呜——！"的铜喇叭'}) +
      partSVG({px:470, py:85,  lx:300, ly:90,  anc:'end',   name:'Steam', nameZh:'蒸汽', fact:'puffs out of the whistle', factZh:'从汽笛里喷出来的蒸汽'}) +
      partSVG({px:530, py:440, lx:300, ly:490, anc:'end',   name:'Driver', nameZh:'司机', fact:'pulls the cord to blow the whistle', factZh:'拉绳子让汽笛响起来的人'}) +
      partSVG({px:430, py:290, lx:200, ly:280, anc:'end',   name:'Cord', nameZh:'拉绳', fact:'the line the driver pulls', factZh:'司机拉的那根绳子'})
    );
  },

  // 9. 烟囱与烟 — assets/10_chimney_v2.webp
  st_chimney(){
    return svgWrap(
      partSVG({px:295, py:280, lx:130, ly:220, anc:'end',   name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方'}) +
      partSVG({px:400, py:80,  lx:250, ly:80,  anc:'end',   name:'Smoke',   nameZh:'烟',   fact:'soft grey clouds floating up', factZh:'飘到天上的灰色云'}) +
      partSVG({px:560, py:400, lx:330, ly:460, anc:'end',   name:'Engine',  nameZh:'发动机', fact:'the whole front of the train', factZh:'火车前面的大机器'})
    );
  },

  // 10. 煤水车 — assets/11_tender.png
  st_tender(){
    return svgWrap(
      partSVG({px:400, py:420, lx:180, ly:530, anc:'end',   name:'Tender', nameZh:'煤水车', fact:'the car behind the engine', factZh:'发动机后面的车厢'}) +
      partSVG({px:350, py:290, lx:170, ly:230, anc:'end',   name:'Coal', nameZh:'煤', fact:'black lumps to burn in the fire', factZh:'黑色的煤块，在火里燃烧'}) +
      partSVG({px:430, py:300, lx:620, ly:240, anc:'start', name:'Water', nameZh:'水', fact:'turns to steam in the boiler', factZh:'在锅炉里变成蒸汽'})
    );
  },

  // 11. 一起跑起来 — assets/12_journey.png
  st_journey(){
    return svgWrap(
      partSVG({px:430, py:440, lx:200,  ly:400, anc:'end',   name:'Engine',         nameZh:'发动机', fact:'the front part with the boiler', factZh:'前面装锅炉的部分'}) +
      partSVG({px:560, py:110, lx:320,  ly:100, anc:'end',   name:'Steam & smoke',  nameZh:'蒸汽与烟', fact:'rises up and puffs out', factZh:'升起来，飘出去'}) +
      partSVG({px:430, py:600, lx:200,  ly:680, anc:'end',   name:'Driving wheels', nameZh:'动轮',    fact:'rolling along the rails', factZh:'沿着铁轨滚动'}) +
      partSVG({px:800, py:440, lx:1000, ly:400, anc:'start', name:'Tender',         nameZh:'煤水车', fact:'brings coal and water', factZh:'带来煤和水'})
    );
  },

  // 12. 词汇表图 — assets/13_vocab.png (decorative; main vocab is in cards)
  st_vocab(){
    return svgWrap(
      partSVG({px:700, py:450, lx:920, ly:420, anc:'start', name:'Engine', nameZh:'发动机', fact:'makes the train go', factZh:'让火车跑起来的部分'})
    );
  }
};