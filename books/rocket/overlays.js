/* ============================================================
   Rocket overlays — interactive hotspots for each page.
   Coordinate space: 1000 x 667 (matches shared/overlays.js)
   Each part: red dot + leader line + label (clickable hit area).
   Coordinates re-mapped to the actual 14-page asset set.
   ============================================================ */
window.OVL = {
  // 1. 火箭的构造 — assets/13_parts.png
  rocket_parts(){
    return svgWrap(
      partSVG({px:500, py:120, lx:730, ly:120, anc:'start', name:'Nose cone', nameZh:'整流罩', fact:'the pointy top that cuts through the air', factZh:'尖尖的顶，帮火箭穿过空气'}) +
      partSVG({px:500, py:280, lx:730, ly:280, anc:'start', name:'Window', nameZh:'舷窗', fact:'a little round window to look outside', factZh:'圆圆的小窗，可以往外看'}) +
      partSVG({px:500, py:420, lx:730, ly:420, anc:'start', name:'Fuel tank', nameZh:'燃料箱', fact:'holds the fuel that makes fire', factZh:'装燃料的地方，燃料燃烧产生动力'}) +
      partSVG({px:500, py:620, lx:730, ly:620, anc:'start', name:'Engine', nameZh:'发动机', fact:'burns fuel and shoots fire down', factZh:'燃烧燃料，从下面喷出火焰'}) +
      partSVG({px:340, py:540, lx:150, ly:590, anc:'end',  name:'Fins', nameZh:'尾翼', fact:'keep the rocket steady in the air', factZh:'让火箭飞得稳稳的'})
    );
  },

  // 2. 燃料与发动机 — assets/05_thrust.png
  rocket_fuel(){
    return svgWrap(
      partSVG({px:500, py:80,  lx:730, ly:80,  anc:'start', name:'Fuel', nameZh:'燃料', fact:'the rocket drinks fuel to make fire', factZh:'火箭喝燃料才能生火'}) +
      partSVG({px:500, py:300, lx:730, ly:300, anc:'start', name:'Engine', nameZh:'发动机', fact:'burns fuel into very hot fire', factZh:'把燃料烧成炽热的火'}) +
      partSVG({px:500, py:560, lx:730, ly:560, anc:'start', name:'Flame', nameZh:'火焰', fact:'hot fire that pushes the rocket up', factZh:'炽热的火，把火箭往上推'})
    );
  },

  // 3. 倒计时 — assets/03_countdown.png
  rocket_countdown(){
    return svgWrap(
      partSVG({px:720, py:320, lx:850, ly:320, anc:'start', name:'Countdown', nameZh:'倒计时', fact:'we count 3, 2, 1 before GO', factZh:'发射前数 3、2、1'}) +
      partSVG({px:480, py:520, lx:730, ly:520, anc:'start', name:'Launch button', nameZh:'发射按钮', fact:'pressed when we count to GO', factZh:'数到发射时按下的按钮'})
    );
  },

  // 4. 升空 — assets/04_launch.png
  rocket_launch(){
    return svgWrap(
      partSVG({px:540, py:380, lx:780, ly:360, anc:'start', name:'Rocket', nameZh:'火箭', fact:'flies up, up, up into the sky', factZh:'向上、向上飞进天空'}) +
      partSVG({px:380, py:680, lx:200, ly:640, anc:'end',  name:'Flame', nameZh:'火焰', fact:'fire shoots down so the rocket goes up', factZh:'火往下喷，火箭就往上飞'})
    );
  },

  // 5. 推力的秘密（作用力与反作用力） — assets/17_thrust.png
  rocket_thrust(){
    return svgWrap(
      partSVG({px:500, py:560, lx:730, ly:560, anc:'start', name:'Hot gas', nameZh:'热气', fact:'shoots out the bottom of the engine', factZh:'从发动机底部喷出去'}) +
      arrowSVG({x1:500, y1:580, x2:500, y2:120, col:'#2a9d8f', mk:'agrn', tx:545, ty:200, anc:'start', name:'Rocket flies up', nameZh:'火箭往上飞', fact:'push down makes it go up', factZh:'往下推，它就往上飞'})
    );
  },

  // 6. 分级分离 — assets/14_stage.png
  rocket_stage(){
    return svgWrap(
      partSVG({px:460, py:220, lx:730, ly:210, anc:'start', name:'Upper stage', nameZh:'上面一级', fact:'carries the satellite into space', factZh:'带着卫星飞向太空的那一段'}) +
      partSVG({px:520, py:520, lx:730, ly:540, anc:'start', name:'Empty tank', nameZh:'空燃料箱', fact:'falls away when its fuel is gone', factZh:'燃料用完后就掉下去'})
    );
  },

  // 7. 进入太空 — assets/06_space.png
  rocket_space(){
    return svgWrap(
      partSVG({px:760, py:220, lx:880, ly:220, anc:'start', name:'Earth', nameZh:'地球', fact:'our home, looks small from space', factZh:'我们的家，从太空看很小'}) +
      partSVG({px:220, py:300, lx:120, ly:300, anc:'end', name:'Stars', nameZh:'星星', fact:'twinkle far away in space', factZh:'在远处闪闪发亮'})
    );
  },

  // 8. 卫星入轨 — assets/15_orbit.png
  rocket_orbit(){
    return svgWrap(
      partSVG({px:360, py:560, lx:150, ly:560, anc:'end',  name:'Satellite', nameZh:'卫星', fact:'a small machine that flies around Earth', factZh:'绕着地球飞的小机器'}) +
      partSVG({px:650, py:430, lx:780, ly:410, anc:'start', name:'Earth', nameZh:'地球', fact:'the satellite circles around it', factZh:'卫星绕着它转圈圈'}) +
      partSVG({px:280, py:300, lx:420, ly:260, anc:'start', name:'Orbit', nameZh:'轨道', fact:'the round path the satellite follows', factZh:'卫星走的圆圆路线'})
    );
  },

  // 9. 卫星做什么 — assets/18_satellite.png
  rocket_satellite(){
    return svgWrap(
      partSVG({px:500, py:390, lx:730, ly:390, anc:'start', name:'Camera', nameZh:'相机', fact:'takes photos of Earth from up high', factZh:'从高处给地球拍照'}) +
      partSVG({px:500, py:220, lx:730, ly:220, anc:'start', name:'Antenna', nameZh:'天线', fact:'sends TV and phone signals', factZh:'发送电视和电话信号'}) +
      partSVG({px:720, py:390, lx:880, ly:390, anc:'start', name:'Solar panel', nameZh:'太阳能板', fact:'catches sunlight to make power', factZh:'收集阳光当能量'})
    );
  },

  // 10. 卫星回家：再入大气层 — assets/16_reentry.png
  rocket_reentry(){
    return svgWrap(
      partSVG({px:620, py:300, lx:820, ly:260, anc:'start', name:'Hot air', nameZh:'热空气', fact:'rubbing the air makes it very hot', factZh:'和空气摩擦变得很烫'}) +
      partSVG({px:450, py:500, lx:220, ly:540, anc:'end',  name:'Heat shield', nameZh:'防热盾', fact:'protects the capsule from the hot flame', factZh:'保护返回舱不被火焰烤坏'})
    );
  },

  // 11. 安全着陆 — assets/11_return.png
  rocket_return(){
    return svgWrap(
      partSVG({px:490, py:180, lx:730, ly:160, anc:'start', name:'Parachute', nameZh:'降落伞', fact:'opens to slow the fall', factZh:'打开让下降变慢'}) +
      partSVG({px:490, py:430, lx:730, ly:440, anc:'start', name:'Capsule', nameZh:'返回舱', fact:'the part that comes home', factZh:'回家的那一部分'})
    );
  },

  // 12. 回到地球 — assets/02_earth.png (also page 13: assets/12_vocab.png)
  rocket_home(){
    return svgWrap(
      partSVG({px:500, py:420, lx:730, ly:420, anc:'start', name:'Earth', nameZh:'地球', fact:'our blue and green home', factZh:'我们蓝绿相间的家'}) +
      partSVG({px:420, py:480, lx:130, ly:520, anc:'end',  name:'Home', nameZh:'家', fact:'the satellite is back where it belongs', factZh:'卫星回到了属于它的地方'})
    );
  }
};
