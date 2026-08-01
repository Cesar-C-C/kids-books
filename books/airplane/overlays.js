/* Airplane overlays — returns SVG strings, keyed into OVL */
window.OVL = {
  overview(){
    const parts=[
      {name:'Tail', nameZh:'尾翼', fact:'keeps the plane steady and helps it turn left or right.', factZh:'让飞机保持平稳，并帮助它左右转弯。', px:229,py:230, lx:120,ly:80, anc:'start'},
      {name:'Fuselage', nameZh:'机身', fact:'the long body that carries pilots, passengers and bags.', factZh:'长长的机身，载着飞行员、乘客和行李。', px:580,py:310, lx:500,ly:60, anc:'middle'},
      {name:'Cockpit', nameZh:'驾驶舱', fact:'the front room where the pilots fly the plane.', factZh:'飞机最前面的驾驶舱，飞行员在这里开飞机。', px:785,py:318, lx:900,ly:80, anc:'end'},
      {name:'Wing', nameZh:'机翼', fact:'makes LIFT — the upward push that holds the plane in the sky.', factZh:'产生升力——把飞机托在空中的向上力量。', px:204,py:351, lx:120,ly:620, anc:'start'},
      {name:'Engine', nameZh:'引擎', fact:'burns fuel and pushes air BACK to make THRUST (forward push).', factZh:'燃烧燃料、把空气向后推，从而产生推力（向前的力量）。', px:503,py:431, lx:500,ly:640, anc:'middle'},
      {name:'Landing gear', nameZh:'起落架', fact:'the wheels that come DOWN for takeoff and landing, and fold UP in the air.', factZh:'就是轮子，起飞和降落时放下，在空中收起。', px:783,py:443, lx:880,ly:620, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  fuselage(){
    const parts=[
      {name:'Cockpit', nameZh:'驾驶舱', fact:'the front room where pilots fly the plane.', factZh:'飞机最前面的驾驶舱，飞行员在这里开飞机。', px:180,py:329, lx:80,ly:80, anc:'start'},
      {name:'Cabin', nameZh:'客舱', fact:'where passengers sit (above the floor).', factZh:'乘客坐的地方（在地板上层）。', px:500,py:309, lx:500,ly:60, anc:'middle'},
      {name:'Cargo hold', nameZh:'货舱', fact:'the space below the floor for bags and boxes.', factZh:'地板下面装行李和箱子的空间。', px:752,py:310, lx:900,ly:80, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  wing(){
    const parts=[
      {name:'Wing', nameZh:'机翼', fact:'the big surface that holds the plane up in the air.', factZh:'把飞机托在空中的巨大翼面。', px:420,py:350, lx:120,ly:120, anc:'start'},
      {name:'Aileron', nameZh:'副翼', fact:'a small hinged flap on the back edge that helps the plane roll and turn.', factZh:'机翼后缘的小襟翼，帮助飞机滚转和转弯。', px:720,py:370, lx:880,ly:620, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  lift(){
    const top=['M70,185 Q300,245 500,210 T930,185','M70,215 Q300,270 500,240 T930,215','M70,150 Q300,225 500,185 T930,150'];
    const bot=['M70,420 L930,420','M70,445 L930,445','M70,470 L930,470'];
    const flows=top.map(d=>`<path class="flow" d="${d}" fill="none" stroke="#2a9d8f" stroke-width="4" marker-end="url(#agrn)"/>`).join('')
      + bot.map(d=>`<path class="flow" d="${d}" fill="none" stroke="#ef476f" stroke-width="4" marker-end="url(#ar)"/>`).join('');
    const wing=`<path d="M90,330 Q300,245 500,230 Q700,245 910,330 Q700,410 500,420 Q300,410 90,330" fill="none" stroke="#8a96a3" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>`;
    const arrow=`<g class="pulse"><line x1="500" y1="330" x2="500" y2="115" stroke="#2a9d8f" stroke-width="8" marker-end="url(#agrn)"/>
      <text x="535" y="150" class="cap" fill="#2a9d8f" style="font-size:24px">LIFT</text></g>`;
    const caps=capSVG('Fast air on top → LOW pressure','500','65','#2a9d8f','middle',19)
      + capSVG('Slow air below → HIGH pressure','500','535','#ef476f','middle',19)
      + capSVG('streamlined wing (airfoil)','500','625','#6c757d','middle',16);
    return svgWrap(flows+wing+arrow+caps);
  },
  tail(){
    const highlight=`<rect x="515" y="170" width="75" height="195" rx="6" fill="#ef476f" opacity="0.15" stroke="#ef476f" stroke-width="2" stroke-dasharray="5 3"/>`;
    const parts=[
      {name:'Rudder', nameZh:'方向舵', fact:'moves side to side to turn the plane left or right.', factZh:'左右摆动，让飞机向左或向右转。', px:555,py:265, lx:850,ly:95, anc:'end'},
      {name:'Elevator', nameZh:'升降舵', fact:'moves up and down to tip the nose up or down.', factZh:'上下摆动，让机头上仰或下俯。', px:720,py:400, lx:850,ly:600, anc:'start'},
      {name:'Tail', nameZh:'尾翼', fact:'the tail assembly keeps the plane steady in the air.', factZh:'尾翼让飞机在空中保持平稳。', px:480,py:260, lx:500,ly:648, anc:'middle'},
    ];
    return svgWrap(highlight+parts.map(partSVG).join('')
      + capSVG('turn left / right','850','120','#ef476f','end',15)
      + capSVG('nose up / down','70','625','#2a9d8f','start',15));
  },
  engine(){
    const part=partSVG({name:'Engine', nameZh:'引擎', fact:'sucks in air, burns fuel, and shoots hot air BACK to make THRUST.', factZh:'吸入空气、燃烧燃料，把热气向后喷出产生推力。', px:500,py:330, lx:500,ly:52, anc:'middle'});
    const air=`<g fill="#3a86ff"><circle class="p-in" cx="250" cy="330" r="7"/><circle class="p-in b" cx="250" cy="305" r="7"/><circle class="disable"/><circle class="p-in c" cx="250" cy="355" r="7"/></g>`;
    const exhaust=`<g fill="#ef476f"><circle class="p-out" cx="650" cy="330" r="7"/><circle class="p-out b" cx="650" cy="305" r="7"/><circle class="p-out c" cx="650" cy="355" r="7"/></g>`;
    const thrust=`<g class="pulse"><line x1="700" y1="330" x2="880" y2="330" stroke="#2a9d8f" stroke-width="8" marker-end="url(#agrn)"/>
      <text x="790" y="410" text-anchor="middle" class="cap" fill="#2a9d8f" style="font-size:20px">THRUST →</text></g>`;
    const caps=capSVG('1 Air in','200','300','#3a86ff','start',16)
      + capSVG('2 Burn fuel','500','170','#f4a261','middle',16)
      + capSVG('3 Hot air out','700','290','#ef476f','start',16);
    return svgWrap(part+air+exhaust+thrust+caps);
  },
  forces(){
    const arrows=[
      {name:'LIFT', nameZh:'升力', fact:'the upward push from the wings that holds the plane up.', factZh:'机翼产生的向上推力，把飞机托起来。', x1:500,y1:250,x2:500,y2:110, col:'#2a9d8f', mk:'agrn', tx:500,ty:92, anc:'middle'},
      {name:'WEIGHT', nameZh:'重力', fact:'gravity pulling the plane down toward the ground.', factZh:'重力把飞机往地面拉。', x1:575,y1:430,x2:575,y2:575, col:'#6c757d', mk:'ag', tx:575,ty:600, anc:'middle'},
      {name:'THRUST', nameZh:'推力', fact:'the forward push from the engines.', factZh:'引擎产生的向前推力。', x1:660,y1:335,x2:870,y2:335, col:'#ef476f', mk:'ar', tx:882,ty:330, anc:'start'},
      {name:'DRAG', nameZh:'阻力', fact:'air pushing back against the plane, slowing it down.', factZh:'空气向后推飞机，让它慢下来。', x1:360,y1:335,x2:170,y2:335, col:'#f4a261', mk:'ao', tx:158,ty:330, anc:'end'},
    ];
    return svgWrap(arrows.map(arrowSVG).join(''));
  },
  gear(){
    const part=partSVG({name:'Landing gear', nameZh:'起落架', fact:'the wheels that come DOWN for takeoff and landing, and fold UP in the air.', factZh:'就是轮子，起飞和降落时放下，在空中收起。', px:500,py:330, lx:500,ly:52, anc:'middle'});
    return svgWrap(part + capSVG('Wheels DOWN for takeoff & landing','500','640','#2b2d42','middle',18));
  },
  takeoff(){
    const speed=[250,300,350].map((y,i)=>`<line class="spd ${i===1?'b':i===2?'c':''}" x1="60" y1="${y}" x2="150" y2="${y}" stroke="#3a86ff" stroke-width="6" stroke-linecap="round"/>`).join('');
    const lift=`<g class="pulse"><line x1="540" y1="380" x2="540" y2="180" stroke="#2a9d8f" stroke-width="8" marker-end="url(#agrn)"/>
      <text x="580" y="240" class="cap" fill="#2a9d8f" style="font-size:22px">LIFT ↑</text></g>`;
    return svgWrap(speed+lift+capSVG('Speed up → Lift > Weight → TAKEOFF','500','55','#2b6cb0','middle',19));
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
