/* Little Space Station — the discoveries that live inside each landmark part.
   Every entry names a detail group built in v3/stationframe.js, so the studio
   can isolate it, describe it and read it aloud. `region` must match a parts.js id. */
window.STATION_DETAILS = [
  /* ---- modules ---- */
  {
    id: 'modules.skin', region: 'modules', name: 'Module skin', zhName: '舱壁',
    en: 'Each module is a metal can, made from curved panels riveted in rings.', zh: '每一节舱段都是一只金属罐子，用一块块弯板一圈圈铆起来。',
    tip: '找找舱壁上那一圈一圈的铆钉。',
    principle: '圆筒形状受力最均匀。舱内充满一个大气压的空气时，圆形舱壁处处都在均匀地向外撑，所以又轻又结实。'
  },
  {
    id: 'modules.ring', region: 'modules', name: 'Stiffening rings', zhName: '加强环',
    en: 'Ribs run around the barrel like the hoops on a wooden bucket.', zh: '一圈圈加强肋像木桶外面的箍，把圆筒抱得牢牢的。',
    tip: '看看圆筒上每隔一段就有一道凸起的圈。',
    principle: '薄壳受弯时最容易在中间鼓出去。加上环向加强肋，等于在薄板上压出折边，抗压能力能提高很多倍。'
  },
  {
    id: 'modules.port', region: 'modules', name: 'Bright window', zhName: '舷窗玻璃',
    en: 'Thick glass, set deep in a metal frame, keeps the air in and shows the stars.', zh: '厚厚的玻璃嵌在金属窗框里，把空气留在舱内，把星星放在眼前。',
    tip: '凑近看看舷窗，玻璃好像嵌得很深。',
    principle: '舷窗玻璃是多层叠起来的，中间还夹着透明的加强层。舱内压力把玻璃往外推，窗框把它牢牢兜住。'
  },
  {
    id: 'modules.handhold', region: 'modules', name: 'Handholds', zhName: '扶手',
    en: 'Little yellow grips are bolted all over the outside for spacewalking hands.', zh: '外面装着一排排黄色小扶手，是给出舱活动的手抓的。',
    tip: '数一数舱壁外面有多少个黄色的小把手。',
    principle: '太空中没有上下、也踩不住地面，宇航员出舱时必须一路抓住扶手移动，还要用安全绳把自己和站体连住。'
  },
  {
    id: 'modules.mmu', region: 'modules', name: 'Thruster pack', zhName: '姿控推力器',
    en: 'Small thrusters push the station a little, so it keeps the right way round.', zh: '小小的推力器轻轻推一下，让太空站一直保持正确的朝向。',
    tip: '找到舱壁上那几组小小的喷口。',
    principle: '两个太阳翼要一直朝着太阳，散热板要一直背对太阳。姿控推力器不停做很小的修正，靠牛顿第三定律把站体慢慢转回来。'
  },
  /* ---- node ---- */
  {
    id: 'node.hatch', region: 'node', name: 'Hatches', zhName: '舱门',
    en: 'Round doors open between the node and every module.', zh: '圆圆的舱门把节点和每一节舱段连起来。',
    tip: '数一数这个圆球上开几扇门，都通向哪里。',
    principle: '每扇舱门上都有密封圈。关紧后它把两边的空气分开，万一某一节漏气，把门一关就能保住其它舱。'
  },
  {
    id: 'node.ring', region: 'node', name: 'Berthing ring', zhName: '对接环',
    en: 'A wide collar with bolts is where a new module would be attached.', zh: '一圈带螺栓的宽环，将来要加新舱段就接在这里。',
    tip: '找找节点上那个空着的大圆环。',
    principle: '对接口的直径和螺栓位置全站统一，所以任何一个舱段都能装在任何一个口上，坏了也能换。'
  },
  {
    id: 'node.light', region: 'node', name: 'Interior light', zhName: '舱内照明',
    en: 'Sunlight through the portholes is not enough here, so lamps stay on inside.', zh: '光靠舷窗不够亮，舱里的灯一直开着。',
    tip: '从舷窗看进去，舱内是不是亮着灯？',
    principle: '太空站每 90 分钟绕地球一圈，一半时间在阴影里。昼夜切换太快，人体分不清早晚，所以照明和作息都靠人工安排。'
  },
  /* ---- solar ---- */
  {
    id: 'solar.panel', region: 'solar', name: 'Solar panel', zhName: '太阳电池板',
    en: 'Each wing is a grid of dark blue panels, hinged into a long row.', zh: '每片翅膀都是深蓝色板拼成的方格，铰接着排成长长的一条。',
    tip: '数一数一片翅膀上有多少块小板。',
    principle: '电池片被光一照，里面的电子就被推着走，形成电流。单块电压很小，所以要串联很多片才够用。'
  },
  {
    id: 'solar.cell', region: 'solar', name: 'Cell grid', zhName: '电池栅格',
    en: 'Fine gold lines run across each panel to gather the electricity.', zh: '板上细细的金色线条把电收起来。',
    tip: '凑近看板面，上面有很细很细的线。',
    principle: '细线是导电的栅极，越细遮挡的光越少。它们把每一小片电池的电汇到一起，再沿电缆送回舱内。'
  },
  {
    id: 'solar.boom', region: 'solar', name: 'Mast', zhName: '翼展龙骨',
    en: 'A long white mast carries the whole wing and lets it turn towards the Sun.', zh: '一条白色的长龙骨托着整片翅膀，还能让它转过去对着太阳。',
    tip: '看看是什么把这么长的一片翅膀托住的。',
    principle: '太阳翼的转轴和天线一样会跟着太阳走。转动时整个翼面一起转，力矩很大，所以驱动电机必须减速很多倍才转得动。'
  },
  {
    id: 'solar.horn', region: 'solar', name: 'Hinges', zhName: '折叠铰链',
    en: 'The wings left Earth folded up, then unfolded in space like a fan.', zh: '翅膀发射时是折起来的，到了太空才像扇子一样张开。',
    tip: '指一指翅膀上那几处能转动的关节。',
    principle: '火箭里的空间很小，太阳翼必须折叠打包；到轨道后由弹簧和电机一节节展开，每一节都要自己锁死，才不会晃。'
  },
  /* ---- truss ---- */
  {
    id: 'truss.beam', region: 'truss', name: 'Truss beam', zhName: '桁架主梁',
    en: 'The truss is a lattice of thin struts, not a solid tube — light but very stiff.', zh: '桁架是一格一格的细杆拼成的，不是实心管子，所以又轻又硬。',
    tip: '隔着空格看看，桁架里面是空的。',
    principle: '三角形的格子最不容易变形。用三角形拼成的桁架，比同样重量的实心梁结实得多。'
  },
  {
    id: 'truss.cable', region: 'truss', name: 'Power cable', zhName: '输电电缆',
    en: 'Thick cables run along the truss, carrying the current back to the modules.', zh: '粗粗的电缆顺着桁架走，把太阳翼发的电送回舱段。',
    tip: '沿着桁架找一找那条弯弯的粗线。',
    principle: '电缆要够粗，否则电阻会发热、白白浪费电。太空里没法散热，所以导线都宁可选得粗一点。'
  },
  {
    id: 'truss.joint', region: 'truss', name: 'Coupling joint', zhName: '桁架接头',
    en: 'Each piece joins the next with a bolted joint, so the truss could be built in orbit.', zh: '每一节用螺栓接头接上下一节，所以桁架能在太空里一段段拼起来。',
    tip: '找找桁架上那一处处深色的接头。',
    principle: '全站桁架在轨拼装了十几年。每个接头的位置都按标准系列设计，后来的新设备可以插在同一个口上。'
  },
  /* ---- arm ---- */
  {
    id: 'arm.shoulder', region: 'arm', name: 'Shoulder joint', zhName: '肩部关节',
    en: 'One powered joint on the station wall carries the whole arm and swings it around.', zh: '装在舱壁上的一台动力关节托着整条手臂，可以让它转来转去。',
    tip: '找到手臂和舱壁相连的那个大关节。',
    principle: '这个关节能转整整一圈，内部由电机加齿轮减速驱动。转动时人靠得很近，所以操作速度压得很慢很稳。'
  },
  {
    id: 'arm.boom', region: 'arm', name: 'Arm boom', zhName: '臂身',
    en: 'The long white tube is the arm\'s upper segment, made stiff enough to reach far.', zh: '那根长长的白管子是机械臂的上臂，做得足够硬才能伸得远。',
    tip: '顺着关节往上看，这个臂身有多长？',
    principle: '臂身越长，能抓到的范围越大，但自身越容易在受力时变形。所以臂身做成粗管型，让它又轻又不容易弯。'
  },
  {
    id: 'arm.elbow', region: 'arm', name: 'Elbow joint', zhName: '肘部关节',
    en: 'A middle joint folds the arm, so it can bend like your own elbow.', zh: '中间那个关节让手臂能像你的手肘一样弯起来。',
    tip: '拖动滑杆，看肘部弯下去的样子像不像自己的胳膊。',
    principle: '一个关节只能画出一圈，两个关节加上旋转轴就能让手到达空间中很多位置。机械臂的关节数比人的胳膊还多。'
  },
  {
    id: 'arm.wrist', region: 'arm', name: 'Wrist', zhName: '腕部',
    en: 'A second thin segment ends in a wrist that can twist and point.', zh: '一段细一点的臂接到腕部，腕部还能转、还能对准方向。',
    tip: '看看手臂最前面那一截细的部分。',
    principle: '腕部负责最后的微调。像手拿杯子一样，先把大臂伸到位，再靠手腕把方向摆正，抓取才稳。'
  },
  {
    id: 'arm.gripper', region: 'arm', name: 'Gripper', zhName: '末端抓手',
    en: 'Two metal fingers close like a hand to take hold of a cargo ship.', zh: '两个金属手指像手一样合起来，把货运飞船抱住。',
    tip: '数一数抓手有几根手指。',
    principle: '抓手抓住的是飞船上的专用把手，不是直接抓外壳。抓住之后两边刚性连成一体，再由机械臂把飞船慢慢挪到对接口。'
  },
  /* ---- docking ---- */
  {
    id: 'docking.ring', region: 'docking', name: 'Docking ring', zhName: '对接环',
    en: 'A chased metal ring with latches is the doorway a spacecraft locks onto.', zh: '一圈带卡爪的金属环，飞船就是扣在这里。',
    tip: '看看这圈环上有几个突出来的卡爪。',
    principle: '对接时两个环先轻轻碰上，再由卡爪把两边拉紧，最后密封圈被压扁，接缝才不漏气。'
  },
  {
    id: 'docking.tunnel', region: 'docking', name: 'Tunnel', zhName: '通道',
    en: 'A short tunnel through the ring lets people crawl from the ship into the station.', zh: '环里面有一条短短的通道，人能从这里从飞船爬进太空站。',
    tip: '往洞里看一看，它通向舱内。',
    principle: '对接口的内径要略大于人的肩宽，穿着舱内航天服也能通过。两边压力相等、空气混好以后，里面那扇门才能打开。'
  },
  {
    id: 'docking.light', region: 'docking', name: 'Approach light', zhName: '接近指示灯',
    en: 'A little light beside the port shows the visiting pilot how they are lined up.', zh: '端口旁边的小灯告诉来访的飞船有没有对准。',
    tip: '找找对接环旁边那盏绿色的小灯。',
    principle: '飞船最后几米几乎是贴着飞过来的，靠人眼判断距离很不可靠，所以要用灯光和靶标帮助对准。'
  },
  {
    id: 'docking.target', region: 'docking', name: 'Target cross', zhName: '瞄准十字',
    en: 'A white cross marks the exact centre the pilot aims at.', zh: '白色的十字标出正中心，飞船就朝着它飞。',
    tip: '找到对接环正中间那个十字。',
    principle: '十字的中心就是两根轴线的交点。飞船的摄像机盯住十字，自动把姿态调到和它重合，再推上去。'
  },
  /* ---- cupola ---- */
  {
    id: 'cupola.glass', region: 'cupola', name: 'Window petals', zhName: '窗瓣',
    en: 'Seven windows, one on top and six around, join like the petals of a flower.', zh: '七扇窗，一扇在顶、六扇围成一圈，像花瓣一样拼起来。',
    tip: '数一数这圈窗户一共有几扇。',
    principle: '每一扇窗都是单独的承压部件，中间用金属框隔开。就算一片玻璃出现问题，其它几片还是完好的。'
  },
  {
    id: 'cupola.shutter', region: 'cupola', name: 'Shield cover', zhName: '防护盖',
    en: 'Metal covers can close over the glass to keep out tiny flying rocks.', zh: '金属盖子能合起来，替玻璃挡住飞行的小碎石。',
    tip: '看看窗前那几片金属板是做什么的。',
    principle: '太空里有大量极小的碎片，速度比子弹还快。关上防护盖能挡住它们，玻璃也就不会被一点点磨花。'
  },
  {
    id: 'cupola.rail', region: 'cupola', name: 'Control rail', zhName: '操控台',
    en: 'A row of controls right under the windows drives the robot arm outside.', zh: '窗下一排操控台，用来开动外面的机械臂。',
    tip: '看看窗边那一排按钮和摇杆。',
    principle: '机械臂的操作员坐在穹顶里，眼睛看着窗外那台真实的机械臂，手上推的是同比例的摇杆。所见和所动一一对应，才不容易出错。'
  },
  /* ---- windows ---- */
  {
    id: 'windows.frame', region: 'windows', name: 'Window frame', zhName: '窗框',
    en: 'A heavy metal ring takes all the pushing of the air inside.', zh: '一圈厚厚的金属框顶住舱内空气往外推的力。',
    tip: '摸摸舷窗外面这圈厚框，它为什么这么宽？',
    principle: '舱内外差一个大气压，一扇直径半米的舷窗上受力有好几吨。窗框必须又宽又厚，才能把这个力传给舱壁。'
  },
  {
    id: 'windows.inner', region: 'windows', name: 'Inner pane', zhName: '内层玻璃',
    en: 'The pane nearest the crew takes the pressure; the outer one takes the scratches.', zh: '靠人的那层玻璃负责承压，外面的那层负责挨刮蹭。',
    tip: '从舱里往外看，玻璃是不是像有两层？',
    principle: '两层玻璃分工不同，中间还留了空隙。外层刮花了可以更换，内层的承压玻璃始终不用动，也就不会影响密封。'
  },
  {
    id: 'windows.drape', region: 'windows', name: 'Sun shade', zhName: '遮光帘',
    en: 'Soft shades are tucked beside each window, because sunrise comes 16 times a day.', zh: '每扇窗边都塞着软软的帘子，因为这里一天要天亮 16 次。',
    tip: '找一找舷窗旁边卷着的那块软布。',
    principle: '每绕地球一圈就有一次日出日落。不用帘子挡光，人就分不清什么时候该睡，作息很快会乱掉。'
  },
  /* ---- interior ---- */
  {
    id: 'interior.racks', region: 'interior', name: 'Equipment racks', zhName: '设备机柜',
    en: 'Square racks fill the curved wall — like bookshelves, but screwed to the wall.', zh: '方形机柜把弧形墙面排满了，像书架一样，只是牢牢固定在墙上。',
    tip: '数一数一面墙上能放下几个机柜。',
    principle: '每个机柜尺寸全站统一，里面装什么都可以。抽屉有卡扣，不然一松手里面的东西就会自己飘出来。'
  },
  {
    id: 'interior.sleep', region: 'interior', name: 'Sleeping bag', zhName: '睡袋',
    en: 'There is no bed to lie on, so crew zip into a bag strapped to the wall.', zh: '这里没有床可躺，所以人钻进睡袋，再把睡袋系在墙上。',
    tip: '找找那个立着的蓝色睡袋，它为什么是竖着的？',
    principle: '在失重环境里躺着和站着没有区别，睡着了人也不会翻身掉下来；但会慢慢飘走，所以要把自己系住。'
  },
  {
    id: 'interior.table', region: 'interior', name: 'Galley table', zhName: '餐桌',
    en: 'Food pouches are taped down to the table so they stay put.', zh: '食物袋都用胶带粘在餐桌上，才不会飘走。',
    tip: '看看桌上的饭是怎么固定在桌上的。',
    principle: '失重时汤水会变成一团球飘起来。餐具带磁性或搭扣，盘子下还有粘扣，吃一顿饭比在地球上费劲得多。'
  },
  {
    id: 'interior.treadmill', region: 'interior', name: 'Treadmill', zhName: '跑步机',
    en: 'Crew run on a treadmill with a harness holding them down.', zh: '宇航员在跑步机上跑步，还要用背带把自己压住。',
    tip: '看看跑步机上的人为什么要绑背带。',
    principle: '失重时骨骼和肌肉不用再对抗重力，会慢慢变弱。每天锻炼两个多小时，才能抵住这种流失。'
  },
  {
    id: 'interior.plants', region: 'interior', name: 'Plant box', zhName: '种植箱',
    en: 'Green lettuce grows under purple lamps — the station\'s little garden.', zh: '翠绿的生菜在紫色的灯下生长，这是太空站的小菜园。',
    tip: '找找那箱绿油油的菜，灯为什么是紫色的？',
    principle: '叶子主要吸收红光和蓝光，所以灯专门发这两种颜色，看起来就是紫的。剩下的颜色省下来，不白白浪费电。'
  },
  /* ---- radiator ---- */
  {
    id: 'radiator.panel', region: 'radiator', name: 'Radiator panel', zhName: '散热板',
    en: 'Pale panels are full of pipes, and hot fluid runs through them.', zh: '浅色的板里布满细管，热乎乎的液体在里面流动。',
    tip: '找找和最深的蓝色太阳能翼不一样的那几片白板。',
    principle: '太空里没有空气可以带走热量，只能靠向外辐射。板面做得又白又大，就是为了把热尽快射出去。'
  },
  {
    id: 'radiator.loop', region: 'radiator', name: 'Coolant loop', zhName: '冷却回路',
    en: 'The fluid loop carries heat from the racks out to the panels and back.', zh: '冷却液把机柜里的热带到板子上，凉下来再流回去。',
    tip: '顺着那根管子找一找，它从哪儿来、到哪儿去。',
    principle: '水冷比风冷效率高得多，而且太空里也没有风。液冷回路把设备的热量集中起来，再统一送到散热板扔掉。'
  }
];
