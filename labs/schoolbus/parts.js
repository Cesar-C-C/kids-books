window.LAB_CONFIG = {
  id:'schoolbus',title:'校车 3D 实验室',modelName:'校车',englishName:'SCHOOL BUS',
  brand:'LITTLE SCHOOL RIDES',brandZh:'小小校车观察员 · 探索实验室',icon:'🚌',
  subtitle:'打开黄色车顶，看看座椅、安全带和驾驶室怎样装进一辆校车。',eyebrow:'LET’S DISCOVER · 04',
  camera:{yaw:-2.62,pitch:.38,distance:16,explodeDistance:23,target:[0,.1,0]},floorY:-2.28,
  modelNote:'美式长头、前置发动机校车教学示意 · 本模型选配安全带，实际校车配置可能不同',
  note:'教学模型以美式长头、前置发动机校车为例，并选配安全带；停车臂、灯具和车内配置因车型与地区而异。拆解仅用于观察，真实乘车请听从司机和随车成人指引。',
  sources:[{label:'NHTSA · School Bus Safety（美国校车、安全带与上下车安全）',url:'https://www.nhtsa.gov/road-safety/school-bus-safety'}]
};
window.LAB_PARTS = [
  {id:'body',name:'Bus body',zhName:'车身',category:'A YELLOW SHELL',color:'#d5a628',en:'This yellow body surrounds the bus cabin. Look through its windows!',zh:'黄色车身围出乘坐空间，窗户让我们看到外面。这是美式长头校车的教学示例，侧面的红色停车臂是这类校车的一种安全装置。',tip:'找到黑色腰线、长长的车头和侧面红色八角牌，再拆开车身看里面。',question:'Which yellow shell surrounds the bus cabin?'},
  {id:'roof',name:'Roof',zhName:'车顶',category:'A COVER ABOVE',color:'#d8ae37',en:'The roof covers the bus from above. Lift our model roof to peek inside!',zh:'车顶从上方遮住车厢。抬起模型的车顶，就能看到座椅和中间的通道。',tip:'点击拆解，从上方观察车顶下面藏着几排座椅。',question:'Which cover is above all the passenger seats?'},
  {id:'seats',name:'Seats',zhName:'座椅',category:'SIT TO RIDE',color:'#398d7b',en:'The seats stand in rows. We sit facing the front of the bus.',zh:'座椅一排排排列，乘车时面朝车头坐好。这类大校车使用较高、间距较小的座椅靠背，帮助保护乘客。',tip:'切换俯视，找到两列座椅中间留出的通道。',question:'What do the children sit on during the ride?'},
  {id:'belts',name:'Seat belts',zhName:'安全带',category:'BUCKLE UP',color:'#df8a46',en:'Our model has seat belts. Ask an adult to help you buckle up.',zh:'这辆模型配有安全带，乘坐配备安全带的校车时请成人帮助正确系好。真实校车的安全带配置会因车型和地区而不同。',tip:'拆开座椅，找一找橙色肩带、横向腰带和红色带扣。',question:'Which straps can you buckle around your body?'},
  {id:'door',name:'Entry door',zhName:'乘客门与台阶',category:'STEP INSIDE',color:'#478eac',en:'This door is beside the steps. Wait for the driver before you get on.',zh:'乘客门旁有上车台阶。等车完全停稳、车门打开，并得到司机示意后再上下车；扶好扶手。',tip:'转到乘客门一侧，看看两片折叠门和带防滑边的三级台阶。',question:'Which opening do children use to board the bus?'},
  {id:'cockpit',name:'Driver’s area',zhName:'驾驶区',category:'THE DRIVER’S PLACE',color:'#43879a',en:'The driver sits at the front. A steering wheel helps the driver turn the bus.',zh:'司机坐在前方驾驶区，用方向盘控制车辆转向。前面还有仪表和驾驶座。',tip:'掀开车顶找到圆形方向盘，再找司机前方用来观察道路的玻璃。',question:'Where does the driver sit and use the steering wheel?'},
  {id:'chassis',name:'Chassis',zhName:'底盘',category:'A FRAME BELOW',color:'#6a7788',en:'This strong frame is under the bus. It supports the body and other parts.',zh:'底盘位于车厢下方，支撑车身并连接许多部件。模型里能看到两根纵梁和横向支撑。',tip:'从下方观察两根长梁，沿着它们找到前后车轴。',question:'Which strong frame supports the bus from below?'},
  {id:'wheels',name:'Wheels',zhName:'车轮',category:'ROLL ALONG',color:'#586d7b',en:'The wheels roll along the road. Rubber tires cover their rims.',zh:'车轮沿路面滚动，外圈包着橡胶轮胎。这辆模型的后轴两侧各有并排的双轮。',tip:'从车后下方观察，比较前轮和后轮的数量。',question:'Which round parts roll along the road?'},
  {id:'engine',name:'Engine',zhName:'发动机',category:'POWER AT THE FRONT',color:'#ce7952',en:'Our bus has an engine under the front hood. It gives the bus power to move.',zh:'这辆示例校车的发动机在前方发动机罩下面，为行驶提供动力。其他校车也可能采用不同的动力系统或布置。',tip:'拆开长长的前罩，找到橙色发动机和前面的深色散热器。',question:'What gives this bus power from under the front hood?'},
  {id:'mirrors',name:'Mirrors',zhName:'后视镜与观察镜',category:'HELP THE DRIVER SEE',color:'#8c95a1',en:'These mirrors help the driver look around the bus. Stay where the driver can see you.',zh:'车旁的镜子帮助司机观察周围，但车辆附近仍有看不见的区域。上下车听从成人指引，不要在车旁追跑。',tip:'找找车身两侧的长方形镜子，以及车头前方两面小圆镜。',question:'Which shiny parts help the driver look around the bus?'}
];
