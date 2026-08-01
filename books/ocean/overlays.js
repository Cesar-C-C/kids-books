/* Ocean — interactive overlay SVGs */
window.OVL = {
  sunlight(){
    const parts=[
      {name:'Sun', nameZh:'太阳', fact:'The sun gives light and warmth to the ocean.', factZh:'太阳给海洋带来光和温暖。', px:500,py:120, lx:200,ly:90, anc:'start'},
      {name:'Wave', nameZh:'海浪', fact:'Waves move water and make the ocean dance.', factZh:'海浪让海水动起来，像跳舞一样。', px:250,py:500, lx:120,ly:600, anc:'start'},
      {name:'Fish', nameZh:'小鱼', fact:'Fish swim in the sunlight zone where it is bright.', factZh:'小鱼在阳光充足的浅海区游来游去。', px:620,py:520, lx:880,ly:600, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  coral(){
    const parts=[
      {name:'Clownfish', nameZh:'小丑鱼', fact:'A small orange fish that likes to hide in coral.', factZh:'小丑鱼是一种喜欢躲在珊瑚里的小鱼。', px:250,py:330, lx:120,ly:120, anc:'start'},
      {name:'Turtle', nameZh:'海龟', fact:'A sea turtle swims slowly and can live for many years.', factZh:'海龟游得很慢，可以活很多年。', px:720,py:330, lx:880,ly:120, anc:'end'},
      {name:'Coral', nameZh:'珊瑚', fact:'Coral looks like a plant but is made of tiny animals.', factZh:'珊瑚看起来像植物，其实是许多小动物组成的。', px:500,py:580, lx:500,ly:630, anc:'middle'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  kelp(){
    const parts=[
      {name:'Seahorse', nameZh:'海马', fact:'A tiny horse-shaped fish that holds onto seaweed.', factZh:'海马长得像小马，会抓住海藻。', px:500,py:450, lx:500,ly:120, anc:'middle'},
      {name:'Kelp', nameZh:'海藻', fact:'Tall seaweed that grows like a forest underwater.', factZh:'海藻长得很高，像水下的森林。', px:150,py:450, lx:120,ly:120, anc:'start'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  twilight(){
    const parts=[
      {name:'Whale shark', nameZh:'鲸鲨', fact:'The biggest fish in the sea, gentle and spotty.', factZh:'鲸鲨是海里最大的鱼，性情温和、身上长满斑点。', px:480,py:450, lx:500,ly:120, anc:'middle'},
      {name:'Jellyfish', nameZh:'水母', fact:'A soft see-through animal with trailing tentacles.', factZh:'水母是柔软透明、拖着触手的动物。', px:720,py:220, lx:850,ly:120, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  angler(){
    const parts=[
      {name:'Anglerfish', nameZh:'鮟鱇鱼', fact:'A deep-sea fish with a glowing lure to find food.', factZh:'鮟鱇鱼住在深海，用发光的小灯找食物。', px:500,py:500, lx:200,ly:120, anc:'start'},
      {name:'Lure', nameZh:'小灯', fact:'The glowing dot on its head is like a tiny flashlight.', factZh:'它头上的小灯就像一支小手电筒。', px:530,py:180, lx:800,ly:120, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  midnight(){
    const parts=[
      {name:'Jellyfish', nameZh:'水母', fact:'A soft animal that glows blue in the dark midnight zone.', factZh:'在漆黑的午夜区里发出蓝光的柔软动物。', px:230,py:330, lx:120,ly:120, anc:'start'},
      {name:'Squid', nameZh:'乌贼', fact:'A fast swimmer with glowing spots in the dark.', factZh:'乌贼游得很快，在黑暗中会发光。', px:530,py:450, lx:850,ly:600, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  abyss(){
    const parts=[
      {name:'Sea cucumber', nameZh:'海参', fact:'A soft animal shaped like a cucumber on the seafloor.', factZh:'海参是海底一种像黄瓜一样软软的动物。', px:230,py:430, lx:120,ly:600, anc:'start'},
      {name:'Tube worm', nameZh:'管虫', fact:'A long red worm that lives near deep-sea vents.', factZh:'管虫是住在深海热泉旁边的红色长虫。', px:800,py:430, lx:880,ly:600, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  vents(){
    const parts=[
      {name:'Vent', nameZh:'热泉', fact:'A hot chimney on the seafloor that bubbles warm water.', factZh:'热泉是海底一个冒着热水的烟囱。', px:500,py:420, lx:200,ly:120, anc:'start'},
      {name:'Crab', nameZh:'螃蟹', fact:'A crab with strong claws walks on the seafloor.', factZh:'螃蟹有强壮的钳子，在海底爬行。', px:700,py:620, lx:800,ly:120, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  trench(){
    const parts=[
      {name:'Snailfish', nameZh:'狮子鱼', fact:'A tiny fish that lives in the deepest, darkest ocean.', factZh:'狮子鱼住在最深最暗的海洋里。', px:500,py:430, lx:500,ly:120, anc:'middle'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
  matters(){
    const parts=[
      {name:'Child', nameZh:'小朋友', fact:'Children love the ocean and help keep it clean.', factZh:'小朋友们喜欢海洋，也会帮忙保护海洋。', px:260,py:520, lx:150,ly:120, anc:'start'},
      {name:'Ocean', nameZh:'海洋', fact:'The ocean gives us air, food, and a beautiful home.', factZh:'海洋给我们空气、食物和美丽的家园。', px:750,py:500, lx:850,ly:120, anc:'end'},
    ];
    return svgWrap(parts.map(partSVG).join(''));
  },
};
