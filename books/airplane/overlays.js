/* Airplane overlays — BUBBLE-MODE hotspots (v2).
   All px/py are IMAGE pixel coordinates (1216 x 832).
   shared/overlays.js auto-converts px/py to SVG viewBox.
   BUBBLE MODE: every hotspot carries line + lineZh (first-person speech
   line) + lineKey (unique key for pre-generated line MP3). No leader
   lines / SVG labels. Arrows become bubble hotspots at their arrow-head
   positions. Coordinates calibrated page-by-page with GLM vision assist. */
window.OVL = {
  overview(){
    const parts=[
      {name:'Tail', nameZh:'尾翼', fact:'keeps the plane steady and helps it turn left or right.', factZh:'让飞机保持平稳，并帮助它左右转弯。', px:310,py:250,
       line:"I'm the Tail — I help the plane turn and stay steady!", lineZh:'我是尾翼，帮飞机转弯、保持平稳！', lineKey:'overview_0'},
      {name:'Fuselage', nameZh:'机身', fact:'the long body that carries pilots, passengers and bags.', factZh:'长长的机身，载着飞行员、乘客和行李。', px:580,py:400,
       line:"I'm the Fuselage — I carry everyone and everything!", lineZh:'我是机身，装着所有人还有行李！', lineKey:'overview_1'},
      {name:'Cockpit', nameZh:'驾驶舱', fact:'the front room where the pilots fly the plane.', factZh:'飞机最前面的驾驶舱，飞行员在这里开飞机。', px:960,py:350,
       line:"I'm the Cockpit — this is where the pilots fly!", lineZh:'我是驾驶舱，飞行员就在这里开飞机！', lineKey:'overview_2'},
      {name:'Wing', nameZh:'机翼', fact:'makes LIFT — the upward push that holds the plane in the sky.', factZh:'产生升力——把飞机托在空中的向上力量。', px:320,py:420,
       line:"I'm the Wing — I make the lift that keeps us up!", lineZh:'我是机翼，产生升力让我们飞起来！', lineKey:'overview_3'},
      {name:'Engine', nameZh:'引擎', fact:'burns fuel and pushes air BACK to make THRUST (forward push).', factZh:'燃烧燃料、把空气向后推，从而产生推力（向前的力量）。', px:570,py:520,
       line:"I'm the Engine — I burn fuel to push us forward!", lineZh:'我是引擎，燃烧燃料推着飞机前进！', lineKey:'overview_4'},
      {name:'Landing gear', nameZh:'起落架', fact:'the wheels that come DOWN for takeoff and landing, and fold UP in the air.', factZh:'就是轮子，起飞和降落时放下，在空中收起。', px:920,py:580,
       line:"I'm the Landing Gear — wheels down, here we go!", lineZh:'我是起落架，放下轮子就可以降落啦！', lineKey:'overview_5'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  fuselage(){
    const parts=[
      {name:'Cockpit', nameZh:'驾驶舱', fact:'the front room where pilots fly the plane.', factZh:'飞机最前面的驾驶舱，飞行员在这里开飞机。', px:290,py:460,
       line:"I'm the Cockpit — pilots sit here and steer!", lineZh:'我是驾驶舱，飞行员坐这里掌舵！', lineKey:'fuselage_0'},
      {name:'Cabin', nameZh:'客舱', fact:'where passengers sit (above the floor).', factZh:'乘客坐的地方（在地板上层）。', px:600,py:490,
       line:"I'm the Cabin — passengers sit here and look out the windows!", lineZh:'我是客舱，乘客坐这里看窗外！', lineKey:'fuselage_1'},
      {name:'Cargo hold', nameZh:'货舱', fact:'the space below the floor for bags and boxes.', factZh:'地板下面装行李和箱子的空间。', px:910,py:460,
       line:"I'm the Cargo Hold — suitcases and boxes ride down here!", lineZh:'我是货舱，行李箱和货物都在下面！', lineKey:'fuselage_2'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  wing(){
    const parts=[
      {name:'Wing', nameZh:'机翼', fact:'the big surface that holds the plane up in the air.', factZh:'把飞机托在空中的巨大翼面。', px:500,py:350,
       line:"I'm the Wing — my curved shape holds the plane up!", lineZh:'我是机翼，弯弯的形状把飞机托起来！', lineKey:'wing_0'},
      {name:'Aileron', nameZh:'副翼', fact:'a small hinged flap on the back edge that helps the plane roll and turn.', factZh:'机翼后缘的小襟翼，帮助飞机滚转和转弯。', px:920,py:400,
       line:"I'm the Aileron — I tilt the wings to help us turn!", lineZh:'我是副翼，帮助机翼倾斜来转弯！', lineKey:'wing_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  lift(){
    const top=['M70,185 Q300,245 500,210 T930,185','M70,215 Q300,270 500,240 T930,215','M70,150 Q300,225 500,185 T930,150'];
    const bot=['M70,420 L930,420','M70,445 L930,445','M70,470 L930,470'];
    const flows=top.map(d=>`<path class="flow" d="${d}" fill="none" stroke="#2a9d8f" stroke-width="4" marker-end="url(#agrn)"/>`).join('')
      + bot.map(d=>`<path class="flow" d="${d}" fill="none" stroke="#ef476f" stroke-width="4" marker-end="url(#ar)"/>`).join('');
    const wing=`<path d="M90,330 Q300,245 500,230 Q700,245 910,330 Q700,410 500,420 Q300,410 90,330" fill="none" stroke="#8a96a3" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>`;
    const liftPart=partSVG({name:'Lift', nameZh:'升力', fact:'the upward push from the wings that holds the plane up.', factZh:'机翼产生的向上推力，把飞机托起来。', px:608,py:143,
      line:"I'm Lift — fast air on top makes me pull the wing up!", lineZh:'我是升力，上方空气跑得快，把机翼往上托！', lineKey:'lift_0'});
    const caps=capSVG('Fast air on top → LOW pressure','500','65','#2a9d8f','middle',19)
      + capSVG('Slow air below → HIGH pressure','500','535','#ef476f','middle',19)
      + capSVG('streamlined wing (airfoil)','500','625','#6c757d','middle',16);
    return svgWrap(flows+wing+liftPart+caps);
  },
  tail(){
    const highlight=`<rect x="515" y="170" width="75" height="195" rx="6" fill="#ef476f" opacity="0.15" stroke="#ef476f" stroke-width="2" stroke-dasharray="5 3"/>`;
    const parts=[
      {name:'Rudder', nameZh:'方向舵', fact:'moves side to side to turn the plane left or right.', factZh:'左右摆动，让飞机向左或向右转。', px:555,py:265,
       line:"I'm the Rudder — I swing left and right to steer!", lineZh:'我是方向舵，左右摆动让飞机转向！', lineKey:'tail_0'},
      {name:'Elevator', nameZh:'升降舵', fact:'moves up and down to tip the nose up or down.', factZh:'上下摆动，让机头上仰或下俯。', px:720,py:400,
       line:"I'm the Elevator — I tip the nose up or down!", lineZh:'我是升降舵，让机头上仰或下俯！', lineKey:'tail_1'},
      {name:'Tail', nameZh:'尾翼', fact:'the tail assembly keeps the plane steady in the air.', factZh:'尾翼让飞机在空中保持平稳。', px:480,py:260,
       line:"I'm the Tail — I keep the plane flying straight and stable!", lineZh:'我是尾翼，让飞机飞得又直又稳！', lineKey:'tail_2'},
    ];
    return svgWrap(highlight+parts.map(partSVG).join('')
      + capSVG('turn left / right','850','120','#ef476f','end',15)
      + capSVG('nose up / down','70','625','#2a9d8f','start',15));
  },
  engine(){
    const parts=partSVG({name:'Engine', nameZh:'引擎', fact:'sucks in air, burns fuel, and shoots hot air BACK to make THRUST.', factZh:'吸入空气、燃烧燃料，把热气向后喷出产生推力。', px:500,py:330,
      line:"I'm the Engine — air in, fuel burned, hot air out!", lineZh:'我是引擎，吸气、燃烧、喷气！', lineKey:'engine_0'})
      + partSVG({name:'Thrust', nameZh:'推力', fact:'the forward push from the engine that moves the plane.', factZh:'引擎产生的向前推力。', px:1082,py:412,
      line:"I'm Thrust — hot air shoots back and pushes us forward!", lineZh:'我是推力，热气向后喷，推动飞机前进！', lineKey:'engine_1'});
    const air=`<g fill="#3a86ff"><circle class="p-in" cx="250" cy="330" r="7"/><circle class="p-in b" cx="250" cy="305" r="7"/><circle class="disable"/><circle class="p-in c" cx="250" cy="355" r="7"/></g>`;
    const exhaust=`<g fill="#ef476f"><circle class="p-out" cx="650" cy="330" r="7"/><circle class="p-out b" cx="650" cy="305" r="7"/><circle class="p-out c" cx="650" cy="355" r="7"/></g>`;
    const caps=capSVG('1 Air in','200','300','#3a86ff','start',16)
      + capSVG('2 Burn fuel','500','170','#f4a261','middle',16)
      + capSVG('3 Hot air out','700','290','#ef476f','start',16);
    return svgWrap(parts+air+exhaust+caps);
  },
  forces(){
    const parts=[
      {name:'LIFT', nameZh:'升力', fact:'the upward push from the wings that holds the plane up.', factZh:'机翼产生的向上推力，把飞机托起来。', px:608,py:137,
       line:"I'm Lift — the upward push from the wings!", lineZh:'我是升力，机翼把我向上托！', lineKey:'forces_0'},
      {name:'WEIGHT', nameZh:'重力', fact:'gravity pulling the plane down toward the ground.', factZh:'重力把飞机往地面拉。', px:702,py:717,
       line:"I'm Weight — gravity pulling the plane down!", lineZh:'我是重力，把飞机往下拉！', lineKey:'forces_1'},
      {name:'THRUST', nameZh:'推力', fact:'the forward push from the engines.', factZh:'引擎产生的向前推力。', px:1070,py:418,
       line:"I'm Thrust — the forward push from the engines!", lineZh:'我是推力，引擎推着我向前冲！', lineKey:'forces_2'},
      {name:'DRAG', nameZh:'阻力', fact:'air pushing back against the plane, slowing it down.', factZh:'空气向后推飞机，让它慢下来。', px:196,py:418,
       line:"I'm Drag — air pushing back to slow us down!", lineZh:'我是阻力，空气往后推让我慢下来！', lineKey:'forces_3'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  gear(){
    const part=partSVG({name:'Landing gear', nameZh:'起落架', fact:'the wheels that come DOWN for takeoff and landing, and fold UP in the air.', factZh:'就是轮子，起飞和降落时放下，在空中收起。', px:500,py:330,
      line:"I'm the Wheels — I come down for takeoff and landing!", lineZh:'我是起落架，起飞降落时放下来！', lineKey:'gear_0'});
    return svgWrap(part + capSVG('Wheels DOWN for takeoff & landing','500','640','#2b2d42','middle',18));
  },
  takeoff(){
    const speed=[250,300,350].map((y,i)=>`<line class="spd ${i===1?'b':i===2?'c':''}" x1="60" y1="${y}" x2="150" y2="${y}" stroke="#3a86ff" stroke-width="6" stroke-linecap="round"/>`).join('');
    const liftPart=partSVG({name:'Lift', nameZh:'升力', fact:'when lift is stronger than weight, the plane rises into the sky.', factZh:'当升力大于重力时，飞机就升上天空。', px:480,py:270,
      line:"I'm Lift — when I'm stronger than weight, the plane takes off!", lineZh:'我是升力，当我比重力大，飞机就起飞啦！', lineKey:'takeoff_0'});
    return svgWrap(speed+liftPart+capSVG('Speed up → Lift > Weight → TAKEOFF','500','55','#2b6cb0','middle',19));
  },
  cruise(){
    const clouds=`<g class="bob" fill="#fff" opacity=".9"><ellipse cx="180" cy="540" rx="34" ry="18"/><ellipse cx="210" cy="548" rx="26" ry="14"/><ellipse cx="820" cy="560" rx="30" ry="16"/></g>`;
    return svgWrap(clouds+capSVG('Lift = Weight · Thrust = Drag → steady flight','500','55','#2b6cb0','middle',19));
  },
  landing(){
    const desc=`<path class="flow" d="M 540 120 Q 510 350 470 560" fill="none" stroke="#ef476f" stroke-width="7" marker-end="url(#ar)"/>`;
    return svgWrap(desc+capSVG('Slow down → wheels down → gentle touchdown','500','55','#2b6cb0','middle',19));
  },
};
