/* ============================================================
   Steam Train overlays — BUBBLE-MODE hotspots (v2).
   All px/py are IMAGE pixel coordinates (1216 x 832).
   shared/overlays.js auto-converts px/py to SVG viewBox.
   BUBBLE MODE: every partSVG carries line + lineZh (a short
   first-person speech line) + lineKey (unique key for the
   pre-generated line MP3). No leader lines / SVG labels — the
   reader pops an HTML speech bubble with name + line + fact.
   Coordinates calibrated page-by-page with GLM vision assist.
   ============================================================ */
window.OVL = {
  // 1. 整体部件 — assets/02_overview_v2.webp (labeled map)
  st_parts(){
    return svgWrap(
      partSVG({px:220, py:300, name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方',
               line:"Hi! I'm the chimney — I puff smoke up to the sky!", lineZh:'嗨！我是烟囱，把烟喷向天空！', lineKey:'st_parts_0'}) +
      partSVG({px:585, py:265, name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽聚集在顶上的圆包',
               line:"I'm the steam dome — I gather steam at the top!", lineZh:'我是蒸汽包，在顶上收集蒸汽！', lineKey:'st_parts_1'}) +
      partSVG({px:670, py:345, name:'Cab', nameZh:'司机室', fact:'where the driver sits and steers', factZh:'司机坐着开火车的地方',
               line:"This is the cab — the driver steers me from here!", lineZh:'这是司机室，司机在这里开车！', lineKey:'st_parts_2'}) +
      partSVG({px:430, py:560, name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that pulls the train', factZh:'拉着火车跑的大轮子',
               line:"I'm a big driving wheel — I pull the whole train!", lineZh:'我是大动轮，拉着整列火车跑！', lineKey:'st_parts_3'}) +
      partSVG({px:920, py:425, name:'Tender', nameZh:'煤水车', fact:'carries coal and water', factZh:'装着煤和水的车厢',
               line:"I'm the tender — I carry coal and water!", lineZh:'我是煤水车，装着煤和水！', lineKey:'st_parts_4'})
    );
  },

  // 2. 炉膛 剖面图 — assets/03_firebox_v3.webp
  st_firebox(){
    return svgWrap(
      partSVG({px:745, py:395, name:'Firebox', nameZh:'炉膛', fact:'where the coal burns', factZh:'煤炭燃烧的地方',
               line:"I'm the firebox — this is where the coal burns hot!", lineZh:'我是炉膛，煤在这里烧得旺旺的！', lineKey:'st_firebox_0'}) +
      partSVG({px:750, py:650, name:'Coal',    nameZh:'煤',   fact:'shoveled in to feed the fire', factZh:'铲进炉膛喂火的黑色燃料',
               line:"I'm coal — shovel me in to feed the fire!", lineZh:'我是煤，把我铲进去喂火！', lineKey:'st_firebox_1'}) +
      partSVG({px:1080,py:460, name:'Fireman', nameZh:'司炉', fact:'shovels coal into the firebox', factZh:'把煤铲进炉膛的人',
               line:"I'm the fireman — I shovel coal to keep us going!", lineZh:'我是司炉，铲煤让火车不停！', lineKey:'st_firebox_2'})
    );
  },

  // 3. 锅炉 剖面图 — assets/04_boiler_v3.webp
  st_boiler(){
    return svgWrap(
      partSVG({px:600, py:380, name:'Boiler', nameZh:'锅炉', fact:'the long tube full of water', factZh:'装满水的长管子',
               line:"I'm the boiler — a long tube full of water!", lineZh:'我是锅炉，装满水的长管子！', lineKey:'st_boiler_0'}) +
      partSVG({px:600, py:460, name:'Water',  nameZh:'水',   fact:'boils and turns into steam', factZh:'烧开后变成蒸汽',
               line:"I'm water — I boil and turn into steam!", lineZh:'我是水，烧开就变成蒸汽！', lineKey:'st_boiler_1'}) +
      partSVG({px:590, py:300, name:'Steam',  nameZh:'蒸汽', fact:'hot bubbles gather at the top', factZh:'热气在顶部聚集',
               line:"I'm steam — I rise up and gather at the top!", lineZh:'我是蒸汽，升到上面聚起来！', lineKey:'st_boiler_2'})
    );
  },

  // 4. 蒸汽包 特写 — assets/05_steamdome_v3.webp
  st_steamdome(){
    return svgWrap(
      partSVG({px:735, py:288, name:'Steam dome', nameZh:'蒸汽包', fact:'where steam gathers at the top', factZh:'蒸汽在顶部聚集的地方',
               line:"I'm the steam dome — steam fills me up!", lineZh:'我是蒸汽包，蒸汽把我装满！', lineKey:'st_steamdome_0'}) +
      partSVG({px:882, py:458, name:'Steam', nameZh:'蒸汽', fact:'fills the dome and pushes hard', factZh:'充满蒸汽包，使劲往上顶',
               line:"I'm steam — I push hard inside the dome!", lineZh:'我是蒸汽，在包里使劲顶！', lineKey:'st_steamdome_1'}) +
      partSVG({px:875, py:332, name:'Pressure', nameZh:'压力', fact:'the strong push of trapped steam', factZh:'蒸汽被憋住的强大推力',
               line:"Feel the pressure? I push the steam up high!", lineZh:'感觉到压力了吗？我把蒸汽往上顶！', lineKey:'st_steamdome_2'})
    );
  },

  // 5. 活塞 剖面图 — assets/06_piston_v3.webp
  st_piston(){
    return svgWrap(
      partSVG({px:240, py:380, name:'Steam', nameZh:'蒸汽', fact:'pushes the piston hard', factZh:'使劲推活塞',
               line:"I'm steam — I push the piston hard!", lineZh:'我是蒸汽，使劲推活塞！', lineKey:'st_piston_0'}) +
      partSVG({px:550, py:370, name:'Piston', nameZh:'活塞', fact:'a disc that slides back and forth', factZh:'来回滑动的圆盘',
               line:"I'm the piston — I slide back and forth!", lineZh:'我是活塞，一来一回地滑！', lineKey:'st_piston_1'}) +
      partSVG({px:765, py:380, name:'Cylinder', nameZh:'气缸', fact:'the round tube where the piston slides', factZh:'活塞在里面滑动的圆管',
               line:"I'm the cylinder — the piston slides inside me!", lineZh:'我是气缸，活塞在我里面滑！', lineKey:'st_piston_2'}) +
      partSVG({px:530, py:405, name:'Push', nameZh:'推力', fact:'steam pushes the piston this way', factZh:'蒸汽这样推活塞',
               line:"Push! Steam shoves the piston this way!", lineZh:'推！蒸汽这样推活塞！', lineKey:'st_piston_3'})
    );
  },

  // 6. 连杆带动车轮 特写 — assets/07_rod_v3.webp
  st_rod(){
    return svgWrap(
      partSVG({px:330, py:420, name:'Piston rod', nameZh:'活塞杆', fact:'slides back and forth from steam', factZh:'蒸汽推动的一来一回的杆',
               line:"I'm the piston rod — steam makes me slide!", lineZh:'我是活塞杆，蒸汽让我滑！', lineKey:'st_rod_0'}) +
      partSVG({px:630, py:490, name:'Connecting rod', nameZh:'连杆', fact:'links the piston to the wheel', factZh:'把活塞和轮子连起来',
               line:"I'm the connecting rod — I link piston to wheel!", lineZh:'我是连杆，把活塞和轮子连起来！', lineKey:'st_rod_1'}) +
      partSVG({px:945, py:425, name:'Driving wheel', nameZh:'动轮', fact:'the big wheel that rolls the train', factZh:'让火车滚动的大轮子',
               line:"I'm the driving wheel — I roll the train along!", lineZh:'我是动轮，带着火车滚滚向前！', lineKey:'st_rod_2'})
    );
  },

  // 7. 动轮与钢轨 特写 — assets/08_wheels_v3.webp
  st_wheels(){
    return svgWrap(
      partSVG({px:320, py:400, name:'Driving wheels', nameZh:'动轮', fact:'big wheels that grip the rails', factZh:'紧紧抓住铁轨的大轮子',
               line:"We're driving wheels — we grip the rails tight!", lineZh:'我们是动轮，紧紧抓住铁轨！', lineKey:'st_wheels_0'}) +
      partSVG({px:550, py:470, name:'Connecting rod', nameZh:'连杆', fact:'links all the wheels together', factZh:'把所有轮子连起来的杆',
               line:"I'm the connecting rod — I link all the wheels!", lineZh:'我是连杆，把所有轮子连起来！', lineKey:'st_wheels_1'}) +
      partSVG({px:510, py:655, name:'Rail', nameZh:'钢轨', fact:'the shiny steel track the train rolls on', factZh:'火车滚动的亮亮铁轨',
               line:"I'm the rail — the shiny track we roll on!", lineZh:'我是钢轨，火车在我身上跑！', lineKey:'st_wheels_2'})
    );
  },

  // 8. 汽笛 场景 — assets/09_whistle_v3.webp
  st_whistle(){
    return svgWrap(
      partSVG({px:520, py:280, name:'Whistle', nameZh:'汽笛', fact:'a brass trumpet that says TOOT!', factZh:'会发出"呜——！"的铜喇叭',
               line:"TOOT! I'm the whistle — hear me shout!", lineZh:'呜——！我是汽笛，听我喊！', lineKey:'st_whistle_0'}) +
      partSVG({px:930, py:110, name:'Steam',   nameZh:'蒸汽', fact:'puffs out of the whistle', factZh:'从汽笛里喷出来的蒸汽',
               line:"I'm steam — I puff out of the whistle!", lineZh:'我是蒸汽，从汽笛里喷出来！', lineKey:'st_whistle_1'}) +
      partSVG({px:515, py:605, name:'Driver',  nameZh:'司机', fact:'pulls the cord to blow the whistle', factZh:'拉绳子让汽笛响起来的人',
               line:"I'm the driver — I pull the cord to toot!", lineZh:'我是司机，拉绳子让汽笛响！', lineKey:'st_whistle_2'}) +
      partSVG({px:520, py:425, name:'Cord',    nameZh:'拉绳', fact:'the line the driver pulls', factZh:'司机拉的那根绳子',
               line:"I'm the cord — the driver pulls me!", lineZh:'我是拉绳，司机拉的就是我！', lineKey:'st_whistle_3'})
    );
  },

  // 9. 烟囱与烟 正面 — assets/10_chimney_v3.webp
  st_chimney(){
    return svgWrap(
      partSVG({px:560, py:200, name:'Chimney', nameZh:'烟囱', fact:'the tall funnel that puffs smoke', factZh:'高高的烟囱，冒烟的地方',
               line:"I'm the chimney — tall and puffing smoke!", lineZh:'我是烟囱，高高的，冒着烟！', lineKey:'st_chimney_0'}) +
      partSVG({px:330, py:150, name:'Smoke',   nameZh:'烟',   fact:'soft grey clouds floating up', factZh:'飘到天上的灰色云',
               line:"I'm smoke — soft grey clouds floating up!", lineZh:'我是烟，灰灰的云飘上天！', lineKey:'st_chimney_1'}) +
      partSVG({px:600, py:480, name:'Engine',  nameZh:'发动机', fact:'the front of the locomotive', factZh:'火车的前脸',
               line:"I'm the engine — the strong front of the train!", lineZh:'我是发动机，火车结实的前脸！', lineKey:'st_chimney_2'})
    );
  },

  // 10. 煤水车 剖面图 — assets/11_tender_v3.webp
  st_tender(){
    return svgWrap(
      partSVG({px:950, py:400, name:'Tender', nameZh:'煤水车', fact:'the car behind the engine', factZh:'发动机后面的车厢',
               line:"I'm the tender — I ride behind the engine!", lineZh:'我是煤水车，跟在发动机后面！', lineKey:'st_tender_0'}) +
      partSVG({px:410, py:270, name:'Coal', nameZh:'煤', fact:'black lumps to burn in the fire', factZh:'黑色的煤块，在火里燃烧',
               line:"I'm coal — black lumps to burn for fire!", lineZh:'我是煤，黑色煤块给火里烧！', lineKey:'st_tender_1'}) +
      partSVG({px:590, py:485, name:'Water', nameZh:'水', fact:'turns to steam in the boiler', factZh:'在锅炉里变成蒸汽',
               line:"I'm water — I turn to steam in the boiler!", lineZh:'我是水，在锅炉里变成蒸汽！', lineKey:'st_tender_2'})
    );
  },

  // 11. 一起跑起来 场景 — assets/12_journey_v3.webp
  st_journey(){
    return svgWrap(
      partSVG({px:420, py:435, name:'Engine',         nameZh:'发动机', fact:'the front part with the boiler', factZh:'前面装锅炉的部分',
               line:"I'm the engine — the front with the big boiler!", lineZh:'我是发动机，前面装着大锅炉！', lineKey:'st_journey_0'}) +
      partSVG({px:590, py:120, name:'Steam & smoke',  nameZh:'蒸汽与烟', fact:'rises up and puffs out', factZh:'升起来，飘出去',
               line:"We're steam and smoke — we rise and puff out!", lineZh:'我们是蒸汽和烟，升起来飘出去！', lineKey:'st_journey_1'}) +
      partSVG({px:300, py:580, name:'Driving wheels', nameZh:'动轮',    fact:'rolling along the rails', factZh:'沿着铁轨滚动',
               line:"We're driving wheels — rolling along the rails!", lineZh:'我们是动轮，沿着铁轨滚！', lineKey:'st_journey_2'}) +
      partSVG({px:785, py:440, name:'Tender',         nameZh:'煤水车', fact:'brings coal and water', factZh:'带来煤和水',
               line:"I'm the tender — I bring coal and water!", lineZh:'我是煤水车，带来煤和水！', lineKey:'st_journey_3'})
    );
  },

  // 12. 词汇表图 — assets/13_vocab_v3.webp (decorative; main vocab is in cards)
  st_vocab(){
    return svgWrap(
      partSVG({px:550, py:400, name:'Engine', nameZh:'发动机', fact:'makes the train go', factZh:'让火车跑起来的部分',
               line:"I'm the engine — I make the train go!", lineZh:'我是发动机，我让火车跑起来！', lineKey:'st_vocab_0'})
    );
  }
};
