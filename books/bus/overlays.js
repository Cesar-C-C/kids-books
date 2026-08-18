/* ============================================================
   Double-Decker Bus overlays — BUBBLE-MODE hotspots.
   All px/py/lx/ly values are IMAGE pixel coordinates (1216 x 832).
   shared/overlays.js auto-converts px/py to SVG viewBox; bubble mode
   ignores lx/ly (the speech bubble is an HTML overlay, not an SVG label).
   Labels & data avoid the bottom-right watermark zone.
   BUBBLE-MODE rules: every partSVG call passes `line` + `lineZh`
   (a short first-person speech line, English + Chinese). reader.js
   detects data-line and pops an HTML speech bubble next to the dot.
   ============================================================ */
window.OVL = {
  // 1. 部件地图 — side view, all parts visible
  bs_parts(){
    return svgWrap(
      partSVG({px:430, py:330, name:'Upper deck',     nameZh:'上层车厢',
               fact:'the top floor with the best view',
               factZh:'视野最好的顶层',
               line:"I'm the top floor — I have the best view of the city!",
               lineZh:'我是上层！看城市的风景最棒啦。', lineKey:'bs_parts_0'}) +
      partSVG({px:430, py:530, name:'Lower deck',     nameZh:'下层车厢',
               fact:'the bottom floor near the door',
               factZh:'靠近车门的底层',
               line:"I'm the bottom floor, close to the door and the road.",
               lineZh:'我是下层，离车门和马路最近。', lineKey:'bs_parts_1'}) +
      partSVG({px:400, py:760, name:'Wheels',         nameZh:'车轮',
               fact:'the big tires that roll the bus',
               factZh:'让巴士滚起来的大轮胎',
               line:"We roll and roll to move the bus!",
               lineZh:'我们滚滚滚，带着巴士往前走！', lineKey:'bs_parts_2'}) +
      partSVG({px:1000,py:380, name:'Windows',        nameZh:'窗户',
               fact:'where passengers look out',
               factZh:'乘客看风景的地方',
               line:"Look out through us — what do you see?",
               lineZh:'透过我们往外看——你看到了什么？', lineKey:'bs_parts_3'})
    );
  },

  // 2. 上层车厢 剖面 — cross-section of upper deck
  bs_upper(){
    return svgWrap(
      partSVG({px:520, py:480, name:'Seats',    nameZh:'座位',
               fact:'soft seats in rows on both sides',
               factZh:'两边一排排的软座位',
               line:"Sit here and look out the big windows!",
               lineZh:'坐在这里看大窗户外面吧！', lineKey:'bs_upper_0'}) +
      partSVG({px:460, py:310, name:'Windows',  nameZh:'窗户',
               fact:'high windows with a great view',
               factZh:'高高的窗户，风景好',
               line:"Up high, we see the whole street!",
               lineZh:'我们在高处，能看完整条街。', lineKey:'bs_upper_1'}) +
      partSVG({px:700, py:600, name:'Walkway',  nameZh:'走道',
               fact:'the aisle in the middle',
               factZh:'中间的通道',
               line:"Walk down me to find your seat.",
               lineZh:'沿着我走，就能找到座位。', lineKey:'bs_upper_2'}) +
      partSVG({px:560, py:200, name:'Ceiling',  nameZh:'车顶',
               fact:'the roof that keeps rain out',
               factZh:'挡雨的车顶',
               line:"I keep the rain out of the bus.",
               lineZh:'我把雨挡在巴士外面。', lineKey:'bs_upper_3'})
    );
  },

  // 3. 下层车厢 剖面 — cross-section of lower deck
  bs_lower(){
    return svgWrap(
      partSVG({px:320, py:600, name:'Front door',     nameZh:'前门',
               fact:'where passengers hop on',
               factZh:'乘客上车的门',
               line:"Hop on here and tap your card!",
               lineZh:'在这里上车，刷一下卡！', lineKey:'bs_lower_0'}) +
      partSVG({px:820, py:380, name:'Priority sign',  nameZh:'爱心座标志',
               fact:'the yellow sign for people who need it most',
               factZh:'给最需要的人留的黄色标志',
               line:"This seat is for people who need it most.",
               lineZh:'这个座位留给最需要的人。', lineKey:'bs_lower_1'}) +
      partSVG({px:680, py:550, name:'Wheelchair area',nameZh:'轮椅区',
               fact:'an open space for a wheelchair or stroller',
               factZh:'留给轮椅或婴儿车的空位',
               line:"A wheelchair fits right here!",
               lineZh:'轮椅正好放在这里！', lineKey:'bs_lower_2'}) +
      partSVG({px:560, py:680, name:'Handrail',       nameZh:'扶手',
               fact:'the bar to hold for balance',
               factZh:'保持平衡的横杆',
               line:"Hold me tight when the bus moves!",
               lineZh:'巴士开动时抓紧我！', lineKey:'bs_lower_3'})
    );
  },

  // 4. 楼梯 特写剖面 — staircase connecting two floors
  bs_stairs(){
    return svgWrap(
      partSVG({px:720, py:500, name:'Staircase',     nameZh:'楼梯',
               fact:'the steps that link the two floors',
               factZh:'连接两层台阶',
               line:"I link the two floors together!",
               lineZh:'我把两层连在一起！', lineKey:'bs_stairs_0'}) +
      partSVG({px:640, py:300, name:'Handrail',      nameZh:'扶手',
               fact:'the bar to hold while climbing',
               factZh:'爬楼时抓的横杆',
               line:"Hold me tight while you climb.",
               lineZh:'爬楼梯时抓紧我。', lineKey:'bs_stairs_1'}) +
      partSVG({px:570, py:410, name:'Climber',       nameZh:'爬楼的人',
               fact:'a child going upstairs',
               factZh:'上楼的小朋友',
               line:"One step at a time — up I go!",
               lineZh:'一级一级来——我上去啦！', lineKey:'bs_stairs_2'}) +
      partSVG({px:1050,py:280, name:'Upper seats',   nameZh:'上层座位',
               fact:'the seats waiting upstairs',
               factZh:'楼上等着的座位',
               line:"Welcome to the top deck!",
               lineZh:'欢迎来到上层！', lineKey:'bs_stairs_3'})
    );
  },

  // 5. 驾驶室 特写 — driver, steering wheel, dashboard
  bs_cab(){
    return svgWrap(
      partSVG({px:430, py:680, name:'Steering wheel',nameZh:'方向盘',
               fact:'the big wheel that steers the bus',
               factZh:'转动巴士的大方向盘',
               line:"Turn me to steer the bus!",
               lineZh:'转我，就能让巴士转弯！', lineKey:'bs_cab_0'}) +
      partSVG({px:780, py:650, name:'Dashboard',     nameZh:'仪表盘',
               fact:'the dials that show speed and more',
               factZh:'显示速度等的仪表',
               line:"My dials show how fast we go.",
               lineZh:'我的仪表显示我们开多快。', lineKey:'bs_cab_1'}) +
      partSVG({px:280, py:500, name:'Driver',        nameZh:'司机',
               fact:'the person who drives the bus',
               factZh:'开车的人',
               line:"I keep everyone safe on the road.",
               lineZh:'我保证大家在路上都安全。', lineKey:'bs_cab_2'}) +
      partSVG({px:820, py:380, name:'Windshield',    nameZh:'挡风玻璃',
               fact:'the big window at the front',
               factZh:'前面的大玻璃',
               line:"I let the driver see the road ahead.",
               lineZh:'我让司机看到前面的路。', lineKey:'bs_cab_3'})
    );
  },

  // 6. 发动机 剖面特写 — back of bus, engine compartment
  bs_engine(){
    return svgWrap(
      partSVG({px:500, py:450, name:'Engine',    nameZh:'发动机',
               fact:'the strong heart of the bus',
               factZh:'巴士强壮的"心脏"',
               line:"I'm the powerful heart of the bus!",
               lineZh:'我是巴士有力的心脏！', lineKey:'bs_engine_0'}) +
      partSVG({px:820, py:450, name:'Fuel tank', nameZh:'油箱',
               fact:'holds the fuel that gives power',
               factZh:'装着提供动力的燃料',
               line:"I hold the fuel that gives the bus power.",
               lineZh:'我装着给巴士力量的燃料。', lineKey:'bs_engine_1'}) +
      partSVG({px:300, py:480, name:'Fan',       nameZh:'风扇',
               fact:'keeps the engine cool',
               factZh:'给发动机降温',
               line:"I keep the engine cool.",
               lineZh:'我让发动机凉快。', lineKey:'bs_engine_2'}) +
      partSVG({px:560, py:280, name:'Pipes',     nameZh:'管道',
               fact:'pipes that carry fuel and air',
               factZh:'运送燃料和空气的管子',
               line:"We carry fuel and air to the engine.",
               lineZh:'我们把燃料和空气送给发动机。', lineKey:'bs_engine_3'})
    );
  },

  // 7. 车轮 特写 — tire and hubcap
  bs_wheel(){
    return svgWrap(
      partSVG({px:400, py:470, name:'Tire',     nameZh:'轮胎',
               fact:'thick rubber that grips the road',
               factZh:'抓紧路面的厚橡胶',
               line:"My rubber grips the road tightly!",
               lineZh:'我的橡胶紧紧抓住路面！', lineKey:'bs_wheel_0'}) +
      partSVG({px:490, py:480, name:'Hubcap',   nameZh:'轮毂',
               fact:'the shiny metal center of the wheel',
               factZh:'车轮中央的亮金属',
               line:"I spin round and round with the wheel.",
               lineZh:'我跟着车轮一起转呀转。', lineKey:'bs_wheel_1'}) +
      partSVG({px:300, py:430, name:'Treads',   nameZh:'胎面花纹',
               fact:'the grooves on the tire',
               factZh:'轮胎上的凹槽',
               line:"My grooves help the bus stop without slipping.",
               lineZh:'我的花纹让巴士不打滑。', lineKey:'bs_wheel_2'}) +
      partSVG({px:600, py:780, name:'Road',     nameZh:'路面',
               fact:'the street the bus drives on',
               factZh:'巴士行驶的街道',
               line:"Smooth and strong — that's me!",
               lineZh:'又平又结实——就是我！', lineKey:'bs_wheel_3'})
    );
  },

  // 8. 车门 场景 — bus stop, doors open, passengers boarding
  bs_doors(){
    return svgWrap(
      partSVG({px:490, py:640, name:'Front door', nameZh:'前门',
               fact:'the door where passengers get on',
               factZh:'乘客上车的门',
               line:"Hop on here and tap your card!",
               lineZh:'在这里上车，刷一下卡！', lineKey:'bs_doors_0'}) +
      partSVG({px:880, py:660, name:'Back door',  nameZh:'后门',
               fact:'the door where passengers get off',
               factZh:'乘客下车的门',
               line:"I'm the door to hop off!",
               lineZh:'我是下车的那扇门。', lineKey:'bs_doors_1'}) +
      partSVG({px:340, py:480, name:'Driver',     nameZh:'司机',
               fact:'the person behind the wheel',
               factZh:'握着方向盘的人',
               line:"Welcome aboard — find a seat!",
               lineZh:'欢迎上车——找个座位吧！', lineKey:'bs_doors_2'}) +
      partSVG({px:1050,py:580, name:'Waiting passengers', nameZh:'等车的乘客',
               fact:'people waiting for the bus',
               factZh:'等巴士的人',
               line:"We ride the bus every day!",
               lineZh:'我们每天都坐巴士！', lineKey:'bs_doors_3'})
    );
  },

  // 9. 敞篷车顶 俯视 — open-top sightseeing bus
  bs_opentop(){
    return svgWrap(
      partSVG({px:720, py:200, name:'Open roof',  nameZh:'敞篷车顶',
               fact:'no roof on the upper deck',
               factZh:'上层没有车顶',
               line:"No roof up here — feel the breeze!",
               lineZh:'这里没有顶——吹吹风吧！', lineKey:'bs_opentop_0'}) +
      partSVG({px:600, py:340, name:'Tourists',   nameZh:'游客',
               fact:'people enjoying the view up top',
               factZh:'在上面看风景的人',
               line:"What a wonderful view up here!",
               lineZh:'上面的风景真美！', lineKey:'bs_opentop_1'}) +
      partSVG({px:1100,py:680, name:'City street',nameZh:'城市街道',
               fact:'the busy street below',
               factZh:'下面热闹的街道',
               line:"Honk honk — here comes the bus!",
               lineZh:'嘟嘟——巴士来啦！', lineKey:'bs_opentop_2'}) +
      partSVG({px:720, py:600, name:'Bus',        nameZh:'巴士',
               fact:'our red double-decker friend',
               factZh:'我们的红色双层朋友',
               line:"Rumble rumble through the city all day!",
               lineZh:'我整天轰隆隆穿过城市！', lineKey:'bs_opentop_3'})
    );
  },

  // 10. 路上场景 — traffic light, bus stop, cars, pedestrians
  bs_street(){
    return svgWrap(
      partSVG({px:200, py:340, name:'Traffic light', nameZh:'红绿灯',
               fact:'red means stop, green means go',
               factZh:'红灯停，绿灯行',
               line:"Red means stop, green means go!",
               lineZh:'红灯停，绿灯行！', lineKey:'bs_street_0'}) +
      partSVG({px:200, py:560, name:'Bus stop sign',nameZh:'公交站牌',
               fact:'where people wait for the bus',
               factZh:'等巴士的地方',
               line:"Wait for me here — I'll be right back!",
               lineZh:'在这里等我——我马上回来！', lineKey:'bs_street_1'}) +
      partSVG({px:110, py:720, name:'Car',         nameZh:'小汽车',
               fact:'a small car sharing the road',
               factZh:'一起跑的小汽车',
               line:"Vroom vroom — sharing the road with the bus!",
               lineZh:'呜——和巴士一起跑！', lineKey:'bs_street_2'}) +
      partSVG({px:1020,py:660, name:'Pedestrians', nameZh:'行人',
               fact:'people walking on the sidewalk',
               factZh:'在便道上走路的人',
               line:"We walk, the bus drives — same busy city!",
               lineZh:'我们走，巴士开——同一个热闹城市！', lineKey:'bs_street_3'})
    );
  },

  // 11. 词汇表 海报 — central bus + part icons
  bs_vocab(){
    return svgWrap(
      partSVG({px:770, py:520, name:'Double-decker bus', nameZh:'双层巴士',
               fact:'a bus with two floors',
               factZh:'有两层车厢的巴士',
               line:"I'm a bus with two floors — hop on!",
               lineZh:'我是有两层车厢的巴士——上来吧！', lineKey:'bs_vocab_0'}) +
      partSVG({px:250, py:240, name:'Tire',          nameZh:'轮胎',
               fact:'the rubber wheel',
               factZh:'橡胶车轮',
               line:"I roll the bus along the road.",
               lineZh:'我带着巴士在路上跑。', lineKey:'bs_vocab_1'}) +
      partSVG({px:220, py:520, name:'Window',        nameZh:'窗户',
               fact:'where you look out',
               factZh:'看外面用的',
               line:"Look through me to see the world!",
               lineZh:'透过我看世界！', lineKey:'bs_vocab_2'}) +
      partSVG({px:230, py:720, name:'Seat',          nameZh:'座位',
               fact:'where passengers sit',
               factZh:'乘客坐的地方',
               line:"Have a seat and enjoy the ride!",
               lineZh:'坐下来享受旅程吧！', lineKey:'bs_vocab_3'}) +
      partSVG({px:880, py:200, name:'Steering wheel',nameZh:'方向盘',
               fact:'turns the bus',
               factZh:'让巴士转弯',
               line:"Turn me left or right — your choice!",
               lineZh:'左转右转——随你选！', lineKey:'bs_vocab_4'}) +
      partSVG({px:1080,py:260, name:'Engine',        nameZh:'发动机',
               fact:'the powerful heart',
               factZh:'有力的心脏',
               line:"Vroom! I'm the bus's strong heart.",
               lineZh:'轰！我是巴士强健的心脏。', lineKey:'bs_vocab_5'}) +
      partSVG({px:1100,py:510, name:'Staircase',     nameZh:'楼梯',
               fact:'links the two floors',
               factZh:'连接两层',
               line:"Step on me to go up or down!",
               lineZh:'踩着我上下楼！', lineKey:'bs_vocab_6'}) +
      partSVG({px:1080,py:730, name:'Door',          nameZh:'车门',
               fact:'open to hop on or off',
               factZh:'打开就能上下车',
               line:"Open sesame — hop on!",
               lineZh:'开门啦——上来吧！', lineKey:'bs_vocab_7'})
    );
  }
};
