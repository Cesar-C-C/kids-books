(function(root){
'use strict';
root.ROPEWAY_CONTENT=[
  {
    "id": "loop",
    "title": {
      "zh": "一根索，走一圈",
      "en": "One rope, one loop"
    },
    "text": {
      "zh": "驱动轮带着一根环形钢索走。区间里的吊厢夹住这根索，一起前进。",
      "en": "A drive wheel moves one endless rope. On the line, each cabin grips that rope and travels with it."
    },
    "sources": [
      1,
      6
    ]
  },
  {
    "id": "support",
    "title": {
      "zh": "先让轨道接住",
      "en": "The rail supports it first"
    },
    "text": {
      "zh": "进站时，吊厢上方的运行轮先进入轨道。轨道接住吊厢，它才可以松开钢索。",
      "en": "As the cabin enters the station, the running wheels above it move onto the station rail. The rail supports the cabin before the grip opens."
    },
    "sources": [
      3,
      12
    ]
  },
  {
    "id": "detach",
    "title": {
      "zh": "松开，但没有掉下来",
      "en": "Released, but still supported"
    },
    "text": {
      "zh": "抱索器，就是抓住钢索的夹子。夹子打开后，轨道托着吊厢，输送轮胎带着它前进。",
      "en": "The grip is the clamp that holds the rope. When it opens, the station rail supports the cabin and conveyor tires move it onward."
    },
    "sources": [
      1,
      3,
      4,
      12
    ]
  },
  {
    "id": "decelerate",
    "title": {
      "zh": "钢索快，吊厢慢",
      "en": "Fast rope, slower cabin"
    },
    "text": {
      "zh": "钢索继续走。吊厢松开钢索后，站内的输送轮胎让吊厢减速。",
      "en": "The rope keeps moving. After the grip releases the rope, the station's conveyor tires slow the cabin down."
    },
    "sources": [
      1,
      3,
      12
    ]
  },
  {
    "id": "board",
    "title": {
      "zh": "慢慢经过乘降区",
      "en": "Through the boarding area"
    },
    "text": {
      "zh": "吊厢低速经过乘降区，方便乘客上下。真实乘坐时，要听从工作人员的指引。",
      "en": "The cabin passes the boarding area slowly, making it easier to get on and off. On a real ride, follow the staff's instructions."
    },
    "sources": [
      1,
      9
    ]
  },
  {
    "id": "accelerate",
    "title": {
      "zh": "加速到和钢索一样快",
      "en": "Speed up to match the rope"
    },
    "text": {
      "zh": "离开乘降区后，输送轮胎让吊厢加速。吊厢对齐钢索，并达到和钢索一样的速度，然后再重新夹住它。",
      "en": "After leaving the boarding area, conveyor tires speed up the cabin. It lines up with the rope and reaches the same speed before gripping it again."
    },
    "sources": [
      1,
      3,
      12
    ]
  },
  {
    "id": "couple",
    "title": {
      "zh": "重新夹住",
      "en": "Grip the rope again"
    },
    "text": {
      "zh": "抱索器的钳口重新闭合，夹住钢索。夹住后，还要检查有没有正确夹紧。",
      "en": "The grip's jaw closes around the rope again. Next, the system checks whether it has gripped correctly."
    },
    "sources": [
      1,
      4,
      12
    ]
  },
  {
    "id": "check",
    "title": {
      "zh": "检查后，才离站",
      "en": "Checked before departure"
    },
    "text": {
      "zh": "检测装置检查重新夹紧的过程。只有检查正常，吊厢才继续离站。",
      "en": "Monitoring equipment checks the coupling process. The cabin continues out only when the checks are normal."
    },
    "sources": [
      1,
      2,
      3,
      12
    ]
  },
  {
    "id": "rollers",
    "title": {
      "zh": "小轮子，引导钢索",
      "en": "Small wheels guide the rope"
    },
    "text": {
      "zh": "支架上的轮组托住、引导钢索。去程和回程的钢索方向相反，两侧轮子也向相反方向转。",
      "en": "Sheave assemblies on the towers support and guide the rope. Opposite rope directions turn the two sets of sheaves in opposite directions."
    },
    "sources": [
      6
    ]
  },
  {
    "id": "tension",
    "title": {
      "zh": "会移动的驱动框架",
      "en": "A sliding drive frame"
    },
    "text": {
      "zh": "这是一种可移动驱动框架的配置。钢索长度变化时，框架移动，用来补偿变化。",
      "en": "This example has a sliding drive frame. As rope length changes, the frame can move to compensate."
    },
    "sources": [
      5
    ]
  },
  {
    "id": "monitor",
    "title": {
      "zh": "检查未通过，先停下",
      "en": "Failed check: stop first"
    },
    "text": {
      "zh": "这个例子里，夹紧检查没有通过。主驱动和站内输送一起减速停下，不让这辆吊厢继续离站。",
      "en": "In this example, the coupling check fails. The main drive and station conveyor slow down and stop together, so the cabin does not continue out of the station."
    },
    "sources": [
      2,
      9,
      12
    ]
  },
  {
    "id": "brakes",
    "title": {
      "zh": "两处制动，不是吊厢刹车",
      "en": "Two brake locations, not cabin brakes"
    },
    "text": {
      "zh": "这个配置的工作制动器作用在减速器输入端的飞轮，安全制动器作用在驱动轮。它们不是装在每个吊厢上的刹车。",
      "en": "In this configuration, the service brake acts on the flywheel at the gearbox input, and the safety brake acts on the drive wheel. They are not brakes on every cabin."
    },
    "sources": [
      5
    ]
  },
  {
    "id": "auxiliary",
    "title": {
      "zh": "辅助驱动，有条件使用",
      "en": "Auxiliary drive, with conditions"
    },
    "text": {
      "zh": "这个例子里，主驱动不能工作，但监测和控制仍可用，其他检查也正常。只有条件允许，辅助驱动才低速带回吊厢。这不代表可以恢复营业。真实处置由专业人员判断。",
      "en": "In this example, the main drive cannot work, but monitoring and controls are still available and the other checks are normal. Only when conditions allow can the auxiliary drive bring cabins back slowly. This does not mean passenger service can restart. Trained staff decide how to respond on a real ropeway."
    },
    "sources": [
      5,
      9
    ]
  },
  {
    "id": "care",
    "title": {
      "zh": "安全，还需要人的工作",
      "en": "Safety also needs people"
    },
    "text": {
      "zh": "安全不只靠传感器。专业人员还要检查、维护设备，并准备和演练救援预案。",
      "en": "Safety needs more than sensors. Professionals inspect and maintain the equipment, and prepare and practise rescue plans."
    },
    "sources": [
      9
    ]
  },
  {
    "id": "types",
    "title": {
      "zh": "钢索怎样分工？吊厢怎样走？",
      "en": "Rope jobs and cabin routes"
    },
    "text": {
      "zh": "本模型是单线循环式：同一根钢索既托住吊厢，又带着它走。双线用不同的索分担承载和牵引；三线用两根承载索和一根牵引索。“循环”和“往返”说的是另一件事：吊厢绕圈走，或在车站之间来回走。往复式也可以有不同的钢索配置。",
      "en": "This model is a monocable circulating gondola: the same rope both supports and pulls the cabin. Bicable systems use separate ropes for support and pulling; tricable systems use two carrying ropes and one haul rope. Circulating and reversible describe a different feature: cabins travel around a loop or shuttle between stations. Reversible ropeways can also use different rope arrangements."
    },
    "sources": [
      1,
      7,
      11,
      13
    ]
  },
  {
    "id": "limits",
    "title": {
      "zh": "这是机制示意",
      "en": "A mechanism model"
    },
    "text": {
      "zh": "模型放大了动作，省略了许多零件。它不计算真实载荷、张力、制动距离，也不是设备操作或救援指南。",
      "en": "This model enlarges movements and omits many parts. It does not calculate real loads, tension or stopping distance, and is not an operating or rescue guide."
    },
    "sources": []
  }
];
root.ROPEWAY_SOURCES=[
['LEITNER · Detachable gondola','https://www.leitner.com/en/products/ropeway-systems/detail/detachable-gondola-lifts/'],
['Doppelmayr · Detachable gondola brochure','https://www.doppelmayr.com/wp-content/uploads/2023/04/Detachable-Gondola-Lifts-EN.pdf'],
['Doppelmayr · DT station training','https://service.doppelmayr.com/training/course-list/detail/mechanical-course-ropeways-with-dt-grips-76/'],
['LEITNER · LPA grip','https://www.leitner.com/fileadmin//user_upload/pages/LPA_grip.pdf'],
['LEITNER · Overhead drive configuration','https://www.leitner.com/fileadmin//userdaten/00-home/Ordner-Facelift/PDF_s_Logo_neu/Antrieb_sheets/The_LEITNER_Drive_System_OverheadDrive.pdf'],
['LEITNER · Ropeway elements','https://www.leitner.com/en/company/useful-information/elements-of-ropeways/'],
['LEITNER · 3S','https://www.leitner.com/en/products/ropeway-systems/detail/tricable-gondola-lifts/'],
['Ngong Ping 360 · Historical bicable maintenance example','https://www.np360.com.hk/media/ox4k25nt/20161109rope-replacement-project-press-release-stage-2-3-eng-final.pdf'],
['SAMR · Passenger ropeway safety management (2025)','https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2025/art_6f21963fcb7e46c3a2002b5016e5c9e9.html'],
['GB 12352-2018 · Official metadata only','https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=D4BB0B81D40B2FFD69A796B7D6DDE952'],
['LEITNER · Aerial tramways','https://www.leitner.com/en/products/ropeway-systems/detail/aerial-tramways/'],
['LEITNER · Station conveyor and coupling mechanisms','https://www.leitner.com/fileadmin//userdaten/00-home/Ordner-Facelift/PDF_s_Logo_neu/Compact_station/The_LEITNER_Station_.pdf'],
['LEITNER · 2S carrying and hauling mechanisms','https://www.leitner.com/fileadmin//userdaten/01-produkte/Seilbahnsysteme/Drei-_und_Zweiseilumlaufbahnen/Bicable_gondola_lifts.pdf']
];
})(typeof window==='undefined'?globalThis:window);
