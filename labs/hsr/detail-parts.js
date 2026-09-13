// Child-facing labels for the same-page train cutaway. Every `id` here is a
// detail group the geometry actually publishes under that region, so the panel,
// the outline and the picking all share one vocabulary.
// Geometry is schematic: one motor and one gear stage stand for the drive of a
// bogie, and a short length of catenary shows where the pantograph collects.
window.HSR_DETAILS = [
  {
    id: 'cab.seat', region: 'cab', name: 'Driver’s seat', zhName: '司机座椅',
    en: 'The driver sits here and watches the track ahead.', zh: '司机坐在这里，注视前方的线路。',
    tip: '靠近车头，在大风挡后面的操纵台上找到这张座椅。',
    principle: '驾驶室在列车最前端。司机通过挡风玻璃看线路和信号，座椅可以前后、上下调整，方便看清前方。'
  },
  {
    id: 'cab.desk', region: 'cab', name: 'Driver’s desk', zhName: '操纵台',
    en: 'The driver controls the train from this desk.', zh: '司机在这里操纵列车。',
    tip: '在座椅前方找到斜面的台子和上面的手柄。',
    principle: '操纵台上集中了牵引手柄、制动阀和各路开关。高速列车还有列车自动防护系统，在超速时自动干预。'
  },
  {
    id: 'cab.displays', region: 'cab', name: 'Displays', zhName: '显示屏',
    en: 'These screens show the speed and the signals.', zh: '这些屏幕显示速度和信号。',
    tip: '找出操纵台上三块向司机倾斜的屏幕。',
    principle: '屏幕给出速度、限速、信号和前方线路状态。司机主要靠仪表信息开车，这一点和飞机驾驶舱的作用很像。'
  },
  {
    id: 'body.skin', region: 'body', name: 'Body shell', zhName: '车体骨架',
    en: 'The body is a strong tube that carries the load.', zh: '车体是一个坚固的筒形结构，承担载荷。',
    tip: '打开剖面，找出沿车身排列的一圈圈环梁和纵向长梁。',
    principle: '高速列车车体常用铝合金中空型材焊接成筒形结构。环形梁保持截面形状，纵向梁传递纵向力，蒙皮也一起承力。'
  },
  {
    id: 'body.floor', region: 'body', name: 'Cabin floor', zhName: '车厢地板',
    en: 'The floor carries the seats and hides the equipment.', zh: '地板托住座椅，也把设备藏在下面。',
    tip: '从侧面看车厢底部的横梁和纵向梁。',
    principle: '地板由纵向梁和横向梁组成，重量经由车体传给转向架。地板下布置电缆、制动管路和设备箱。'
  },
  {
    id: 'body.luggage', region: 'body', name: 'Luggage rack', zhName: '行李架',
    en: 'Bags ride above the seats.', zh: '行李放在座椅上方的架子上。',
    tip: '转到车厢侧面，找车窗上方那条长长的行李架和支撑臂。',
    principle: '行李架固定在车体内侧，用支撑臂把重量传到侧墙。行李放在架子上不挡走道，也要放稳，免得列车晃动时掉下来。'
  },
  {
    id: 'roof.unit', region: 'roof', name: 'Air-conditioning unit', zhName: '车顶空调机组',
    en: 'The air-conditioning unit sits on the roof.', zh: '空调机组安装在车顶上。',
    tip: '抬起车顶，找出长方形机组和上面的两个散热风扇。',
    principle: '车顶机组把车外空气处理到合适的温度和湿度，再送进车厢。放在车顶既不占客室空间，也远离乘客。'
  },
  {
    id: 'roof.duct', region: 'roof', name: 'Supply duct', zhName: '送风风道',
    en: 'Treated air travels through these ducts.', zh: '处理好的空气通过风道送进车厢。',
    tip: '沿着车顶内侧找两条长长的风道和下面的出风口。',
    principle: '机组把处理好的空气送进车顶风道，再从出风口送到每位乘客身边；回风沿车厢两侧回到车顶机组，形成循环。'
  },
  {
    id: 'windows.pane', region: 'windows', name: 'Window glazing', zhName: '车窗玻璃',
    en: 'The glass lets light in and keeps noise out.', zh: '车窗让光进来，也把噪声挡在外面。',
    tip: '打开剖面，找到车窗里侧另一层薄玻璃。',
    principle: '高速列车车窗多用多层夹胶安全玻璃。列车进出隧道时车外气压会突然变化，密封条和厚玻璃能减轻耳朵的不适。'
  },
  {
    id: 'windows.shade', region: 'windows', name: 'Window blind', zhName: '遮阳帘',
    en: 'This blind rolls down to block the sun.', zh: '遮阳帘拉下来挡住阳光。',
    tip: '拖动动作滑杆，看遮阳帘慢慢落下。',
    principle: '遮阳帘卷在车窗上方的卷轴里，可以停在任意高度。它挡住直射的阳光，但不影响车厢的通风。'
  },
  {
    id: 'seats.cushion', region: 'seats', name: 'Seat cushion', zhName: '坐垫',
    en: 'The cushion is soft, and a frame holds it up.', zh: '坐垫是软的，下面的骨架托住它。',
    tip: '打开剖面，找出坐垫里的软垫和下面的支撑。',
    principle: '坐垫由软垫和下面的金属骨架组成。软垫分散身体的压力，骨架把重量传给地板上的固定点。'
  },
  {
    id: 'seats.back', region: 'seats', name: 'Seat back', zhName: '椅背',
    en: 'The seat back supports your back.', zh: '椅背支撑着你的背。',
    tip: '看剖面里椅背内部一排排横条。',
    principle: '椅背里有支架和横条，外面包软垫。椅背要有一定强度，列车紧急减速时能承受来自乘客的冲击力。'
  },
  {
    id: 'doors.leaf', region: 'doors', name: 'Door leaf and seal', zhName: '门扇与密封条',
    en: 'This door slides along the side of the train to open.', zh: '门扇沿车身滑开。',
    tip: '拖动动作滑杆，看门扇沿车身滑开；门边一圈黑条就是密封条。',
    principle: '车门由电机驱动，可以内藏或外塞式开合。门边的橡胶密封条在运行中把门缝封住，既挡风挡雨，也能保持车内气压。'
  },
  {
    id: 'doors.sensor', region: 'doors', name: 'Door sensor and light', zhName: '门控感应与指示灯',
    en: 'Sensors watch the doorway before the doors close.', zh: '关门之前，感应器会留意门口。',
    tip: '找车门旁边竖着的感应条和上面的小灯。',
    principle: '门控系统靠光幕或感应条判断门口有没有人或行李，确认安全才关门。门边的灯提示车门的状态。'
  },
  {
    id: 'bogies.frame', region: 'bogies', name: 'Bogie frame', zhName: '转向架构架',
    en: 'This H-shaped frame carries the wheels.', zh: '这个 H 形架子承载车轮。',
    tip: '从下方看，找两个大 H 形的钢架。',
    principle: '构架是转向架的骨架，把两个轮对连在一起。它传递牵引力和制动力，也承受车体的重量，再把重量分给各个车轮。'
  },
  {
    id: 'bogies.wheelset', region: 'bogies', name: 'Wheelset', zhName: '轮对',
    en: 'One axle joins two wheels into a wheelset.', zh: '一根车轴把两个车轮连成一组轮对。',
    tip: '找车轴和两端的车轮；车轮内侧有一圈凸出的轮缘。',
    principle: '轮对由车轴和两个车轮压装而成。车轮内侧的轮缘卡在钢轨内侧，配合钢轨的斜面，让列车自动保持在轨道中央。'
  },
  {
    id: 'bogies.airspring', region: 'bogies', name: 'Air spring', zhName: '空气弹簧',
    en: 'Air springs make the ride smooth.', zh: '空气弹簧让列车行驶得更平稳。',
    tip: '在构架上方找两个圆鼓鼓的橡胶气囊。',
    principle: '空气弹簧里是压缩空气，能随载荷变化自动调整高度，把车体托住并吸收振动。它和车轮上方的一系钢弹簧一起工作。'
  },
  {
    id: 'motors.motor', region: 'motors', name: 'Traction motor', zhName: '牵引电机',
    en: 'These motors turn electricity into motion.', zh: '牵引电机把电变成运动。',
    tip: '打开剖面，找电机里的铜绕组和中间的转子。',
    principle: '牵引电机是三相交流电机。定子绕组通电后产生旋转磁场，带着转子转动，再通过齿轮把力矩传给车轴。'
  },
  {
    id: 'motors.gearbox', region: 'motors', name: 'Gearbox', zhName: '齿轮传动箱',
    en: 'The gearbox slows the motor but adds force.', zh: '齿轮箱让转速降下来，力矩升上去。',
    tip: '找电机旁的小齿轮和车轴上的大齿轮。',
    principle: '电机转速高、力矩小，车轮需要转速低、力矩大。小齿轮带动车轴上的大齿轮，转速降低、力矩放大，正好用来驱动列车。'
  },
  {
    id: 'motors.cooling', region: 'motors', name: 'Cooling duct', zhName: '冷却风道',
    en: 'Air flows through here to cool the motors.', zh: '空气从这里流过，给电机降温。',
    tip: '找电机上方的风道和两端的圆形风扇。',
    principle: '电机和齿轮箱工作时会发热。冷却风道把外部的空气引到电机外壳和散热片上，把热量带走，防止过热。'
  },
  {
    id: 'panto.insulator', region: 'pantograph', name: 'Insulator', zhName: '绝缘子',
    en: 'These parts hold the live arm above the roof.', zh: '这些部件把带电的弓臂架在车顶之上。',
    tip: '找车顶基座上四个带一圈圈伞裙的柱子。',
    principle: '受电弓带有高压电，必须和车顶绝缘。绝缘子做成一圈圈伞裙，加长表面的距离，防止电流沿着表面爬回车顶。'
  },
  {
    id: 'panto.arm', region: 'pantograph', name: 'Folding arm', zhName: '折叠弓臂',
    en: 'The arms fold and unfold to reach the wire.', zh: '弓臂折叠或张开，去接触上方的接触线。',
    tip: '拖动动作滑杆，看弓臂抬起、折叠的样子。',
    principle: '弓臂是一套连杆机构，由气缸或升弓弹簧提供向上的推力，让弓头始终贴住上方的接触线。接触线高度会变化，弓臂随之升降。'
  },
  {
    id: 'panto.head', region: 'pantograph', name: 'Collector head', zhName: '弓头滑板',
    en: 'The collector head slides along the wire.', zh: '弓头沿着接触线滑动。',
    tip: '找最上面的横条和两端的小滑块。',
    principle: '弓头的滑板常用碳或粉末冶金材料做成，耐磨又能导电。列车高速行驶时滑板贴着接触线滑动取电，同时要尽量减小摩擦和噪声。'
  },
  {
    id: 'coupler.head', region: 'coupler', name: 'Coupler head', zhName: '车钩钩头',
    en: 'The coupler head locks onto the next carriage.', zh: '车钩钩头把下一节车厢锁住。',
    tip: '转到车厢后端，找伸出来的钩头。',
    principle: '高速列车多用密接式车钩，两节车之间几乎贴合。钩头里有锁紧机构，连挂时自动锁住，牵引和制动时都不会脱开。'
  },
  {
    id: 'coupler.buffer', region: 'coupler', name: 'Energy absorber', zhName: '缓冲吸能装置',
    en: 'This absorbs the push between carriages.', zh: '它吸收车厢之间互相推挤的力量。',
    tip: '看钩头后面一层层叠起来的圆片。',
    principle: '车钩后面装着橡胶或可压溃的吸能元件。列车连挂或受到撞击时，它通过变形吸收冲击能量，减少传到乘客身上的力。'
  }
];
