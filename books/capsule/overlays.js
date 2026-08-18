/* ============================================================
   Return Capsule book interactive SVG overlays (BUBBLE-MODE hotspots, v2).
   viewBox 1000x667, uses shared/overlays.js helpers.
   Image pixels 1216x832 (shared/overlays.js converts).
   Every hotspot carries line + lineZh (first-person speech) + lineKey.
   No leader lines / SVG labels. Coordinates calibrated with GLM vision.
   The v1 'Heat' arrow in cp_heatshield overlapped the Friction-glow hotspot
   (10px apart) and was merged into it (redundant pointer to the same fire).
   ============================================================ */
window.OVL = {
  cp_parts: () => svgWrap(
    partSVG({px:608,py:360,name:'Parachute bay',nameZh:'伞舱',fact:'where the parachute hides on top',factZh:'顶部藏降落伞的地方',
      line:"I'm the parachute bay — the parachute hides inside me on top!", lineZh:'我是伞舱，降落伞藏在我顶上！', lineKey:'cp_parts_0'}) +
    partSVG({px:608,py:430,name:'Capsule body',nameZh:'返回舱体',fact:'the bell-shaped ship',factZh:'钟形的小飞船',
      line:"I'm the capsule body — a bell-shaped little ship!", lineZh:'我是返回舱体，钟形的小飞船！', lineKey:'cp_parts_1'}) +
    partSVG({px:608,py:499,name:'Window',nameZh:'舷窗',fact:'the round window to see outside',factZh:'看外面的圆窗',
      line:"I'm the window — the round window to see outside!", lineZh:'我是舷窗，看外面的圆窗！', lineKey:'cp_parts_2'}) +
    partSVG({px:608,py:665,name:'Heat shield',nameZh:'防热盾',fact:'the thick bottom that takes the heat',factZh:'底部厚厚的挡热层',
      line:"I'm the heat shield — the thick bottom that takes the heat!", lineZh:'我是防热盾，底部厚厚的挡热层！', lineKey:'cp_parts_3'})
  ),
  cp_layers: () => svgWrap(
    partSVG({px:608,py:690,name:'Heat shield',nameZh:'防热盾',fact:'the black outside that takes the heat first',factZh:'黑色的最外层，先挡住热量',
      line:"I'm the heat shield — the black outside that takes the heat first!", lineZh:'我是防热盾，黑色最外层先挡热！', lineKey:'cp_layers_0'}) +
    partSVG({px:608,py:545,name:'Ablative layer',nameZh:'烧蚀层',fact:'the brown layer that burns away slowly',factZh:'棕色的中间层，会慢慢烧掉',
      line:"I'm the ablative layer — the brown layer that burns away slowly!", lineZh:'我是烧蚀层，棕色中间层慢慢烧掉！', lineKey:'cp_layers_1'}) +
    partSVG({px:608,py:400,name:'Pressure hull',nameZh:'金属舱壁',fact:'the silver wall that keeps the cabin safe',factZh:'保护舱内安全的银色舱壁',
      line:"I'm the pressure hull — the silver wall keeping the cabin safe!", lineZh:'我是金属舱壁，保护舱内安全的银色壁！', lineKey:'cp_layers_2'})
  ),
  cp_heatshield: () => svgWrap(
    partSVG({px:670,py:560,name:'Heat shield',nameZh:'防热盾',fact:'takes the heat and gets charred',factZh:'挡下热量，被烧得焦黑',
      line:"I'm the heat shield — I take the heat and get charred!", lineZh:'我是防热盾，挡下热量被烧焦！', lineKey:'cp_heatshield_0'}) +
    partSVG({px:470,py:430,name:'Friction glow',nameZh:'摩擦火焰',fact:'the fire made by rubbing against air',factZh:'和空气摩擦产生的火焰',
      line:"I'm the friction glow — the fire from rubbing the air!", lineZh:'我是摩擦火焰，和空气摩擦生的火！', lineKey:'cp_heatshield_1'})
  ),
  cp_cabin: () => svgWrap(
    partSVG({px:334,py:374,name:'Window',nameZh:'舷窗',fact:'the round window showing the sky',factZh:'能看到天空的圆窗',
      line:"I'm the window — the round window showing the sky!", lineZh:'我是舷窗，能看到天空的圆窗！', lineKey:'cp_cabin_0'}) +
    partSVG({px:334,py:478,name:'Control panel',nameZh:'控制面板',fact:'buttons that help fly the capsule',factZh:'帮助驾驶返回舱的按钮面板',
      line:"I'm the control panel — buttons that help fly the capsule!", lineZh:'我是控制面板，帮助驾驶返回舱的按钮！', lineKey:'cp_cabin_1'}) +
    partSVG({px:638,py:540,name:'Astronaut',nameZh:'航天员',fact:'the person who rides home',factZh:'坐着回家的人',
      line:"I'm the astronaut — the person riding home!", lineZh:'我是航天员，坐着回家的人！', lineKey:'cp_cabin_2'}) +
    partSVG({px:608,py:630,name:'Seat',nameZh:'座椅',fact:'a soft seat with straps',factZh:'带安全带的小座椅',
      line:"I'm the seat — a soft seat with straps!", lineZh:'我是座椅，带安全带的小座椅！', lineKey:'cp_cabin_3'})
  ),
  cp_parachute: () => svgWrap(
    partSVG({px:608,py:170,name:'Dome cover',nameZh:'穹顶盖',fact:'the round lid of the parachute bay',factZh:'伞舱的圆盖子',
      line:"I'm the dome cover — the round lid of the parachute bay!", lineZh:'我是穹顶盖，伞舱的圆盖子！', lineKey:'cp_parachute_0'}) +
    partSVG({px:608,py:330,name:'Parachute bay',nameZh:'伞舱',fact:'the bay where the parachute hides',factZh:'藏着降落伞的舱室',
      line:"I'm the parachute bay — where the parachute hides!", lineZh:'我是伞舱，藏着降落伞的舱室！', lineKey:'cp_parachute_1'}) +
    partSVG({px:608,py:430,name:'Main parachute',nameZh:'主伞',fact:'the big orange-and-white parachute',factZh:'橙白相间的大降落伞',
      line:"I'm the main parachute — big orange-and-white!", lineZh:'我是主伞，橙白相间的大降落伞！', lineKey:'cp_parachute_2'}) +
    partSVG({px:608,py:495,name:'Pilot chute',nameZh:'引导伞',fact:'the little chute that pulls out the big one',factZh:'把大伞拉出来的小伞',
      line:"I'm the pilot chute — I pull out the big parachute!", lineZh:'我是引导伞，把大伞拉出来的小伞！', lineKey:'cp_parachute_3'})
  ),
  cp_retro: () => svgWrap(
    partSVG({px:608,py:470,name:'Retro rockets',nameZh:'反推火箭',fact:'small rockets that fire down to land softly',factZh:'向下点火让着陆变轻柔的小火箭',
      line:"I'm retro rockets — I fire down to land softly!", lineZh:'我是反推火箭，向下点火让着陆轻柔！', lineKey:'cp_retro_0'}) +
    partSVG({px:608,py:560,name:'Exhaust',nameZh:'喷焰',fact:'the fire shooting down',factZh:'向下喷出的火焰',
      line:"I'm the exhaust — the fire shooting down!", lineZh:'我是喷焰，向下喷出的火焰！', lineKey:'cp_retro_1'})
  ),
  cp_window: () => svgWrap(
    partSVG({px:530,py:390,name:'Window',nameZh:'舷窗',fact:'the round window to the outside',factZh:'通往外面的圆窗',
      line:"I'm the window — the round window to the outside!", lineZh:'我是舷窗，通往外面的圆窗！', lineKey:'cp_window_0'}) +
    partSVG({px:480,py:430,name:'Earth',nameZh:'地球',fact:'our blue home planet',factZh:'我们蓝色的家园星球',
      line:"I'm Earth — our blue home planet!", lineZh:'我是地球，我们蓝色的家园星球！', lineKey:'cp_window_1'}) +
    partSVG({px:851,py:499,name:'Astronaut',nameZh:'航天员',fact:'looking out at Earth',factZh:'望着地球的航天员',
      line:"I'm the astronaut — looking out at Earth!", lineZh:'我是航天员，望着地球的航天员！', lineKey:'cp_window_2'})
  ),
  cp_dock: () => svgWrap(
    partSVG({px:547,py:374,name:'Capsule',nameZh:'返回舱',fact:'the little ship coming home',factZh:'回家的那艘小飞船',
      line:"I'm the capsule — the little ship coming home!", lineZh:'我是返回舱，回家的那艘小飞船！', lineKey:'cp_dock_0'}) +
    partSVG({px:730,py:458,name:'Docking port',nameZh:'对接端口',fact:'the door where the capsule connects',factZh:'返回舱连接上的舱门',
      line:"I'm the docking port — the door where the capsule connects!", lineZh:'我是对接端口，返回舱连上的舱门！', lineKey:'cp_dock_1'}) +
    partSVG({px:851,py:333,name:'Space station',nameZh:'空间站',fact:'the big home in space',factZh:'太空中的大家园',
      line:"I'm the space station — the big home in space!", lineZh:'我是空间站，太空中的大家园！', lineKey:'cp_dock_2'}) +
    partSVG({px:182,py:250,name:'Solar panel',nameZh:'太阳能板',fact:'turns sunlight into power',factZh:'把阳光变成电',
      line:"I'm a solar panel — I turn sunlight into power!", lineZh:'我是太阳能板，把阳光变成电！', lineKey:'cp_dock_3'})
  ),
  cp_reentry: () => svgWrap(
    partSVG({px:547,py:458,name:'Capsule',nameZh:'返回舱',fact:'plunging back to Earth',factZh:'冲回地球的返回舱',
      line:"I'm the capsule — plunging back to Earth!", lineZh:'我是返回舱，冲回地球的返回舱！', lineKey:'cp_reentry_0'}) +
    partSVG({px:547,py:570,name:'Heat shield',nameZh:'防热盾',fact:'facing the fire head-on',factZh:'直面火焰的防热盾',
      line:"I'm the heat shield — facing the fire head-on!", lineZh:'我是防热盾，直面火焰的防热盾！', lineKey:'cp_reentry_1'}) +
    partSVG({px:640,py:320,name:'Plasma fire',nameZh:'等离子火焰',fact:'the giant fireball of reentry',factZh:'再入时巨大的火球',
      line:"I'm the plasma fire — the giant fireball of reentry!", lineZh:'我是等离子火焰，再入时巨大的火球！', lineKey:'cp_reentry_2'})
  ),
  cp_parachute_open: () => svgWrap(
    partSVG({px:608,py:330,name:'Parachute',nameZh:'降落伞',fact:'the giant umbrella that slows the fall',factZh:'让下降变慢的巨伞',
      line:"I'm the parachute — the giant umbrella that slows the fall!", lineZh:'我是降落伞，让下降变慢的巨伞！', lineKey:'cp_parachute_open_0'}) +
    partSVG({px:608,py:516,name:'Capsule',nameZh:'返回舱',fact:'swinging gently beneath the chute',factZh:'在伞下轻轻摇晃的返回舱',
      line:"I'm the capsule — swinging gently beneath the chute!", lineZh:'我是返回舱，在伞下轻轻摇晃！', lineKey:'cp_parachute_open_1'}) +
    partSVG({px:608,py:690,name:'Meadow',nameZh:'草地',fact:'the green landing spot below',factZh:'下面绿色的着陆点',
      line:"I'm the meadow — the green landing spot below!", lineZh:'我是草地，下面绿色的着陆点！', lineKey:'cp_parachute_open_2'})
  ),
  cp_landing: () => svgWrap(
    partSVG({px:547,py:499,name:'Capsule',nameZh:'返回舱',fact:'resting safely on the grass',factZh:'安全停在草地上',
      line:"I'm the capsule — resting safely on the grass!", lineZh:'我是返回舱，安全停在草地上！', lineKey:'cp_landing_0'}) +
    partSVG({px:815,py:516,name:'Astronaut',nameZh:'航天员',fact:'waving hello to Earth',factZh:'向地球挥手问好',
      line:"I'm the astronaut — waving hello to Earth!", lineZh:'我是航天员，向地球挥手问好！', lineKey:'cp_landing_1'}) +
    partSVG({px:997,py:505,name:'Rescue team',nameZh:'救援队',fact:'running to welcome the astronauts',factZh:'跑来迎接航天员的救援队',
      line:"We're the rescue team — running to welcome the astronauts!", lineZh:'我们是救援队，跑来迎接航天员！', lineKey:'cp_landing_2'}) +
    partSVG({px:547,py:700,name:'Landing site',nameZh:'着陆点',fact:'the soft green landing spot',factZh:'柔软的绿色着陆点',
      line:"I'm the landing site — the soft green spot!", lineZh:'我是着陆点，柔软的绿色着陆点！', lineKey:'cp_landing_3'})
  ),
  cp_vocab: () => svgWrap(
    partSVG({px:365,py:349,name:'Heat shield',nameZh:'防热盾',fact:'takes the heat on the way down',factZh:'下降时挡住热量',
      line:"I'm the heat shield — I take the heat on the way down!", lineZh:'我是防热盾，下降时挡住热量！', lineKey:'cp_vocab_0'}) +
    partSVG({px:268,py:557,name:'Parachute',nameZh:'降落伞',fact:'the big umbrella that slows the fall',factZh:'让下降变慢的大伞',
      line:"I'm the parachute — the big umbrella that slows the fall!", lineZh:'我是降落伞，让下降变慢的大伞！', lineKey:'cp_vocab_1'}) +
    partSVG({px:268,py:682,name:'Seat',nameZh:'座椅',fact:'where astronauts strap in',factZh:'航天员系安全带的地方',
      line:"I'm the seat — where astronauts strap in!", lineZh:'我是座椅，航天员系安全带的地方！', lineKey:'cp_vocab_2'}) +
    partSVG({px:669,py:458,name:'Return capsule',nameZh:'返回舱',fact:'the little ship that brings astronauts home',factZh:'带航天员回家的小飞船',
      line:"I'm the return capsule — the little ship bringing astronauts home!", lineZh:'我是返回舱，带航天员回家的小飞船！', lineKey:'cp_vocab_3'}) +
    partSVG({px:973,py:191,name:'Retro rocket',nameZh:'反推火箭',fact:'fires down to land softly',factZh:'向下点火让着陆更轻柔',
      line:"I'm the retro rocket — I fire down to land softly!", lineZh:'我是反推火箭，向下点火让着陆轻柔！', lineKey:'cp_vocab_4'}) +
    partSVG({px:997,py:591,name:'Window',nameZh:'舷窗',fact:'the round window to see outside',factZh:'看外面的圆窗',
      line:"I'm the window — the round window to see outside!", lineZh:'我是舷窗，看外面的圆窗！', lineKey:'cp_vocab_5'}) +
    partSVG({px:973,py:674,name:'Docking ring',nameZh:'对接环',fact:'connects to the space station',factZh:'和空间站连接的部分',
      line:"I'm the docking ring — I connect to the space station!", lineZh:'我是对接环，和空间站连接的部分！', lineKey:'cp_vocab_6'})
  )
};
