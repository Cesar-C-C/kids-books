/* Ocean — interactive overlay SVGs (BUBBLE-MODE hotspots, v2).
   All px/py are IMAGE pixel coordinates (1216 x 832).
   shared/overlays.js auto-converts px/py to SVG viewBox.
   BUBBLE MODE: every partSVG carries line + lineZh (first-person speech
   line) + lineKey (unique key for the pre-generated line MP3). No leader
   lines / SVG labels — the reader pops an HTML speech bubble with name +
   line + fact. Coordinates calibrated page-by-page with GLM vision assist. */
window.OVL = {
  sunlight(){
    const parts=[
      {name:'Sun', nameZh:'太阳', fact:'The sun gives light and warmth to the ocean.', factZh:'太阳给海洋带来光和温暖。', px:560,py:100,
       line:"I'm the Sun — I paint the ocean with warm light!", lineZh:'我是太阳，把海洋照得暖暖亮亮的！', lineKey:'sunlight_0'},
      {name:'Wave', nameZh:'海浪', fact:'Waves move water and make the ocean dance.', factZh:'海浪让海水动起来，像跳舞一样。', px:250,py:500,
       line:"Wheee! I'm a Wave, dancing across the sea!", lineZh:'嘻嘻！我是海浪，在海上跳舞！', lineKey:'sunlight_1'},
      {name:'Fish', nameZh:'小鱼', fact:'Fish swim in the sunlight zone where it is bright.', factZh:'小鱼在阳光充足的浅海区游来游去。', px:650,py:520,
       line:"I'm a little Fish, zooming through the sunny water!", lineZh:'我是小鱼，在亮亮的水里嗖嗖游！', lineKey:'sunlight_2'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  coral(){
    const parts=[
      {name:'Clownfish', nameZh:'小丑鱼', fact:'A small orange fish that likes to hide in coral.', factZh:'小丑鱼是一种喜欢躲在珊瑚里的小鱼。', px:200,py:330,
       line:"I'm a Clownfish — I hide in coral to stay safe!", lineZh:'我是小丑鱼，躲在珊瑚里最安全！', lineKey:'coral_0'},
      {name:'Turtle', nameZh:'海龟', fact:'A sea turtle swims slowly and can live for many years.', factZh:'海龟游得很慢，可以活很多年。', px:720,py:300,
       line:"I'm a Turtle, swimming slowly and living long!", lineZh:'我是海龟，慢慢游，能活好久好久！', lineKey:'coral_1'},
      {name:'Coral', nameZh:'珊瑚', fact:'Coral looks like a plant but is made of tiny animals.', factZh:'珊瑚看起来像植物，其实是许多小动物组成的。', px:500,py:680,
       line:"I'm Coral — lots of tiny animals make me up!", lineZh:'我是珊瑚，是好多小动物一起变出来的！', lineKey:'coral_2'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  kelp(){
    const parts=[
      {name:'Seahorse', nameZh:'海马', fact:'A tiny horse-shaped fish that holds onto seaweed.', factZh:'海马长得像小马，会抓住海藻。', px:500,py:420,
       line:"I'm a Seahorse — I hold on tight to the seaweed!", lineZh:'我是海马，紧紧抓着海藻不放！', lineKey:'kelp_0'},
      {name:'Kelp', nameZh:'海藻', fact:'Tall seaweed that grows like a forest underwater.', factZh:'海藻长得很高，像水下的森林。', px:150,py:400,
       line:"I'm Kelp, a tall underwater forest!", lineZh:'我是海藻，像水下的高高森林！', lineKey:'kelp_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  twilight(){
    const parts=[
      {name:'Whale shark', nameZh:'鲸鲨', fact:'The biggest fish in the sea, gentle and spotty.', factZh:'鲸鲨是海里最大的鱼，性情温和、身上长满斑点。', px:480,py:430,
       line:"I'm the Whale Shark — the biggest, gentlest fish!", lineZh:'我是鲸鲨，最大最温柔的鱼！', lineKey:'twilight_0'},
      {name:'Jellyfish', nameZh:'水母', fact:'A soft see-through animal with trailing tentacles.', factZh:'水母是柔软透明、拖着触手的动物。', px:720,py:220,
       line:"I'm a Jellyfish, soft and see-through with wiggly arms!", lineZh:'我是水母，软软透明，触手一扭一扭！', lineKey:'twilight_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  angler(){
    const parts=[
      {name:'Anglerfish', nameZh:'鮟鱇鱼', fact:'A deep-sea fish with a glowing lure to find food.', factZh:'鮟鱇鱼住在深海，用发光的小灯找食物。', px:500,py:460,
       line:"I'm the Anglerfish — my light helps me find dinner!", lineZh:'我是鮟鱇鱼，我的小灯帮我找吃的！', lineKey:'angler_0'},
      {name:'Lure', nameZh:'小灯', fact:'The glowing dot on its head is like a tiny flashlight.', factZh:'它头上的小灯就像一支小手电筒。', px:700,py:170,
       line:"I'm the Lure, a tiny flashlight on its head!", lineZh:'我是小灯，挂在它头上的小手电筒！', lineKey:'angler_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  midnight(){
    const parts=[
      {name:'Jellyfish', nameZh:'水母', fact:'A soft animal that glows blue in the dark midnight zone.', factZh:'在漆黑的午夜区里发出蓝光的柔软动物。', px:200,py:250,
       line:"I'm a Jellyfish glowing blue in the dark!", lineZh:'我是水母，在黑暗里发出蓝光！', lineKey:'midnight_0'},
      {name:'Squid', nameZh:'乌贼', fact:'A fast swimmer with glowing spots in the dark.', factZh:'乌贼游得很快，在黑暗中会发光。', px:530,py:380,
       line:"I'm a Squid, fast and sparkly in the midnight!", lineZh:'我是乌贼，在午夜区飞快又闪闪的！', lineKey:'midnight_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  abyss(){
    const parts=[
      {name:'Sea cucumber', nameZh:'海参', fact:'A soft animal shaped like a cucumber on the seafloor.', factZh:'海参是海底一种像黄瓜一样软软的动物。', px:230,py:470,
       line:"I'm a Sea Cucumber, soft and calm on the seafloor!", lineZh:'我是海参，在海底软软地趴着！', lineKey:'abyss_0'},
      {name:'Tube worm', nameZh:'管虫', fact:'A long red worm that lives near deep-sea vents.', factZh:'管虫是住在深海热泉旁边的红色长虫。', px:800,py:470,
       line:"I'm a Tube Worm living by the deep hot vents!", lineZh:'我是管虫，住在深海热泉边！', lineKey:'abyss_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  vents(){
    const parts=[
      {name:'Vent', nameZh:'热泉', fact:'A hot chimney on the seafloor that bubbles warm water.', factZh:'热泉是海底一个冒着热水的烟囱。', px:500,py:420,
       line:"I'm a Vent — a chimney bubbling warm water!", lineZh:'我是热泉，像冒热水的海底烟囱！', lineKey:'vents_0'},
      {name:'Crab', nameZh:'螃蟹', fact:'A crab with strong claws walks on the seafloor.', factZh:'螃蟹有强壮的钳子，在海底爬行。', px:700,py:620,
       line:"I'm a Crab, clicking my claws as I walk!", lineZh:'我是螃蟹，挥着钳子在海底走！', lineKey:'vents_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  trench(){
    const parts=[
      {name:'Snailfish', nameZh:'狮子鱼', fact:'A tiny fish that lives in the deepest, darkest ocean.', factZh:'狮子鱼住在最深最暗的海洋里。', px:500,py:460,
       line:"I'm the Snailfish — I live where it's deepest and darkest!", lineZh:'我是狮子鱼，住在最深最暗的地方！', lineKey:'trench_0'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  matters(){
    const parts=[
      {name:'Child', nameZh:'小朋友', fact:'Children love the ocean and help keep it clean.', factZh:'小朋友们喜欢海洋，也会帮忙保护海洋。', px:300,py:480,
       line:"I'm a Child — I love the ocean and keep it clean!", lineZh:'我是小朋友，喜欢海洋，也保护它！', lineKey:'matters_0'},
      {name:'Ocean', nameZh:'海洋', fact:'The ocean gives us air, food, and a beautiful home.', factZh:'海洋给我们空气、食物和美丽的家园。', px:700,py:520,
       line:"I'm the Ocean — I give you air, food, and home!", lineZh:'我是海洋，给你空气、食物和家！', lineKey:'matters_1'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
};
