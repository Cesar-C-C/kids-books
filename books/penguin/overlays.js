/* ============================================================
   Penguin book interactive SVG overlays (BUBBLE-MODE hotspots, v2).
   viewBox 1000x667, uses shared/overlays.js helpers.
   Image pixels 1216x832 (shared/overlays.js converts).
   Every hotspot carries line + lineZh (first-person speech) + lineKey.
   No leader lines / SVG labels. Coordinates calibrated with GLM vision.
   ============================================================ */
window.OVL = {
  penguin_02: () => svgWrap(
    partSVG({px:350,py:600,name:'Penguins',nameZh:'企鹅',fact:'a big happy group',factZh:'一个快乐的大家庭',
      line:"We're Penguins — a big happy family!", lineZh:'我们是企鹅，一个快乐的大家庭！', lineKey:'penguin_02_0'}) +
    partSVG({px:800,py:290,name:'Iceberg',nameZh:'冰山',fact:'a giant floating ice mountain',factZh:'巨大的漂浮冰山',
      line:"I'm an Iceberg — a giant floating ice mountain!", lineZh:'我是冰山，一座巨大的漂浮冰山！', lineKey:'penguin_02_1'}) +
    partSVG({px:480,py:140,name:'Mountains',nameZh:'雪山',fact:'snowy peaks behind',factZh:'后面的雪峰',
      line:"We're Snowy Mountains — white peaks behind the ice!", lineZh:'我们是雪山，冰后面的白色山峰！', lineKey:'penguin_02_2'})
  ),
  penguin_03: () => svgWrap(
    partSVG({px:600,py:500,name:'Chick',nameZh:'企鹅宝宝',fact:'a fluffy baby penguin',factZh:'毛茸茸的小企鹅',
      line:"I'm a Chick — a fluffy baby penguin!", lineZh:'我是企鹅宝宝，毛茸茸的小企鹅！', lineKey:'penguin_03_0'}) +
    partSVG({px:430,py:440,name:'Papa Penguin',nameZh:'企鹅爸爸',fact:'takes care of the family',factZh:'照顾家人',
      line:"I'm Papa Penguin — I take care of my family!", lineZh:'我是企鹅爸爸，照顾着我的家人！', lineKey:'penguin_03_1'}) +
    partSVG({px:770,py:440,name:'Mama Penguin',nameZh:'企鹅妈妈',fact:'finds food in the sea',factZh:'去海里找食物',
      line:"I'm Mama Penguin — I find food in the sea!", lineZh:'我是企鹅妈妈，去海里找食物！', lineKey:'penguin_03_2'})
  ),
  penguin_04: () => svgWrap(
    partSVG({px:580,py:660,name:'Egg',nameZh:'蛋',fact:'kept warm on dad\'s feet',factZh:'在爸爸脚上保暖',
      line:"I'm the Egg — kept warm on Papa's feet!", lineZh:'我是蛋，在爸爸脚上暖暖地待着！', lineKey:'penguin_04_0'}) +
    partSVG({px:580,py:480,name:'Papa',nameZh:'爸爸',fact:'protects the egg from cold',factZh:'保护蛋不受冻',
      line:"I'm Papa — I protect the egg from the cold!", lineZh:'我是爸爸，保护蛋不受冻！', lineKey:'penguin_04_1'}) +
    partSVG({px:310,py:130,name:'Snowflake',nameZh:'雪花',fact:'gently falling down',factZh:'轻轻飘落',
      line:"I'm a Snowflake — gently falling down!", lineZh:'我是雪花，轻轻地飘下来！', lineKey:'penguin_04_2'})
  ),
  penguin_05: () => svgWrap(
    partSVG({px:600,py:460,name:'Chick',nameZh:'小宝宝',fact:'breaking out of the egg',factZh:'破壳而出',
      line:"I'm the Chick — I'm breaking out of the egg!", lineZh:'我是小宝宝，正在破壳而出！', lineKey:'penguin_05_0'}) +
    partSVG({px:330,py:400,name:'Parent',nameZh:'爸爸妈妈',fact:'so happy to meet baby',factZh:'很高兴见到宝宝',
      line:"I'm the Parent — so happy to meet baby!", lineZh:'我是爸爸妈妈，见到宝宝好开心！', lineKey:'penguin_05_1'}) +
    partSVG({px:700,py:700,name:'Eggshell',nameZh:'蛋壳',fact:'broken into pieces',factZh:'碎成一片片',
      line:"I'm the Eggshell — broken into tiny pieces!", lineZh:'我是蛋壳，碎成一片片！', lineKey:'penguin_05_2'})
  ),
  penguin_06: () => svgWrap(
    partSVG({px:500,py:460,name:'Penguin',nameZh:'企鹅',fact:'swimming like a torpedo',factZh:'像鱼雷一样游泳',
      line:"I'm a Penguin — I swim like a torpedo!", lineZh:'我是企鹅，像鱼雷一样游泳！', lineKey:'penguin_06_0'}) +
    partSVG({px:750,py:440,name:'Fish',nameZh:'鱼',fact:'a tasty little fish',factZh:'一条美味的小鱼',
      line:"I'm a Fish — a tasty little snack!", lineZh:'我是小鱼，美味的小点心！', lineKey:'penguin_06_1'}) +
    partSVG({px:290,py:420,name:'Bubbles',nameZh:'气泡',fact:'air from swimming fast',factZh:'快速游泳时产生的气泡',
      line:"We're Bubbles — air from swimming fast!", lineZh:'我们是气泡，快速游泳时产生的！', lineKey:'penguin_06_2'})
  ),
  penguin_07: () => svgWrap(
    partSVG({px:520,py:530,name:'Penguin',nameZh:'企鹅',fact:'sliding on its belly',factZh:'用肚子滑行',
      line:"I'm a Penguin — I slide on my belly!", lineZh:'我是企鹅，用肚子滑行！', lineKey:'penguin_07_0'}) +
    partSVG({px:800,py:400,name:'Snow hill',nameZh:'雪坡',fact:'a fun slippery slide',factZh:'好玩的滑滑梯',
      line:"I'm a Snow Hill — a fun slippery slide!", lineZh:'我是雪坡，好玩的滑滑梯！', lineKey:'penguin_07_1'}) +
    partSVG({px:25,py:420,name:'Trees',nameZh:'小树',fact:'cold weather friends',factZh:'寒冷天气里的朋友',
      line:"We're Little Trees — cold-weather friends!", lineZh:'我们是小树，寒冷天气里的朋友！', lineKey:'penguin_07_2'})
  ),
  penguin_08: () => svgWrap(
    partSVG({px:600,py:460,name:'Feathers',nameZh:'羽毛',fact:'thick and waterproof',factZh:'又厚又防水',
      line:"I'm Feathers — thick and waterproof!", lineZh:'我是羽毛，又厚又防水！', lineKey:'penguin_08_0'}) +
    partSVG({px:800,py:200,name:'Snow',nameZh:'雪',fact:'falls without getting wet inside',factZh:'落在外面不会打湿里面',
      line:"I'm Snow — I fall but don't wet the penguin!", lineZh:'我是雪，落在外面不会打湿企鹅！', lineKey:'penguin_08_1'}) +
    partSVG({px:1080,py:460,name:'Iceberg',nameZh:'冰山',fact:'home in the cold',factZh:'寒冷的家',
      line:"I'm an Iceberg — a cozy home in the cold!", lineZh:'我是冰山，寒冷里的家！', lineKey:'penguin_08_2'})
  ),
  penguin_09: () => svgWrap(
    partSVG({px:520,py:580,name:'Penguins',nameZh:'企鹅',fact:'waddling in a line',factZh:'排成一队摇摇摆摆地走',
      line:"We're Penguins — waddling in a line!", lineZh:'我们是企鹅，排成一队摇摇摆摆地走！', lineKey:'penguin_09_0'}) +
    partSVG({px:800,py:350,name:'Mountains',nameZh:'雪山',fact:'walk together to stay safe',factZh:'一起走更安全',
      line:"We're Mountains — walking together keeps us safe!", lineZh:'我们是雪山，一起走更安全！', lineKey:'penguin_09_1'}) +
    partSVG({px:200,py:750,name:'Footprints',nameZh:'脚印',fact:'left in the snow',factZh:'留在雪地上的脚印',
      line:"We're Footprints — left in the snow!", lineZh:'我们是脚印，留在雪地上！', lineKey:'penguin_09_2'})
  ),
  penguin_10: () => svgWrap(
    partSVG({px:600,py:200,name:'Aurora',nameZh:'极光',fact:'colorful lights in the sky',factZh:'天空中彩色的光',
      line:"I'm the Aurora — colorful lights in the sky!", lineZh:'我是极光，天空中彩色的光！', lineKey:'penguin_10_0'}) +
    partSVG({px:500,py:660,name:'Penguins',nameZh:'企鹅',fact:'looking up in wonder',factZh:'惊奇地抬头看',
      line:"We're Penguins — looking up in wonder!", lineZh:'我们是企鹅，惊奇地抬头看！', lineKey:'penguin_10_1'}) +
    partSVG({px:150,py:460,name:'Iceberg',nameZh:'冰山',fact:'floating in dark water',factZh:'漂浮在黑暗的水中',
      line:"I'm an Iceberg — floating in dark water!", lineZh:'我是冰山，漂浮在黑暗的水中！', lineKey:'penguin_10_2'})
  ),
  penguin_11: () => svgWrap(
    partSVG({px:570,py:410,name:'Child',nameZh:'小朋友',fact:'helps protect penguins',factZh:'帮助保护企鹅',
      line:"I'm a Child — I help protect penguins!", lineZh:'我是小朋友，帮助保护企鹅！', lineKey:'penguin_11_0'}) +
    partSVG({px:430,py:600,name:'Penguin',nameZh:'企鹅',fact:'our cute friend',factZh:'我们可爱的朋友',
      line:"I'm a Penguin — your cute friend!", lineZh:'我是企鹅，你可爱的朋友！', lineKey:'penguin_11_1'}) +
    partSVG({px:830,py:200,name:'Heart',nameZh:'爱心',fact:'love keeps them safe',factZh:'爱让它们安全',
      line:"I'm a Heart — love keeps penguins safe!", lineZh:'我是爱心，爱让企鹅安全！', lineKey:'penguin_11_2'})
  ),
  penguin_12: () => svgWrap(
    partSVG({px:280,py:600,name:'Penguin',nameZh:'企鹅',fact:'black and white swimmer',factZh:'黑白相间的游泳健将',
      line:"I'm a Penguin — a black-and-white swimmer!", lineZh:'我是企鹅，黑白相间的游泳健将！', lineKey:'penguin_12_0'}) +
    partSVG({px:520,py:660,name:'Egg',nameZh:'蛋',fact:'a tiny penguin starts here',factZh:'小企鹅从这里开始',
      line:"I'm an Egg — a tiny penguin starts here!", lineZh:'我是蛋，小企鹅从这里开始！', lineKey:'penguin_12_1'}) +
    partSVG({px:700,py:230,name:'Aurora',nameZh:'极光',fact:'magical sky light',factZh:'神奇的天空之光',
      line:"I'm the Aurora — magical sky light!", lineZh:'我是极光，神奇的天空之光！', lineKey:'penguin_12_2'})
  )
};
