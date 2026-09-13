// Child-facing labels for the same-page airplane cutaway.
// Geometry is schematic: one engine shaft shows the connection, and the gear
// bay marks the storage location; gear retraction is not animated.
window.AIRPLANE_DETAILS = [
  {
    id: 'engine.inlet', region: 'engines', name: 'Inlet', zhName: '进气口',
    en: 'Air enters the engine here.', zh: '空气从这里进入发动机。',
    tip: '放大发动机，转到前方，找到大圆口。',
    principle: '进气口把空气引向风扇。'
  },
  {
    id: 'engine.fan', region: 'engines', name: 'Fan', zhName: '风扇',
    en: 'The fan moves air toward the back.', zh: '风扇让空气向后流动。',
    tip: '放大前方的大叶片，拖动机构滑杆，观察叶片转动。',
    principle: '风扇推动空气，一部分进入核心，另一部分绕过核心。'
  },
  {
    id: 'engine.bypass', region: 'engines', name: 'Bypass duct', zhName: '外涵道',
    en: 'This air travels around the engine core.', zh: '这里的空气绕着发动机核心流动。',
    tip: '点击“打开发动机罩”，找到核心外侧的通道。',
    principle: '外涵空气不经过燃烧室，也帮助产生向前的推力。'
  },
  {
    id: 'engine.compressor', region: 'engines', name: 'Compressor', zhName: '压气机',
    en: 'The compressor squeezes the air.', zh: '压气机把空气压缩。',
    tip: '打开结构并放大，找出风扇后方排列的小叶片。',
    principle: '旋转叶片和固定叶片配合，让进入燃烧室前的空气压力升高。'
  },
  {
    id: 'engine.combustor', region: 'engines', name: 'Combustor', zhName: '燃烧室',
    en: 'Fuel mixes with air and burns here.', zh: '燃料在这里与空气混合并燃烧。',
    tip: '点击“打开结构”，找到压气机后方的燃烧室，再放大看看。',
    principle: '燃料燃烧为气流增加能量；模型的暖色用来表示加热。'
  },
  {
    id: 'engine.turbine', region: 'engines', name: 'Turbine', zhName: '涡轮',
    en: 'Hot gas turns the turbine.', zh: '热气体推动涡轮转动。',
    tip: '打开结构，拖动机构滑杆，比较涡轮与前方叶片的转动。',
    principle: '涡轮通过转轴驱动前方部件。这里用单轴简化展示连接关系。'
  },
  {
    id: 'engine.shaft', region: 'engines', name: 'Shaft', zhName: '转轴',
    en: 'The shaft connects turning parts.', zh: '转轴连接会转动的部件。',
    tip: '打开结构并放大中心细轴，拖动机构滑杆，观察前后连接。',
    principle: '轴传递旋转动力。模型只画一根轴，实际发动机可以有多根同心轴。'
  },
  {
    id: 'engine.nozzle', region: 'engines', name: 'Nozzle', zhName: '喷口',
    en: 'Gas leaves the engine at the back.', zh: '气体从发动机后方排出。',
    tip: '放大发动机并转到后方，比较喷口与前方进气口。',
    principle: '发动机把空气向后推，空气也给发动机向前的推力。'
  },
  {
    id: 'cabin.frames', region: 'fuselage', name: 'Body frames', zhName: '机身框架',
    en: 'These frames help hold the body in shape.', zh: '这些框架帮助机身保持形状。',
    tip: '点击“打开机舱”，放大看看一圈圈的框架。',
    principle: '框架与机身的其他结构一起承受力量，支撑机身外形。'
  },
  {
    id: 'cabin.floor', region: 'fuselage', name: 'Cabin floor', zhName: '客舱地板',
    en: 'The floor supports people and seats.', zh: '地板支撑乘客和座椅。',
    tip: '打开机舱，转到侧面，找到座椅下方的地板。',
    principle: '地板和支撑结构把乘客、座椅的重量传给机身结构。'
  },
  {
    id: 'cabin.seats', region: 'fuselage', name: 'Passenger seats', zhName: '乘客座椅',
    en: 'Passengers sit in these seats.', zh: '乘客坐在这些座椅上。',
    tip: '打开结构并放大客舱，找一找座椅之间的过道。',
    principle: '座椅固定在地板结构上，让乘客有自己的乘坐位置。'
  },
  {
    id: 'cabin.cargo', region: 'fuselage', name: 'Cargo hold', zhName: '货舱',
    en: 'Bags travel below the cabin floor.', zh: '行李在客舱地板下方旅行。',
    tip: '打开机舱，放大地板下面，找到行李所在的位置。',
    principle: '这架客机的货舱位于客舱下方，用来容纳行李和货物。'
  },
  {
    id: 'cockpit.seats', region: 'cockpit', name: 'Pilot seats', zhName: '飞行员座椅',
    en: 'The pilots sit at the front.', zh: '飞行员坐在飞机前方。',
    tip: '放大机头并打开结构，找到驾驶舱里的两把座椅。',
    principle: '飞行员坐在能够观察窗外、仪表和操纵装置的位置。'
  },
  {
    id: 'cockpit.panel', region: 'cockpit', name: 'Instrument panel', zhName: '仪表板',
    en: 'These displays show how the airplane is flying.', zh: '这些显示屏告诉飞行员飞机的飞行情况。',
    tip: '打开驾驶舱并放大，找到座椅前面的仪表板。',
    principle: '仪表显示速度、高度等信息，帮助飞行员了解飞机状态。'
  },
  {
    id: 'cockpit.controls', region: 'cockpit', name: 'Flight controls', zhName: '操纵装置',
    en: 'Pilots use controls to guide the airplane.', zh: '飞行员使用操纵装置驾驶飞机。',
    tip: '打开驾驶舱，放大座椅前方，找出操纵装置。',
    principle: '操纵输入通过飞机的控制系统，让相应的活动翼面改变位置。'
  },
  {
    id: 'wing.spar', region: 'wings', name: 'Wing spar', zhName: '翼梁',
    en: 'A strong beam runs along the wing.', zh: '一根结实的梁沿着机翼伸展。',
    tip: '移开固定蒙皮并放大，沿着长长的翼梁看向翼尖。',
    principle: '翼梁是机翼的主要承力结构之一，帮助承受机翼的弯曲。'
  },
  {
    id: 'wing.ribs', region: 'wings', name: 'Wing ribs', zhName: '翼肋',
    en: 'These ribs help shape the wing.', zh: '这些翼肋帮助机翼保持形状。',
    tip: '点击“打开结构”，放大看看沿机翼排列的一片片翼肋。',
    principle: '翼肋与翼梁、蒙皮共同组成机翼结构，并支撑机翼的截面形状。'
  },
  {
    id: 'wing.flap', region: 'wings', name: 'Flap', zhName: '襟翼',
    en: 'Flaps help the wings make lift at low speeds.', zh: '襟翼帮助机翼在低速时产生升力。',
    tip: '放大机翼后缘，拖动机构滑杆，观察襟翼的位置变化。',
    principle: '放下襟翼会改变机翼形状，提高低速升力能力，通常也增加阻力。'
  },
  {
    id: 'wing.slat', region: 'wings', name: 'Slat', zhName: '前缘缝翼',
    en: 'Slats help the wings make lift at low speeds.', zh: '前缘缝翼帮助机翼在低速时产生升力。',
    tip: '放大机翼前缘，拖动机构滑杆，找一找缝翼展开后的缝隙。',
    principle: '展开的缝翼帮助气流贴随机翼表面，延缓失速；它也会改变阻力。'
  },
  {
    id: 'wing.spoiler', region: 'wings', name: 'Spoiler', zhName: '扰流板',
    en: 'These panels rise to reduce lift.', zh: '这些板抬起来时会减小升力。',
    tip: '从上方放大机翼，拖动机构滑杆，观察翼面上的板抬起。',
    principle: '扰流板改变机翼上方的气流，减小升力并增加阻力。'
  },
  {
    id: 'gear.strut', region: 'gear', name: 'Landing gear strut', zhName: '起落架支柱',
    en: 'The strut supports the airplane on the ground.', zh: '支柱在地面上支撑飞机。',
    tip: '放大飞机下方，找到支柱上的粗细套筒和连接轮轴的连杆。',
    principle: '支柱连接机体和轮组，并帮助缓冲着陆冲击。这里展示结构位置。'
  },
  {
    id: 'gear.wheel', region: 'gear', name: 'Wheel and tire', zhName: '机轮与轮胎',
    en: 'The wheels let the airplane roll.', zh: '机轮让飞机能够在地面滚动。',
    tip: '放大轮胎并转到侧面，拖动机构滑杆，观察车轮绕轮轴转动。',
    principle: '轮胎接触地面，机轮能够绕轮轴转动，支撑飞机在地面移动。'
  },
  {
    id: 'gear.brake', region: 'gear', name: 'Wheel brake', zhName: '机轮刹车',
    en: 'Brakes help slow the wheels down.', zh: '刹车帮助机轮减速。',
    tip: '放大机翼下的主轮，从轮组内侧找一找刹车片和连接管。',
    principle: '主起落架的刹车通过摩擦让机轮减速，把一部分运动能量变成热。'
  },
  {
    id: 'gear.bay', region: 'gear', name: 'Landing gear bay', zhName: '起落架舱',
    en: 'The wheels tuck into a space inside the airplane.', zh: '机轮收进飞机内部的一处空间。',
    tip: '沿着支柱向上看，找到舱口与两侧舱门的位置示意。',
    principle: '起落架收起后藏进舱内，帮助减少飞行阻力。这里标出舱口位置，不演示收放。'
  }
,
{"id": "fin.spar", "region": "fin", "name": "Tail frame", "zhName": "垂直尾翼骨架", "en": "Spars and ribs support the upright tail.", "zh": "梁与肋支撑竖直的尾翼。", "tip": "沿竖直的梁找一找横向翼肋。", "principle": "蒙皮、梁和肋共同承力，后缘连接方向舵。"},
{"id": "stabilizer.spar", "region": "stabilizers", "name": "Tailplane spar", "zhName": "水平尾翼翼梁", "en": "A spar supports each horizontal tailplane.", "zh": "翼梁支撑每侧水平尾翼。", "tip": "移开固定蒙皮，从翼根沿翼梁看到翼尖。", "principle": "水平尾翼的梁把空气作用力传向机身。"},
{"id": "aileron.hinge", "region": "ailerons", "name": "Aileron hinge", "zhName": "副翼铰链", "en": "Ailerons turn around hinges at the wing edge.", "zh": "副翼绕机翼后缘的铰链转动。", "tip": "播放动作，比较左右副翼相反的偏转。", "principle": "两侧副翼的相反偏转改变两翼升力，帮助飞机滚转。"},
{"id": "aileron.linkage", "region": "ailerons", "name": "Control linkage", "zhName": "副翼传动连杆", "en": "A short linkage moves the aileron.", "zh": "一根短连杆带动副翼。", "tip": "找到铰链旁的连接杆，再播放副翼动作。", "principle": "操纵系统通过作动装置和连接机构带动活动翼面。"},
{"id": "elevator.hinge", "region": "elevators", "name": "Elevator hinge", "zhName": "升降舵铰链", "en": "Elevators turn together on the tail.", "zh": "两侧升降舵一起在尾部偏转。", "tip": "观察水平尾翼后缘，两侧升降舵朝相同方向偏转。", "principle": "升降舵改变尾部的空气作用力，帮助控制俯仰。"},
{"id": "rudder.hinge", "region": "rudder", "name": "Rudder hinge", "zhName": "方向舵铰链", "en": "The rudder swings left and right.", "zh": "方向舵可以向左、向右偏转。", "tip": "找到竖直的铰链线，再播放动作。", "principle": "方向舵改变尾部的侧向空气作用力，帮助控制偏航。"}
];
