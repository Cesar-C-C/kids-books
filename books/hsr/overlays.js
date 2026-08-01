/* ============================================================
   High-Speed Rail (HSR) book interactive SVG overlays
   viewBox 1000x667, uses shared/overlays.js helpers
   ============================================================ */
window.OVL = {
  hsr_cover: () => svgWrap(
    partSVG({px:520,py:400,lx:820,ly:400,anc:'start',name:'High-speed train',nameZh:'高铁',fact:'a super-fast train',factZh:'一种超级快的火车'}) +
    partSVG({px:500,py:560,lx:200,ly:560,anc:'end',name:'Track',nameZh:'铁轨',fact:'keeps the train on course',factZh:'让火车沿着路线跑'}) +
    partSVG({px:860,py:120,lx:920,ly:150,anc:'start',name:'Sun',nameZh:'太阳',fact:'shines on the journey',factZh:'照亮旅程'})
  ),
  hsr_02: () => svgWrap(
    partSVG({px:360,py:500,lx:180,ly:500,anc:'end',name:'Train',nameZh:'高铁',fact:'waiting at the station',factZh:'在车站等待'}) +
    partSVG({px:720,py:520,lx:920,ly:520,anc:'start',name:'Passengers',nameZh:'乘客',fact:'ready to board',factZh:'准备上车'}) +
    partSVG({px:120,py:220,lx:120,ly:260,anc:'middle',name:'Station',nameZh:'车站',fact:'a modern platform',factZh:'现代化的站台'})
  ),
  hsr_03: () => svgWrap(
    partSVG({px:260,py:540,lx:120,ly:540,anc:'end',name:'Streamlined nose',nameZh:'流线型车头',fact:'cuts through the wind',factZh:'能切开风'}) +
    partSVG({px:160,py:320,lx:120,ly:320,anc:'end',name:'Wind',nameZh:'风',fact:'slides over the smooth shape',factZh:'沿着光滑外形滑过'}) +
    partSVG({px:360,py:300,lx:120,ly:300,anc:'end',name:'Window',nameZh:'车窗',fact:'driver looks ahead',factZh:'司机向前看'})
  ),
  hsr_04: () => svgWrap(
    partSVG({px:410,py:340,lx:120,ly:340,anc:'end',name:'Passengers',nameZh:'乘客',fact:'sit comfortably inside',factZh:'舒适地坐在里面'}) +
    partSVG({px:590,py:270,lx:900,ly:270,anc:'start',name:'Carriage',nameZh:'车厢',fact:'a long connected room',factZh:'一节长长的连接房间'}) +
    partSVG({px:400,py:420,lx:120,ly:420,anc:'end',name:'Seats',nameZh:'座椅',fact:'soft chairs for riders',factZh:'给乘客坐的软椅'})
  ),
  hsr_05: () => svgWrap(
    partSVG({px:320,py:520,lx:120,ly:520,anc:'end',name:'Track',nameZh:'铁轨',fact:'steel rails for wheels',factZh:'给车轮跑的钢轨'}) +
    partSVG({px:660,py:460,lx:900,ly:460,anc:'start',name:'Train',nameZh:'高铁',fact:'runs on two rails',factZh:'在两条轨道上跑'}) +
    partSVG({px:180,py:220,lx:120,ly:220,anc:'end',name:'Fields',nameZh:'田野',fact:'green land beside the track',factZh:'轨道旁的绿色大地'})
  ),
  hsr_06: () => svgWrap(
    partSVG({px:500,py:130,lx:780,ly:130,anc:'start',name:'Pantograph',nameZh:'受电弓',fact:'collects electricity',factZh:'收集电力'}) +
    partSVG({px:520,py:120,lx:220,ly:120,anc:'end',name:'Overhead wire',nameZh:'电线',fact:'carries electric power',factZh:'输送电力'}) +
    partSVG({px:500,py:450,lx:820,ly:450,anc:'start',name:'Train body',nameZh:'车身',fact:'uses the power to move',factZh:'用电力前进'})
  ),
  hsr_07: () => svgWrap(
    partSVG({px:320,py:470,lx:120,ly:470,anc:'end',name:'Wheels',nameZh:'车轮',fact:'turned by electric motors',factZh:'由电动机带动'}) +
    partSVG({px:190,py:340,lx:120,ly:340,anc:'end',name:'Lightning',nameZh:'电',fact:'electric energy in motion',factZh:'运动中的电能'}) +
    partSVG({px:800,py:310,lx:920,ly:310,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'a dark mountain passage',factZh:'穿山的黑暗通道'})
  ),
  hsr_08: () => svgWrap(
    partSVG({px:350,py:430,lx:120,ly:430,anc:'end',name:'Bridge',nameZh:'桥梁',fact:'crosses over the river',factZh:'横跨河流'}) +
    partSVG({px:430,py:545,lx:120,ly:545,anc:'end',name:'River',nameZh:'河流',fact:'flows under the bridge',factZh:'在桥下流淌'}) +
    partSVG({px:780,py:350,lx:920,ly:350,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'goes through the mountain',factZh:'穿过山体'})
  ),
  hsr_09: () => svgWrap(
    partSVG({px:420,py:480,lx:160,ly:480,anc:'end',name:'Train',nameZh:'高铁',fact:'coming out of the tunnel',factZh:'从隧道里出来'}) +
    partSVG({px:720,py:420,lx:900,ly:420,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'a hole through the mountain',factZh:'穿过山体的洞'}) +
    partSVG({px:800,py:220,lx:920,ly:220,anc:'start',name:'Mountains',nameZh:'大山',fact:'train goes right through',factZh:'火车直接穿过去'})
  ),
  hsr_10: () => svgWrap(
    partSVG({px:320,py:360,lx:120,ly:360,anc:'end',name:'Driver',nameZh:'司机',fact:'steers the train safely',factZh:'安全驾驶火车'}) +
    partSVG({px:620,py:500,lx:860,ly:500,anc:'start',name:'Control panel',nameZh:'控制台',fact:'buttons and screens',factZh:'按钮和屏幕'}) +
    partSVG({px:760,py:240,lx:920,ly:240,anc:'start',name:'Front window',nameZh:'前窗',fact:'sees the track ahead',factZh:'看到前方轨道'})
  ),
  hsr_11: () => svgWrap(
    partSVG({px:520,py:380,lx:220,ly:380,anc:'end',name:'Train',nameZh:'高铁',fact:'races really fast',factZh:'跑得飞快'}) +
    partSVG({px:780,py:580,lx:920,ly:580,anc:'start',name:'Speedometer',nameZh:'速度表',fact:'shows how fast it goes',factZh:'显示速度有多快'}) +
    partSVG({px:880,py:160,lx:920,ly:160,anc:'start',name:'Cloud',nameZh:'云朵',fact:'the train almost catches it',factZh:'火车差点追上它'})
  ),
  hsr_12: () => svgWrap(
    partSVG({px:650,py:420,lx:880,ly:420,anc:'start',name:'Train',nameZh:'高铁',fact:'all parts work together',factZh:'所有部件一起工作'}) +
    partSVG({px:220,py:380,lx:120,ly:380,anc:'end',name:'Bridge',nameZh:'桥梁',fact:'crosses water',factZh:'跨越水面'}) +
    partSVG({px:320,py:180,lx:120,ly:180,anc:'end',name:'Pantograph',nameZh:'受电弓',fact:'brings power',factZh:'带来电力'})
  )
};
