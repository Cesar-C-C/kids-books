window.LAB_CONFIG = {
  id:'hsr', title:'高铁 3D 实验室', modelName:'高铁', englishName:'HIGH-SPEED TRAIN',
  brand:'LITTLE RAILWAYS', brandZh:'小小铁路工程师 · 探索实验室', icon:'🚄',
  subtitle:'从流线车头到车顶受电弓，看看电力怎样带着我们出发。', eyebrow:'LET’S DISCOVER · 03',
  camera:{yaw:-0.52,pitch:0.42,distance:17,explodeDistance:23,target:[0,0.2,0]}, floorY:-1.7,
  note:'教学简化的高铁头车，造型不对应特定品牌。受电弓位置因车型而异；车顶可拆是观察设计，真实车顶不会这样打开。',
  modelNote:'教学简化头车 · 不对应特定品牌 · 受电弓位置因车型而异 · 拆开车顶仅用于观察内部 · 铁轨是固定展示场景',
  sources:[
    {label:'Siemens · 高速列车车体与内部空间',url:'https://press.siemens.com/global/en/feature/velaro-novo-new-vehicle-concept-high-speed-trains'},
    {label:'Alstom · 牵引电机与齿轮传动',url:'https://www.alstom.com/mitrac-drive-motors-gearboxes-and-generators-enhanced-performance'},
    {label:'Schunk · 铁路受电弓与接触网',url:'https://www.schunk-group.com/transit-systems/en/products/pantographs-rail'},
    {label:'Alstom · 转向架与列车部件',url:'https://www.alstom.com/solutions/components-broadest-portfolio-serving-all-trains'}
  ]
};

window.LAB_PARTS = [
  {id:'body',name:'Train body',zhName:'流线车体',category:'SMOOTH AND STRONG',color:'#367c9e',en:'This is the body of the train. Its smooth nose helps air flow around it.',zh:'这是列车的车体。平滑的流线车头帮助空气从周围流过。',tip:'转到侧面，沿着长长的车头描一描它的曲线。',question:'Which part has a long, smooth nose?'},
  {id:'cab',name:'Driver’s cab',zhName:'驾驶室',category:'THE DRIVER’S PLACE',color:'#346479',en:'The driver sits here. The controls help the driver run the train.',zh:'司机坐在驾驶室里，使用操纵装置驾驶列车。',tip:'找车头上深蓝色的大风挡；它与乘客小窗户有什么不同？',question:'Where does the train driver sit?'},
  {id:'windows',name:'Passenger windows',zhName:'乘客车窗',category:'LOOK OUTSIDE',color:'#498da9',en:'We can look outside through these windows. What can you see on a train ride?',zh:'我们可以透过车窗看外面。坐火车时，你见过哪些风景？',tip:'转到侧面，数一数这一侧有几扇乘客车窗。',question:'What do passengers look through to see outside?'},
  {id:'roof',name:'Roof',zhName:'车顶',category:'OVER OUR HEADS',color:'#86979d',en:'The roof covers the carriage. It helps keep the rain outside.',zh:'车顶盖在车厢上方，帮助挡住雨水。',tip:'拆开模型，移开的长车顶下面，藏着什么？',question:'What covers the top of the carriage?'},
  {id:'seats',name:'Seats',zhName:'乘客座椅',category:'SIT AND TRAVEL',color:'#4c8a9a',en:'Passengers sit on these seats. There is a path between the rows.',zh:'乘客坐在这些座椅上。两边座椅之间留有走道。',tip:'拆开后切换俯视，找到座椅中间那条长走道。',question:'What do passengers sit on?'},
  {id:'doors',name:'Doors',zhName:'车门',category:'WELCOME ABOARD',color:'#be913d',en:'We use the doors to get on and off. Wait until the train stops and the doors open.',zh:'我们通过车门上下车。要等列车停稳、车门打开后再上下车。',tip:'找靠近车厢后端的两扇金色边框车门。',question:'What do we use to get on and off the train?'},
  {id:'bogies',name:'Bogies',zhName:'转向架',category:'WHEELS AND SUPPORT',color:'#667685',en:'These frames hold the wheels under the train. They support the carriage and help it follow curves.',zh:'这些架子装着车底的轮对，支撑车厢，也帮助列车通过弯道。',tip:'看车底的两个转向架：每个架子有两根车轴、四个车轮。',question:'Which frames hold the wheels under the train?'},
  {id:'motors',name:'Traction motors',zhName:'牵引电机',category:'ELECTRICITY TO MOTION',color:'#c57a42',en:'These motors use electricity. They turn the wheels through gears to move the train.',zh:'牵引电机使用电力，通过齿轮带动车轮转动，让列车行驶。',tip:'拆开模型，找到车底橙色电机和旁边的传动箱。',question:'What uses electricity to turn the wheels?'},
  {id:'pantograph',name:'Pantograph',zhName:'受电弓',category:'POWER FROM ABOVE',color:'#af7f34',en:'This arm reaches up from the roof. It takes electric power from a wire above the train.',zh:'受电弓从车顶向上伸出，接触列车上方的接触线，获取电力。',tip:'找到车顶折起来的金属臂和最上面的横条。模型没有画出接触线。',question:'What takes electric power from the wire above the train?'},
  {id:'coupler',name:'Coupler',zhName:'车钩',category:'JOIN TOGETHER',color:'#7d8294',en:'This part joins one carriage to another. It helps keep the train connected.',zh:'车钩把一节车厢与另一节车厢连接起来，让列车保持连接。',tip:'转到车厢尾端，找到下方伸出的短短连接器。',question:'What joins one carriage to another?'}
];
