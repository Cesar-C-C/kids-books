/* ============================================================
   High-Speed Rail (HSR) book interactive SVG overlays (BUBBLE-MODE hotspots, v2).
   viewBox 1000x667, uses shared/overlays.js helpers.
   Image pixels 1216x832 (shared/overlays.js converts).
   Every hotspot carries line + lineZh (first-person speech) + lineKey.
   No leader lines / SVG labels. Coordinates calibrated with GLM vision.
   ============================================================ */
window.OVL = {
  hsr_02: () => svgWrap(
    partSVG({px:410,py:500,name:'Train',nameZh:'高铁',fact:'waiting at the station',factZh:'在车站等待',
      line:"I'm the high-speed train — waiting at the station!", lineZh:'我是高铁，正在车站等着呢！', lineKey:'hsr_02_0'}) +
    partSVG({px:720,py:520,name:'Passengers',nameZh:'乘客',fact:'ready to board',factZh:'准备上车',
      line:"We're passengers — ready to hop aboard!", lineZh:'我们是乘客，准备好上车啦！', lineKey:'hsr_02_1'}) +
    partSVG({px:120,py:220,name:'Station',nameZh:'车站',fact:'a modern platform',factZh:'现代化的站台',
      line:"I'm the station — a bright modern platform!", lineZh:'我是车站，明亮的现代化站台！', lineKey:'hsr_02_2'})
  ),
  hsr_03: () => svgWrap(
    partSVG({px:260,py:540,name:'Streamlined nose',nameZh:'流线型车头',fact:'cuts through the wind',factZh:'能切开风',
      line:"I'm the streamlined nose — I cut through the wind!", lineZh:'我是流线型车头，我能切开风！', lineKey:'hsr_03_0'}) +
    partSVG({px:160,py:320,name:'Wind',nameZh:'风',fact:'slides over the smooth shape',factZh:'沿着光滑外形滑过',
      line:"I'm the Wind — I slide over the smooth nose!", lineZh:'我是风，顺着光滑的车头滑过！', lineKey:'hsr_03_1'}) +
    partSVG({px:360,py:300,name:'Window',nameZh:'车窗',fact:'driver looks ahead',factZh:'司机向前看',
      line:"I'm the window — the driver watches ahead through me!", lineZh:'我是车窗，司机透过我看前方！', lineKey:'hsr_03_2'})
  ),
  hsr_04: () => svgWrap(
    partSVG({px:430,py:340,name:'Passengers',nameZh:'乘客',fact:'sit comfortably inside',factZh:'舒适地坐在里面',
      line:"We're passengers — sitting comfy inside!", lineZh:'我们是乘客，舒舒服服坐在里面！', lineKey:'hsr_04_0'}) +
    partSVG({px:590,py:240,name:'Carriage',nameZh:'车厢',fact:'a long connected room',factZh:'一节长长的连接房间',
      line:"I'm a carriage — a long room on wheels!", lineZh:'我是车厢，带轮子的长房间！', lineKey:'hsr_04_1'}) +
    partSVG({px:550,py:460,name:'Seats',nameZh:'座椅',fact:'soft chairs for riders',factZh:'给乘客坐的软椅',
      line:"We're seats — soft chairs for riders!", lineZh:'我们是座椅，给乘客坐的软椅子！', lineKey:'hsr_04_2'})
  ),
  hsr_05: () => svgWrap(
    partSVG({px:320,py:520,name:'Track',nameZh:'铁轨',fact:'steel rails for wheels',factZh:'给车轮跑的钢轨',
      line:"I'm the track — steel rails for the wheels!", lineZh:'我是铁轨，给车轮跑的钢轨！', lineKey:'hsr_05_0'}) +
    partSVG({px:660,py:460,name:'Train',nameZh:'高铁',fact:'runs on two rails',factZh:'在两条轨道上跑',
      line:"I'm the train — I run on two rails!", lineZh:'我是高铁，在两条轨道上跑！', lineKey:'hsr_05_1'}) +
    partSVG({px:380,py:220,name:'Fields',nameZh:'田野',fact:'green land beside the track',factZh:'轨道旁的绿色大地',
      line:"I'm the field — green land beside the track!", lineZh:'我是田野，轨道旁的绿色大地！', lineKey:'hsr_05_2'})
  ),
  hsr_06: () => svgWrap(
    partSVG({px:500,py:130,name:'Pantograph',nameZh:'受电弓',fact:'collects electricity',factZh:'收集电力',
      line:"I'm the pantograph — I collect electricity!", lineZh:'我是受电弓，我收集电力！', lineKey:'hsr_06_0'}) +
    partSVG({px:620,py:120,name:'Overhead wire',nameZh:'电线',fact:'carries electric power',factZh:'输送电力',
      line:"I'm the wire — I carry electric power!", lineZh:'我是电线，我输送电力！', lineKey:'hsr_06_1'}) +
    partSVG({px:530,py:450,name:'Train body',nameZh:'车身',fact:'uses the power to move',factZh:'用电力前进',
      line:"I'm the train body — I use the power to move!", lineZh:'我是车身，我用电力前进！', lineKey:'hsr_06_2'})
  ),
  hsr_07: () => svgWrap(
    partSVG({px:400,py:600,name:'Wheels',nameZh:'车轮',fact:'turned by electric motors',factZh:'由电动机带动',
      line:"We're wheels — spun by electric motors!", lineZh:'我们是车轮，由电动机带动！', lineKey:'hsr_07_0'}) +
    partSVG({px:290,py:340,name:'Lightning',nameZh:'电',fact:'electric energy in motion',factZh:'运动中的电能',
      line:"I'm electricity — energy on the move!", lineZh:'我是电，运动中的能量！', lineKey:'hsr_07_1'}) +
    partSVG({px:880,py:310,name:'Tunnel',nameZh:'隧道',fact:'a dark mountain passage',factZh:'穿山的黑暗通道',
      line:"I'm the tunnel — a dark mountain passage!", lineZh:'我是隧道，穿山的黑暗通道！', lineKey:'hsr_07_2'})
  ),
  hsr_08: () => svgWrap(
    partSVG({px:300,py:500,name:'Bridge',nameZh:'桥梁',fact:'crosses over the river',factZh:'横跨河流',
      line:"I'm the bridge — I cross over the river!", lineZh:'我是桥梁，横跨河流！', lineKey:'hsr_08_0'}) +
    partSVG({px:430,py:545,name:'River',nameZh:'河流',fact:'flows under the bridge',factZh:'在桥下流淌',
      line:"I'm the river — I flow under the bridge!", lineZh:'我是河流，在桥下流淌！', lineKey:'hsr_08_1'}) +
    partSVG({px:1000,py:400,name:'Tunnel',nameZh:'隧道',fact:'goes through the mountain',factZh:'穿过山体',
      line:"I'm the tunnel — I go through the mountain!", lineZh:'我是隧道，穿过山体！', lineKey:'hsr_08_2'})
  ),
  hsr_09: () => svgWrap(
    partSVG({px:420,py:480,name:'Train',nameZh:'高铁',fact:'coming out of the tunnel',factZh:'从隧道里出来',
      line:"I'm the train — coming out of the tunnel!", lineZh:'我是高铁，从隧道里出来！', lineKey:'hsr_09_0'}) +
    partSVG({px:820,py:420,name:'Tunnel',nameZh:'隧道',fact:'a hole through the mountain',factZh:'穿过山体的洞',
      line:"I'm the tunnel — a hole through the mountain!", lineZh:'我是隧道，穿过山体的洞！', lineKey:'hsr_09_1'}) +
    partSVG({px:880,py:220,name:'Mountains',nameZh:'大山',fact:'train goes right through',factZh:'火车直接穿过去',
      line:"We're mountains — the train goes right through us!", lineZh:'我们是大山，火车直接从我们身上穿过！', lineKey:'hsr_09_2'})
  ),
  hsr_10: () => svgWrap(
    partSVG({px:300,py:360,name:'Driver',nameZh:'司机',fact:'steers the train safely',factZh:'安全驾驶火车',
      line:"I'm the driver — I steer the train safely!", lineZh:'我是司机，安全驾驶火车！', lineKey:'hsr_10_0'}) +
    partSVG({px:620,py:500,name:'Control panel',nameZh:'控制台',fact:'buttons and screens',factZh:'按钮和屏幕',
      line:"I'm the control panel — buttons and screens!", lineZh:'我是控制台，按钮和屏幕！', lineKey:'hsr_10_1'}) +
    partSVG({px:760,py:200,name:'Front window',nameZh:'前窗',fact:'sees the track ahead',factZh:'看到前方轨道',
      line:"I'm the front window — I see the track ahead!", lineZh:'我是前窗，看到前方轨道！', lineKey:'hsr_10_2'})
  ),
  hsr_11: () => svgWrap(
    partSVG({px:520,py:380,name:'Train',nameZh:'高铁',fact:'races really fast',factZh:'跑得飞快',
      line:"I'm the train — I race really fast!", lineZh:'我是高铁，跑得飞快！', lineKey:'hsr_11_0'}) +
    partSVG({px:800,py:580,name:'Speedometer',nameZh:'速度表',fact:'shows how fast it goes',factZh:'显示速度有多快',
      line:"I'm the speedometer — I show how fast we go!", lineZh:'我是速度表，显示速度有多快！', lineKey:'hsr_11_1'}) +
    partSVG({px:910,py:160,name:'Cloud',nameZh:'云朵',fact:'the train almost catches it',factZh:'火车差点追上它',
      line:"I'm a cloud — the train almost catches me!", lineZh:'我是云朵，火车差点追上我！', lineKey:'hsr_11_2'})
  ),
  hsr_12: () => svgWrap(
    partSVG({px:650,py:420,name:'Train',nameZh:'高铁',fact:'all parts work together',factZh:'所有部件一起工作',
      line:"I'm the train — all my parts work together!", lineZh:'我是高铁，所有部件一起工作！', lineKey:'hsr_12_0'}) +
    partSVG({px:310,py:380,name:'Bridge',nameZh:'桥梁',fact:'crosses water',factZh:'跨越水面',
      line:"I'm the bridge — I cross the water!", lineZh:'我是桥梁，跨越水面！', lineKey:'hsr_12_1'}) +
    partSVG({px:320,py:180,name:'Pantograph',nameZh:'受电弓',fact:'brings power',factZh:'带来电力',
      line:"I'm the pantograph — I bring the power!", lineZh:'我是受电弓，带来电力！', lineKey:'hsr_12_2'})
  )
};
