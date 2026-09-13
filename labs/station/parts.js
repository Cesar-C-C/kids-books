/* Little Space Station — the 10 landmark parts of the picture-book station.
   One entry per assembly in v3/stationframe.js; the studio builds its region
   list from this file, so keep it in the same order as the model. */
window.STATION_PARTS = [
  {
    id: 'modules', name: 'Modules', zhName: '舱段', category: 'THE OUTSIDE',
    color: '#cfd2d4', en: 'The station is built from round modules joined end to end — each one is a room in space.',
    zh: '太空站由一节节圆筒舱段首尾连起来，每一节就是太空里的一个房间。',
    tip: '沿着圆筒从这头看到那头，数一数一共有几节舱段。'
  },
  {
    id: 'node', name: 'Connecting node', zhName: '连接节点', category: 'THE OUTSIDE',
    color: '#dcdfe0', en: 'Where the modules meet, a round node with hatches lets astronauts walk from room to room.',
    zh: '舱段相接的地方有一个圆圆的节点，上面的舱门让人可以一间间走过去。',
    tip: '找到舱段和舱段之间那个圆球，看看上面开几扇门。'
  },
  {
    id: 'solar', name: 'Solar wings', zhName: '太阳能翼', category: 'POWER',
    color: '#2f4b8f', en: 'Two huge wings of dark blue panels turn sunlight into all the electricity the station needs.',
    zh: '两片巨大的深蓝色板翼把阳光变成电，供整个太空站使用。',
    tip: '数一数每片翅膀分成几块板，它们朝向同一个方向吗？'
  },
  {
    id: 'truss', name: 'Spine truss', zhName: '主桁架', category: 'POWER',
    color: '#b9bcbe', en: 'A long framework, the truss, carries the wings and holds them out away from the rooms.',
    zh: '一条长长的桁架把两片翅膀撑在离舱段很远的地方。',
    tip: '看这条细细的骨架，它为什么把翅膀撑得那么远？'
  },
  {
    id: 'arm', name: 'Robot arm', zhName: '机械臂', category: 'WORKING',
    color: '#e4e6e5', en: 'A long arm with joints and a gripper reaches out to catch and hold visiting spacecraft.',
    zh: '带关节和抓手的机械臂可以伸出去，抓住来访的飞船。',
    tip: '拖动滑杆，看这条长手臂怎样弯起来去够东西。'
  },
  {
    id: 'docking', name: 'Docking port', zhName: '对接端口', category: 'WORKING',
    color: '#b08a3c', en: 'A ringed port on the nose of a module is the doorway where ships click onto the station.',
    zh: '舱段前端的环形端口就是飞船“咔嗒”一声连上太空站的门。',
    tip: '找一找舱段前端那个带一圈圈的圆环，飞船就是连在这里的。'
  },
  {
    id: 'cupola', name: 'Cupola', zhName: '穹顶观察窗', category: 'LOOKING OUT',
    color: '#3f6b93', en: 'A bubble of windows looks straight down — astronauts watch Earth and guide the robot arm from here.',
    zh: '一圈玻璃围成的小圆顶朝下看，宇航员在这里看地球、也在这里操控机械臂。',
    tip: '找到朝下开的那圈小窗，猜猜从这里能看到什么。'
  },
  {
    id: 'windows', name: 'Portholes', zhName: '舷窗', category: 'LOOKING OUT',
    color: '#4a7ba6', en: 'Every module has its own round portholes, so there is always a window to the stars.',
    zh: '每一节舱段上都有圆圆的小舷窗，抬头就能看见星星。',
    tip: '数一数一节舱上有几个舷窗，什么形状的？'
  },
  {
    id: 'interior', name: 'Cabin inside', zhName: '舱内生活区', category: 'THE INSIDE',
    color: '#8b8d6c', en: 'Inside, lockers and racks line the curved wall: sleeping bag, table, treadmill and the plant box.',
    zh: '舱内沿弧形墙面排满柜子和设备：睡袋、餐桌、跑步机，还有种菜的小盒子。',
    tip: '走近舱内，找一找睡袋、餐桌和那个种菜的小盒子。'
  },
  {
    id: 'radiator', name: 'Radiators', zhName: '散热板', category: 'POWER',
    color: '#e2e4e3', en: 'Pale flat panels throw away the heat the station makes, so nothing inside gets too hot.',
    zh: '浅色的平板把站内产生的热带走扔进太空，舱内才不会太热。',
    tip: '找一找和太阳能翼长得不一样的那几片白板，它们是做什么用的？'
  }
];
