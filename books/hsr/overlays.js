/* ============================================================
   High-Speed Rail (HSR) book interactive SVG overlays
   viewBox 1000x667, uses shared/overlays.js helpers
   ============================================================ */
window.OVL = {
  hsr_cover: () => svgWrap(
    partSVG({px:520,py:360,lx:820,ly:360,anc:'start',name:'High-speed train',nameZh:'高铁',fact:'a super-fast train',factZh:'一种超级快的火车'}) +
    partSVG({px:120,py:500,lx:120,ly:560,anc:'middle',name:'Track',nameZh:'铁轨',fact:'keeps the train on course',factZh:'让火车沿着路线跑'}) +
    partSVG({px:840,py:100,lx:920,ly:130,anc:'start',name:'Sun',nameZh:'太阳',fact:'shines on the journey',factZh:'照亮旅程'})
  ),
  hsr_02: () => svgWrap(
    partSVG({px:450,py:340,lx:200,ly:340,anc:'end',name:'Train',nameZh:'高铁',fact:'waiting at the station',factZh:'在车站等待'}) +
    partSVG({px:820,py:380,lx:920,ly:410,anc:'start',name:'Passengers',nameZh:'乘客',fact:'ready to board',factZh:'准备上车'}) +
    partSVG({px:120,py:200,lx:120,ly:240,anc:'middle',name:'Station',nameZh:'车站',fact:'a modern platform',factZh:'现代化的站台'})
  ),
  hsr_03: () => svgWrap(
    partSVG({px:520,py:320,lx:800,ly:320,anc:'start',name:'Streamlined nose',nameZh:'流线型车头',fact:'cuts through the wind',factZh:'能切开风'}) +
    partSVG({px:320,py:220,lx:120,ly:220,anc:'end',name:'Wind',nameZh:'风',fact:'slides over the smooth shape',factZh:'沿着光滑外形滑过'}) +
    partSVG({px:560,py:430,lx:800,ly:430,anc:'start',name:'Window',nameZh:'车窗',fact:'driver looks ahead',factZh:'司机向前看'})
  ),
  hsr_04: () => svgWrap(
    partSVG({px:680,py:380,lx:850,ly:380,anc:'start',name:'Passengers',nameZh:'乘客',fact:'sit comfortably inside',factZh:'舒适地坐在里面'}) +
    partSVG({px:280,py:300,lx:120,ly:300,anc:'end',name:'Carriage',nameZh:'车厢',fact:'a long connected room',factZh:'一节长长的连接房间'}) +
    partSVG({px:260,py:480,lx:120,ly:480,anc:'end',name:'Seats',nameZh:'座椅',fact:'soft chairs for riders',factZh:'给乘客坐的软椅'})
  ),
  hsr_05: () => svgWrap(
    partSVG({px:450,py:500,lx:250,ly:500,anc:'end',name:'Track',nameZh:'铁轨',fact:'steel rails for wheels',factZh:'给车轮跑的钢轨'}) +
    partSVG({px:680,py:380,lx:880,ly:380,anc:'start',name:'Train',nameZh:'高铁',fact:'runs on two rails',factZh:'在两条轨道上跑'}) +
    partSVG({px:500,py:220,lx:720,ly:220,anc:'start',name:'Fields',nameZh:'田野',fact:'green land beside the track',factZh:'轨道旁的绿色大地'})
  ),
  hsr_06: () => svgWrap(
    partSVG({px:500,py:230,lx:750,ly:230,anc:'start',name:'Pantograph',nameZh:'受电弓',fact:'collects electricity',factZh:'收集电力'}) +
    partSVG({px:520,py:120,lx:220,ly:120,anc:'end',name:'Overhead wire',nameZh:'电线',fact:'carries electric power',factZh:'输送电力'}) +
    partSVG({px:620,py:440,lx:860,ly:440,anc:'start',name:'Train body',nameZh:'车身',fact:'uses the power to move',factZh:'用电力前进'})
  ),
  hsr_07: () => svgWrap(
    partSVG({px:520,py:420,lx:250,ly:420,anc:'end',name:'Wheels',nameZh:'车轮',fact:'turned by electric motors',factZh:'由电动机带动'}) +
    partSVG({px:280,py:250,lx:120,ly:250,anc:'end',name:'Lightning',nameZh:'电',fact:'electric energy in motion',factZh:'运动中的电能'}) +
    partSVG({px:780,py:200,lx:920,ly:200,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'a dark mountain passage',factZh:'穿山的黑暗通道'})
  ),
  hsr_08: () => svgWrap(
    partSVG({px:480,py:360,lx:220,ly:360,anc:'end',name:'Bridge',nameZh:'桥梁',fact:'crosses over the river',factZh:'横跨河流'}) +
    partSVG({px:480,py:560,lx:220,ly:560,anc:'end',name:'River',nameZh:'河流',fact:'flows under the bridge',factZh:'在桥下流淌'}) +
    partSVG({px:820,py:280,lx:920,ly:310,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'goes through the mountain',factZh:'穿过山体'})
  ),
  hsr_09: () => svgWrap(
    partSVG({px:520,py:420,lx:220,ly:420,anc:'end',name:'Train',nameZh:'高铁',fact:'coming out of the tunnel',factZh:'从隧道里出来'}) +
    partSVG({px:680,py:330,lx:820,ly:360,anc:'start',name:'Tunnel',nameZh:'隧道',fact:'a hole through the mountain',factZh:'穿过山体的洞'}) +
    partSVG({px:820,py:150,lx:920,ly:200,anc:'start',name:'Mountains',nameZh:'大山',fact:'train goes right through',factZh:'火车直接穿过去'})
  ),
  hsr_10: () => svgWrap(
    partSVG({px:360,py:360,lx:160,ly:360,anc:'end',name:'Driver',nameZh:'司机',fact:'steers the train safely',factZh:'安全驾驶火车'}) +
    partSVG({px:620,py:500,lx:820,ly:500,anc:'start',name:'Control panel',nameZh:'控制台',fact:'buttons and screens',factZh:'按钮和屏幕'}) +
    partSVG({px:760,py:240,lx:920,ly:240,anc:'start',name:'Front window',nameZh:'前窗',fact:'sees the track ahead',factZh:'看到前方轨道'})
  ),
  hsr_11: () => svgWrap(
    partSVG({px:520,py:360,lx:220,ly:360,anc:'end',name:'Train',nameZh:'高铁',fact:'races really fast',factZh:'跑得飞快'}) +
    partSVG({px:780,py:520,lx:920,ly:520,anc:'start',name:'Speedometer',nameZh:'速度表',fact:'shows how fast it goes',factZh:'显示速度有多快'}) +
    partSVG({px:120,py:160,lx:120,ly:200,anc:'middle',name:'Cloud',nameZh:'云朵',fact:'the train almost catches it',factZh:'火车差点追上它'})
  ),
  hsr_12: () => svgWrap(
    partSVG({px:650,py:360,lx:850,ly:360,anc:'start',name:'Train',nameZh:'高铁',fact:'all parts work together',factZh:'所有部件一起工作'}) +
    partSVG({px:280,py:460,lx:120,ly:460,anc:'end',name:'Bridge',nameZh:'桥梁',fact:'crosses water',factZh:'跨越水面'}) +
    partSVG({px:260,py:220,lx:120,ly:220,anc:'end',name:'Pantograph',nameZh:'受电弓',fact:'brings power',factZh:'带来电力'})
  )
};
