/* ============================================================
   Rocket overlays — BUBBLE-MODE hotspots (v2).
   Coordinate space: image pixels 1216 x 832 (shared/overlays.js converts).
   Every hotspot carries line + lineZh (first-person speech) + lineKey.
   No leader lines / SVG labels. Arrows become bubble hotspots at arrow-heads.
   Coordinates calibrated page-by-page with GLM vision assist.
   ============================================================ */
window.OVL = {
  rocket_parts(){
    return svgWrap(
      partSVG({px:500, py:120, name:'Nose cone', nameZh:'整流罩', fact:'the pointy top that cuts through the air', factZh:'尖尖的顶，帮火箭穿过空气',
        line:"I'm the Nose Cone — I pointy-top cut through the air!", lineZh:'我是整流罩，尖尖的顶帮火箭穿过空气！', lineKey:'rocket_parts_0'}) +
      partSVG({px:500, py:280, name:'Window', nameZh:'舷窗', fact:'a little round window to look outside', factZh:'圆圆的小窗，可以往外看',
        line:"I'm the Window — peek outside from the rocket!", lineZh:'我是舷窗，从火箭里往外看！', lineKey:'rocket_parts_1'}) +
      partSVG({px:500, py:420, name:'Fuel tank', nameZh:'燃料箱', fact:'holds the fuel that makes fire', factZh:'装燃料的地方，燃料燃烧产生动力',
        line:"I'm the Fuel Tank — I hold the fuel for fire!", lineZh:'我是燃料箱，装着让火箭燃烧的燃料！', lineKey:'rocket_parts_2'}) +
      partSVG({px:500, py:620, name:'Engine', nameZh:'发动机', fact:'burns fuel and shoots fire down', factZh:'燃烧燃料，从下面喷出火焰',
        line:"I'm the Engine — I burn fuel and shoot fire down!", lineZh:'我是发动机，燃烧燃料往下喷火！', lineKey:'rocket_parts_3'}) +
      partSVG({px:340, py:540, name:'Fins', nameZh:'尾翼', fact:'keep the rocket steady in the air', factZh:'让火箭飞得稳稳的',
        line:"I'm the Fins — I keep the rocket steady!", lineZh:'我是尾翼，让火箭飞得稳稳的！', lineKey:'rocket_parts_4'})
    );
  },

  rocket_fuel(){
    return svgWrap(
      partSVG({px:500, py:80,  name:'Fuel', nameZh:'燃料', fact:'the rocket drinks fuel to make fire', factZh:'火箭喝燃料才能生火',
        line:"I'm Fuel — the rocket drinks me to make fire!", lineZh:'我是燃料，火箭喝了我才能喷火！', lineKey:'rocket_fuel_0'}) +
      partSVG({px:500, py:300, name:'Engine', nameZh:'发动机', fact:'burns fuel into very hot fire', factZh:'把燃料烧成炽热的火',
        line:"I'm the Engine — I burn fuel into super hot fire!", lineZh:'我是发动机，把燃料烧成炽热的火！', lineKey:'rocket_fuel_1'}) +
      partSVG({px:500, py:560, name:'Flame', nameZh:'火焰', fact:'hot fire that pushes the rocket up', factZh:'炽热的火，把火箭往上推',
        line:"I'm Flame — hot fire pushes the rocket up!", lineZh:'我是火焰，热火把火箭往上推！', lineKey:'rocket_fuel_2'})
    );
  },

  rocket_countdown(){
    return svgWrap(
      partSVG({px:870, py:320, name:'Countdown', nameZh:'倒计时', fact:'we count 3, 2, 1 before GO', factZh:'发射前数 3、2、1',
        line:"I'm the Countdown — 3, 2, 1, GO!", lineZh:'我是倒计时，3、2、1，发射！', lineKey:'rocket_countdown_0'}) +
      partSVG({px:500, py:560, name:'Launch button', nameZh:'发射按钮', fact:'pressed when we count to GO', factZh:'数到发射时按下的按钮',
        line:"I'm the Launch Button — press me when we count to GO!", lineZh:'我是发射按钮，数到发射时按我！', lineKey:'rocket_countdown_1'})
    );
  },

  rocket_launch(){
    return svgWrap(
      partSVG({px:540, py:380, name:'Rocket', nameZh:'火箭', fact:'flies up, up, up into the sky', factZh:'向上、向上飞进天空',
        line:"I'm the Rocket — up, up, up into the sky!", lineZh:'我是火箭，向上向上飞进天空！', lineKey:'rocket_launch_0'}) +
      partSVG({px:380, py:680, name:'Flame', nameZh:'火焰', fact:'fire shoots down so the rocket goes up', factZh:'火往下喷，火箭就往上飞',
        line:"I'm Flame — fire shoots down so rocket goes up!", lineZh:'我是火焰，火往下喷，火箭往上飞！', lineKey:'rocket_launch_1'})
    );
  },

  rocket_thrust(){
    return svgWrap(
      partSVG({px:500, py:560, name:'Hot gas', nameZh:'热气', fact:'shoots out the bottom of the engine', factZh:'从发动机底部喷出去',
        line:"I'm Hot Gas — I shoot out the engine bottom!", lineZh:'我是热气，从发动机底部喷出去！', lineKey:'rocket_thrust_0'}) +
      partSVG({px:608, py:150, name:'Rocket flies up', nameZh:'火箭往上飞', fact:'push down makes it go up', factZh:'往下推，它就往上飞',
        line:"I'm the Rocket — push down makes me fly up!", lineZh:'我是火箭，往下推，我就往上飞！', lineKey:'rocket_thrust_1'})
    );
  },

  rocket_stage(){
    return svgWrap(
      partSVG({px:460, py:220, name:'Upper stage', nameZh:'上面一级', fact:'carries the satellite into space', factZh:'带着卫星飞向太空的那一段',
        line:"I'm the Upper Stage — I carry the satellite to space!", lineZh:'我是上面一级，带着卫星飞向太空！', lineKey:'rocket_stage_0'}) +
      partSVG({px:520, py:520, name:'Empty tank', nameZh:'空燃料箱', fact:'falls away when its fuel is gone', factZh:'燃料用完后就掉下去',
        line:"I'm the Empty Tank — I fall away when fuel is gone!", lineZh:'我是空燃料箱，燃料用完就掉下去！', lineKey:'rocket_stage_1'})
    );
  },

  rocket_space(){
    return svgWrap(
      partSVG({px:760, py:220, name:'Earth', nameZh:'地球', fact:'our home, looks small from space', factZh:'我们的家，从太空看很小',
        line:"I'm Earth — our home looks small from space!", lineZh:'我是地球，从太空看我们的家很小！', lineKey:'rocket_space_0'}) +
      partSVG({px:220, py:300, name:'Stars', nameZh:'星星', fact:'twinkle far away in space', factZh:'在远处闪闪发亮',
        line:"I'm Stars — I twinkle far away in space!", lineZh:'我是星星，在太空远处闪闪发亮！', lineKey:'rocket_space_1'})
    );
  },

  rocket_orbit(){
    return svgWrap(
      partSVG({px:360, py:560, name:'Satellite', nameZh:'卫星', fact:'a small machine that flies around Earth', factZh:'绕着地球飞的小机器',
        line:"I'm a Satellite — I fly around Earth!", lineZh:'我是卫星，绕着地球飞！', lineKey:'rocket_orbit_0'}) +
      partSVG({px:650, py:430, name:'Earth', nameZh:'地球', fact:'the satellite circles around it', factZh:'卫星绕着它转圈圈',
        line:"I'm Earth — the satellite circles around me!", lineZh:'我是地球，卫星围着我转圈圈！', lineKey:'rocket_orbit_1'}) +
      partSVG({px:280, py:300, name:'Orbit', nameZh:'轨道', fact:'the round path the satellite follows', factZh:'卫星走的圆圆路线',
        line:"I'm the Orbit — the round path in space!", lineZh:'我是轨道，卫星走的圆圆路线！', lineKey:'rocket_orbit_2'})
    );
  },

  rocket_satellite(){
    return svgWrap(
      partSVG({px:500, py:390, name:'Camera', nameZh:'相机', fact:'takes photos of Earth from up high', factZh:'从高处给地球拍照',
        line:"I'm the Camera — I take photos of Earth from high up!", lineZh:'我是相机，从高处给地球拍照！', lineKey:'rocket_satellite_0'}) +
      partSVG({px:500, py:220, name:'Antenna', nameZh:'天线', fact:'sends TV and phone signals', factZh:'发送电视和电话信号',
        line:"I'm the Antenna — I send TV and phone signals!", lineZh:'我是天线，发送电视和电话信号！', lineKey:'rocket_satellite_1'}) +
      partSVG({px:720, py:390, name:'Solar panel', nameZh:'太阳能板', fact:'catches sunlight to make power', factZh:'收集阳光当能量',
        line:"I'm the Solar Panel — I catch sunlight for power!", lineZh:'我是太阳能板，收集阳光当能量！', lineKey:'rocket_satellite_2'})
    );
  },

  rocket_reentry(){
    return svgWrap(
      partSVG({px:580, py:260, name:'Hot air', nameZh:'热空气', fact:'rubbing the air makes it very hot', factZh:'和空气摩擦变得很烫',
        line:"I'm Hot Air — rubbing the air makes me super hot!", lineZh:'我是热空气，和空气摩擦变得很烫！', lineKey:'rocket_reentry_0'}) +
      partSVG({px:450, py:500, name:'Heat shield', nameZh:'防热盾', fact:'protects the capsule from the hot flame', factZh:'保护返回舱不被火焰烤坏',
        line:"I'm the Heat Shield — I protect the capsule from hot flame!", lineZh:'我是防热盾，保护返回舱不被烤坏！', lineKey:'rocket_reentry_1'})
    );
  },

  rocket_return(){
    return svgWrap(
      partSVG({px:490, py:180, name:'Parachute', nameZh:'降落伞', fact:'opens to slow the fall', factZh:'打开让下降变慢',
        line:"I'm the Parachute — I open to slow the fall!", lineZh:'我是降落伞，打开让下降变慢！', lineKey:'rocket_return_0'}) +
      partSVG({px:490, py:430, name:'Capsule', nameZh:'返回舱', fact:'the part that comes home', factZh:'回家的那一部分',
        line:"I'm the Capsule — I'm the part that comes home!", lineZh:'我是返回舱，回家的那一部分！', lineKey:'rocket_return_1'})
    );
  },

  rocket_home(){
    return svgWrap(
      partSVG({px:500, py:420, name:'Earth', nameZh:'地球', fact:'our blue and green home', factZh:'我们蓝绿相间的家',
        line:"I'm Earth — our blue and green home!", lineZh:'我是地球，我们蓝绿相间的家！', lineKey:'rocket_home_0'}) +
      partSVG({px:770, py:410, name:'Home', nameZh:'家', fact:'the satellite is back where it belongs', factZh:'卫星回到了属于它的地方',
        line:"I'm Home — the satellite is back where it belongs!", lineZh:'我是家，卫星回到了属于它的地方！', lineKey:'rocket_home_1'})
    );
  }
};
