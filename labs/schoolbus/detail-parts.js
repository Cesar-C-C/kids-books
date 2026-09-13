/* Little School Bus — the discoveries that live inside each landmark part.
   Every entry names a detail group built in v3/schoolbusframe.js, so the studio
   can isolate it, describe it and read it aloud. `region` must match a parts.js id. */
window.SCHOOLBUS_DETAILS = [
  /* ---- body ---- */
  {
    id: 'body.shell', region: 'body', name: 'Yellow shell', zhName: '黄色外壳',
    en: 'One long steel shell, painted yellow all over.', zh: '一整条钢制外壳，从上到下都刷成黄色。',
    tip: '摸摸车身的外壳，它是一整块包起来的。',
    principle: '车壳用薄钢板冲压焊接成一体，中间没有接缝，所以又轻又结实。'
  },
  {
    id: 'body.windows', region: 'body', name: 'Side windows', zhName: '侧车窗',
    en: 'Six windows on each side let in light and let children wave out.', zh: '每边六扇车窗，透进阳光，孩子还能朝外面挥手。',
    tip: '数一数一边有多少扇车窗。',
    principle: '车窗用夹胶安全玻璃，碎了也粘在中间那层膜上，不会飞出碎片。'
  },
  {
    id: 'body.rubrail', region: 'body', name: 'Rub rail', zhName: '防擦腰条',
    en: 'The black bars along the side are rub rails. They take the bumps instead of the paint.', zh: '车身侧面那两条黑条是防擦条，磕碰都让它来挡，不伤车漆。',
    tip: '找到车身侧面那两条黑色的横杠。',
    principle: '防擦条是加厚的钢制横梁，同时也是车身的加强筋，让侧面更抗撞。'
  },
  {
    id: 'body.skirt', region: 'body', name: 'Skirt panel', zhName: '裙板',
    en: 'A low panel closes the gap between the floor and the road.', zh: '最下面一块板把地板和路面之间的空隙挡住。',
    tip: '看看车身最下面那一条。',
    principle: '裙板挡住轮子和底盘，既减少风阻，也防止雨水和沙石甩进车底。'
  },
  /* ---- roof ---- */
  {
    id: 'roof.panel', region: 'roof', name: 'Rounded roof', zhName: '圆拱车顶',
    en: 'The roof arches gently across the width of the bus.', zh: '车顶在车宽方向上轻轻拱起来。',
    tip: '从车头方向看，车顶是不是微微拱起？',
    principle: '拱形比平板更能承重。车顶做成拱形，翻车时能撑住冲击、保护车厢里的人。'
  },
  {
    id: 'roof.hatch', region: 'roof', name: 'Roof hatch', zhName: '车顶逃生窗',
    en: 'Two hatches in the roof open up as emergency exits.', zh: '车顶上两扇窗可以向上打开，紧急时当作出口。',
    tip: '车顶上那两个方方的盖子，其实是逃生口。',
    principle: '逃生窗向外推开并锁死在打开位置，保证孩子爬出去时它不会落下来。'
  },
  {
    id: 'roof.beacon', region: 'roof', name: 'Roof cap', zhName: '顶部凸台',
    en: 'A raised strip along the roof strengthens it and hides the wiring.', zh: '车顶中间还有一条凸起，既加固又藏起里面的电线。',
    tip: '看看车顶正中那条细细的凸起。',
    principle: '凸台相当于在薄板上压出一道折边，抗弯能力能提高好几倍。'
  },
  /* ---- hood ---- */
  {
    id: 'hood.cover', region: 'hood', name: 'Hood', zhName: '舱盖',
    en: 'The hood is the box in front that the engine lives under.', zh: '舱盖就是车头前面那个方方的盖子，发动机住在里面。',
    tip: '看看车头伸出来的那个方盒子。',
    principle: '发动机放在车头前方叫"前置"，好处是撞车时这段车身先被压扁、吸收能量，车厢里的人更安全。'
  },
  {
    id: 'hood.grille', region: 'hood', name: 'Grille', zhName: '进气格栅',
    en: 'Air rushes through the grille to cool the hot engine.', zh: '空气从格栅的缝里钻进去，把发烫的发动机吹凉。',
    tip: '车头正面那一排横条，就是空气进出的门。',
    principle: '格栅后面是散热器。冷却液在里面流过，风一吹就把热量带走了。'
  },
  {
    id: 'hood.headlight', region: 'hood', name: 'Headlights', zhName: '前照灯',
    en: 'Two round headlights light the road on dark winter mornings.', zh: '两个圆圆的前照灯，在冬天昏暗的早晨照亮路面。',
    tip: '找到车头那两个圆圆的灯。',
    principle: '前照灯用抛物面反光碗把灯泡的光收成一束，照得又直又远。'
  },
  {
    id: 'hood.bumper', region: 'hood', name: 'Front bumper', zhName: '前保险杠',
    en: 'A thick black bumper is the first thing to meet a bump.', zh: '粗粗的黑色保险杠最先顶住碰撞。',
    tip: '看看车头最下面那一块黑色的厚板。',
    principle: '保险杠靠吸能支架连在车架上。轻轻一撞，支架先变形把力气吃掉，车身才不至于凹进去。'
  },
  /* ---- cab ---- */
  {
    id: 'cab.wheel', region: 'cab', name: 'Steering wheel', zhName: '方向盘',
    en: 'A big steering wheel — bigger than a car\'s, so the driver can turn easily.', zh: '方向盘比小汽车的大一圈，司机打方向更省力。',
    tip: '看看司机手里的方向盘，比家里小汽车的更大。',
    principle: '方向盘越大，同样用力产生的力矩越大，转起来就越轻松。这就是校车用大方向盘的原因。'
  },
  {
    id: 'cab.dash', region: 'cab', name: 'Dashboard', zhName: '仪表台',
    en: 'Dials show how fast the bus goes and how much fuel is left.', zh: '仪表上显示车子跑多快、还剩多少油。',
    tip: '看司机面前那一排圆圆的表。',
    principle: '仪表靠传感器把转速、油量、温度变成电信号，再让指针指到相应的刻度上。'
  },
  {
    id: 'cab.seat', region: 'cab', name: 'Driver seat', zhName: '驾驶座',
    en: 'The driver sits high to see over the children\'s heads.', zh: '司机坐得很高，越过孩子们的头顶看出去。',
    tip: '比一比，司机和乘客谁坐得更高？',
    principle: '座椅越高，视野越远，盲区越小。校车司机必须看清车前有没有孩子。'
  },
  {
    id: 'cab.glass', region: 'cab', name: 'Windshield', zhName: '前风挡',
    en: 'A split windshield curves around the cab for a wide view.', zh: '分成两片的前风挡弯过来，让司机看得更宽。',
    tip: '看看前风挡中间那条竖着的分隔线。',
    principle: '风挡分片是早期工艺留下的做法，好处是坏一片只换一片，也更容易做成弧面。'
  },
  {
    id: 'cab.mirror', region: 'cab', name: 'Crossing mirror', zhName: '补盲后视镜',
    en: 'Extra mirrors in front show the driver the blind spot right at the bumper.', zh: '车头的小镜子能看到保险杠正前方那片看不到的地方。',
    tip: '找到车头前面伸出来的小圆镜。',
    principle: '车头正前方是司机最危险的盲区。补盲镜把这一块反射进驾驶室，起步前必须看它。'
  },
  /* ---- doors ---- */
  {
    id: 'doors.leaf', region: 'doors', name: 'Folding leaves', zhName: '折叠门扇',
    en: 'Two half-doors fold in the middle and swing open.', zh: '两片半门从中间对折着打开。',
    tip: '按一按门，看它是从中间折开的。',
    principle: '折门比整扇门省地方，开门时不会伸到车外面划到人。'
  },
  {
    id: 'doors.glass', region: 'doors', name: 'Door glass', zhName: '门玻璃',
    en: 'Glass in the doors lets the driver see who is waiting outside.', zh: '门上的玻璃让司机看见外面等着上车的孩子。',
    tip: '隔着门玻璃往外看，是不是能看得很清楚？',
    principle: '门玻璃和车窗一样是夹胶安全玻璃，被撞时只会裂成一整片网，不掉碎渣。'
  },
  {
    id: 'doors.step', region: 'doors', name: 'Entry steps', zhName: '上车踏步',
    en: 'Wide steps with a grip surface carry children up to the floor.', zh: '又宽又防滑的踏步把孩子们送上车厢地板。',
    tip: '数一数上车要踩几级台阶。',
    principle: '踏板表面有防滑的凸点，下雨天鞋底湿了也不容易滑倒。'
  },
  {
    id: 'doors.emergency', region: 'doors', name: 'Emergency door', zhName: '安全门',
    en: 'A door at the back opens from the inside in one push, for emergencies.', zh: '车尾的安全门从里面一推就开，应急时用。',
    tip: '找找车尾那扇门，它和前面的门长得不一样。',
    principle: '安全门不装锁芯，只装一个明显的推杆，紧急时不需要钥匙、不需要力气就能打开。'
  },
  /* ---- seats ---- */
  {
    id: 'seats.cushion', region: 'seats', name: 'Seat cushions', zhName: '座椅坐垫',
    en: 'Firm blue cushions, two children to a seat.', zh: '结实的蓝色坐垫，一个座位能坐两个孩子。',
    tip: '数一数一边有几排座椅。',
    principle: '座椅垫做成一块整板而不是软沙发，是为了撞车时孩子不会被弹起来，也不会陷进去。'
  },
  {
    id: 'seats.back', region: 'seats', name: 'High seat backs', zhName: '高靠背',
    en: 'Tall padded backs make a soft wall between the rows.', zh: '高高的软靠背在每一排之间立起一道软墙。',
    tip: '看看座椅的靠背有多高，几乎到肩膀了。',
    principle: '高靠背挡在前面，撞车时孩子身体向前甩会被它接住，这叫"隔舱化保护"，校车不装普通安全带也靠它兜底。'
  },
  {
    id: 'seats.belt', region: 'seats', name: 'Seat belts', zhName: '安全带',
    en: 'Each seat has a belt that buckles across a child\'s lap and chest.', zh: '每个座位都有安全带，斜斜地扣在胸前。',
    tip: '找到座椅上的安全带，看看它扣在哪里。',
    principle: '安全带把撞车时的冲力分散到肩膀和骨盆这些结实的部位，不让它集中压到肚子上。'
  },
  {
    id: 'seats.frame', region: 'seats', name: 'Seat legs', zhName: '座椅支架',
    en: 'Steel legs bolt every bench straight down to the floor.', zh: '钢支架把每一排座椅牢牢拴在地板上。',
    tip: '看看座椅下面的支架。',
    principle: '座椅不靠螺丝钉在薄地板上，而是穿过地板锁在底盘横梁上，撞车时整排椅子才不会飞出去。'
  },
  /* ---- aisle ---- */
  {
    id: 'aisle.floor', region: 'aisle', name: 'Walkway floor', zhName: '过道地板',
    en: 'A ribbed rubber floor gives shoes something to grip.', zh: '带条纹的橡胶地板，鞋底踩上去不打滑。',
    tip: '低头看看脚下的地板，它有一条条的纹路。',
    principle: '橡胶地板有弹性，能吸掉一部分噪音；表面的凸纹让湿鞋也不打滑。'
  },
  {
    id: 'aisle.handrail', region: 'aisle', name: 'Handrail', zhName: '过道扶手',
    en: 'A rail runs down the aisle for children to hold while the bus moves.', zh: '过道边有一条扶手，车子开动时孩子可以扶着走。',
    tip: '找到过道边上的扶手，试试从车头扶到车尾。',
    principle: '车开动时人会因为惯性往前冲，扶住固定的扶手就能稳住身体。'
  },
  {
    id: 'aisle.rear', region: 'aisle', name: 'Rear walkway', zhName: '尾部通道',
    en: 'The walkway reaches all the way to the emergency door.', zh: '过道一直通到车尾的安全门。',
    tip: '沿着过道走到最后面，看看那里有什么。',
    principle: '过道必须一直保持空旷。紧急疏散时它是一条直路，不用绕弯就能最快跑出去。'
  },
  /* ---- stopsign ---- */
  {
    id: 'stopsign.blade', region: 'stopsign', name: 'Stop sign', zhName: '停车牌',
    en: 'A red octagon with white letters — the same shape as a road stop sign.', zh: '红色八边形带白字，和马路上"停"的标志一个样子。',
    tip: '看看停车牌的形状，你还在哪里见过它？',
    principle: '八边形在交通标志里专指"停车"。校车用同样的形状，是让司机一眼就认出必须停下来。'
  },
  {
    id: 'stopsign.arm', region: 'stopsign', name: 'Folding arm', zhName: '伸缩臂',
    en: 'The sign rides folded against the body and swings out when needed.', zh: '平时它贴着车身收起来，需要时摆动伸出去。',
    tip: '停车牌伸出来的时候，比车身多出去多少？',
    principle: '伸缩臂由司机座上的一个开关控制。伸出去后还有一道灯同时亮起，提醒后方车辆。'
  },
  {
    id: 'stopsign.lamp', region: 'stopsign', name: 'Arm lamp', zhName: '停车牌灯',
    en: 'A lamp on the arm glows red so the sign is visible at night.', zh: '停车牌上的灯会发红光，夜里也看得见。',
    tip: '找找停车牌旁边那盏红色的小灯。',
    principle: '红色光的波长最长，穿透雨雾的能力最强，所以警示灯几乎都用红色。'
  },
  /* ---- lights ---- */
  {
    id: 'lights.red', region: 'lights', name: 'Red warning lights', zhName: '红色警示灯',
    en: 'Pair of red lights flash while children are getting on or off.', zh: '上下车的时候，一对红灯一闪一闪。',
    tip: '数一数车顶上有几盏红灯。',
    principle: '红灯闪烁表示"车停住了、有人正在上下"。这时后面的车必须停在校车后面等待。'
  },
  {
    id: 'lights.amber', region: 'lights', name: 'Amber warning lights', zhName: '黄色预警灯',
    en: 'Amber lights flash first, warning drivers the bus is about to stop.', zh: '黄灯先闪，提醒后面的车：校车快要停了。',
    tip: '黄灯和红灯，哪一个先亮？',
    principle: '黄灯是"请注意"，红灯是"必须停"。两级预警让后车有时间慢慢减速，而不是猛踩刹车。'
  },
  {
    id: 'lights.bracket', region: 'lights', name: 'Light housing', zhName: '灯座',
    en: 'Each light sits in a black housing bolted to the roof.', zh: '每盏灯都装在一个黑色灯座里，固定在车顶上。',
    tip: '看看灯是怎么装在车顶上的。',
    principle: '灯座朝外微微倾斜，让光散得更开，从侧面也能被看见。'
  },
  /* ---- wheels ---- */
  {
    id: 'wheels.tire', region: 'wheels', name: 'Tires', zhName: '轮胎',
    en: 'Four black tires hold the whole bus up off the road.', zh: '四个黑轮胎把整辆车托离地面。',
    tip: '看看轮胎有多厚。',
    principle: '轮胎里的空气承受整车重量，同时靠变形贴合路面，把颠簸和噪声都吸掉。'
  },
  {
    id: 'wheels.tread', region: 'wheels', name: 'Tread', zhName: '花纹',
    en: 'Deep grooves in the rubber squeeze the rain away.', zh: '橡胶上深深的沟槽把雨水挤出去。',
    tip: '凑近看轮胎表面，有一圈圈的沟。',
    principle: '沟槽把轮胎下的水排走，橡胶才能直接碰到路面。沟磨平了就会打滑。'
  },
  {
    id: 'wheels.hub', region: 'wheels', name: 'Wheel hub', zhName: '轮毂',
    en: 'A shiny steel hub in the middle holds the wheel onto the axle.', zh: '亮亮的钢制轮毂在中间，把车轮固定在车轴上。',
    tip: '看看轮子中间那个亮亮的圆盘。',
    principle: '轮毂用一圈螺栓锁在车轴上，把轮子的受力传给车轴和悬架。'
  },
  {
    id: 'wheels.arch', region: 'wheels', name: 'Wheel arch', zhName: '轮罩',
    en: 'A curved arch over each wheel keeps the splash outside.', zh: '每个轮子上面有一道弯弯的轮罩，挡住溅起的水。',
    tip: '看看轮子上面那道弧线。',
    principle: '轮罩把泥水挡在车身外面，同时让车身看起来更圆润。'
  }
];
