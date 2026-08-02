/* ============================================================
   Penguin book interactive SVG overlays
   viewBox 1000x667, uses shared/overlays.js helpers
   Image: 1216x832, mapping: ovx = 12.6 + px/1216*974.8, ovy = py/832*667
   ============================================================ */
window.OVL = {
  penguin_cover: () => svgWrap(
    partSVG({px:350,py:600,lx:130,ly:600,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'a bird that cannot fly',factZh:'一种不会飞的鸟'}) +
    partSVG({px:600,py:150,lx:760,ly:150,anc:'start',name:'Sun',nameZh:'太阳',fact:'low in the polar sky',factZh:'低低地挂在极地天空'}) +
    partSVG({px:1050,py:530,lx:920,ly:530,anc:'start',name:'Ice',nameZh:'冰',fact:'penguins live on ice',factZh:'企鹅生活在冰上'})
  ),
  penguin_02: () => svgWrap(
    partSVG({px:320,py:600,lx:130,ly:600,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'a big happy group',factZh:'一个快乐的大家庭'}) +
    partSVG({px:820,py:290,lx:900,ly:290,anc:'start',name:'Iceberg',nameZh:'冰山',fact:'a giant floating ice mountain',factZh:'巨大的漂浮冰山'}) +
    partSVG({px:480,py:100,lx:350,ly:80,anc:'end',name:'Mountains',nameZh:'雪山',fact:'snowy peaks behind',factZh:'后面的雪峰'})
  ),
  penguin_03: () => svgWrap(
    partSVG({px:600,py:500,lx:760,ly:500,anc:'start',name:'Chick',nameZh:'企鹅宝宝',fact:'a fluffy baby penguin',factZh:'毛茸茸的小企鹅'}) +
    partSVG({px:430,py:440,lx:200,ly:400,anc:'end',name:'Papa Penguin',nameZh:'企鹅爸爸',fact:'takes care of the family',factZh:'照顾家人'}) +
    partSVG({px:770,py:440,lx:880,ly:400,anc:'start',name:'Mama Penguin',nameZh:'企鹅妈妈',fact:'finds food in the sea',factZh:'去海里找食物'})
  ),
  penguin_04: () => svgWrap(
    partSVG({px:580,py:660,lx:760,ly:660,anc:'start',name:'Egg',nameZh:'蛋',fact:'kept warm on dad\'s feet',factZh:'在爸爸脚上保暖'}) +
    partSVG({px:580,py:480,lx:240,ly:400,anc:'end',name:'Papa',nameZh:'爸爸',fact:'protects the egg from cold',factZh:'保护蛋不受冻'}) +
    partSVG({px:310,py:130,lx:130,ly:130,anc:'end',name:'Snowflake',nameZh:'雪花',fact:'gently falling down',factZh:'轻轻飘落'})
  ),
  penguin_05: () => svgWrap(
    partSVG({px:600,py:460,lx:800,ly:460,anc:'start',name:'Chick',nameZh:'小宝宝',fact:'breaking out of the egg',factZh:'破壳而出'}) +
    partSVG({px:330,py:400,lx:130,ly:400,anc:'end',name:'Parent',nameZh:'爸爸妈妈',fact:'so happy to meet baby',factZh:'很高兴见到宝宝'}) +
    partSVG({px:700,py:700,lx:780,ly:600,anc:'start',name:'Eggshell',nameZh:'蛋壳',fact:'broken into pieces',factZh:'碎成一片片'})
  ),
  penguin_06: () => svgWrap(
    partSVG({px:500,py:460,lx:200,ly:460,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'swimming like a torpedo',factZh:'像鱼雷一样游泳'}) +
    partSVG({px:750,py:440,lx:850,ly:440,anc:'start',name:'Fish',nameZh:'鱼',fact:'a tasty little fish',factZh:'一条美味的小鱼'}) +
    partSVG({px:290,py:420,lx:130,ly:230,anc:'end',name:'Bubbles',nameZh:'气泡',fact:'air from swimming fast',factZh:'快速游泳时产生的气泡'})
  ),
  penguin_07: () => svgWrap(
    partSVG({px:520,py:530,lx:760,ly:530,anc:'start',name:'Penguin',nameZh:'企鹅',fact:'sliding on its belly',factZh:'用肚子滑行'}) +
    partSVG({px:700,py:350,lx:760,ly:280,anc:'start',name:'Snow hill',nameZh:'雪坡',fact:'a fun slippery slide',factZh:'好玩的滑滑梯'}) +
    partSVG({px:110,py:380,lx:130,ly:200,anc:'end',name:'Trees',nameZh:'小树',fact:'cold weather friends',factZh:'寒冷天气里的朋友'})
  ),
  penguin_08: () => svgWrap(
    partSVG({px:600,py:460,lx:250,ly:460,anc:'end',name:'Feathers',nameZh:'羽毛',fact:'thick and waterproof',factZh:'又厚又防水'}) +
    partSVG({px:800,py:200,lx:850,ly:160,anc:'start',name:'Snow',nameZh:'雪',fact:'falls without getting wet inside',factZh:'落在外面不会打湿里面'}) +
    partSVG({px:1080,py:460,lx:920,ly:460,anc:'start',name:'Iceberg',nameZh:'冰山',fact:'home in the cold',factZh:'寒冷的家'})
  ),
  penguin_09: () => svgWrap(
    partSVG({px:520,py:580,lx:250,ly:580,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'waddling in a line',factZh:'排成一队摇摇摆摆地走'}) +
    partSVG({px:800,py:250,lx:720,ly:200,anc:'start',name:'Mountains',nameZh:'雪山',fact:'walk together to stay safe',factZh:'一起走更安全'}) +
    partSVG({px:200,py:700,lx:130,ly:620,anc:'end',name:'Footprints',nameZh:'脚印',fact:'left in the snow',factZh:'留在雪地上的脚印'})
  ),
  penguin_10: () => svgWrap(
    partSVG({px:600,py:200,lx:760,ly:160,anc:'start',name:'Aurora',nameZh:'极光',fact:'colorful lights in the sky',factZh:'天空中彩色的光'}) +
    partSVG({px:500,py:660,lx:250,ly:610,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'looking up in wonder',factZh:'惊奇地抬头看'}) +
    partSVG({px:150,py:460,lx:130,ly:560,anc:'end',name:'Iceberg',nameZh:'冰山',fact:'floating in dark water',factZh:'漂浮在黑暗的水中'})
  ),
  penguin_11: () => svgWrap(
    partSVG({px:570,py:410,lx:200,ly:330,anc:'end',name:'Child',nameZh:'小朋友',fact:'helps protect penguins',factZh:'帮助保护企鹅'}) +
    partSVG({px:430,py:600,lx:200,ly:540,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'our cute friend',factZh:'我们可爱的朋友'}) +
    partSVG({px:830,py:200,lx:920,ly:160,anc:'start',name:'Heart',nameZh:'爱心',fact:'love keeps them safe',factZh:'爱让它们安全'})
  ),
  penguin_12: () => svgWrap(
    partSVG({px:280,py:600,lx:130,ly:600,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'black and white swimmer',factZh:'黑白相间的游泳健将'}) +
    partSVG({px:520,py:660,lx:520,ly:580,anc:'middle',name:'Egg',nameZh:'蛋',fact:'a tiny penguin starts here',factZh:'小企鹅从这里开始'}) +
    partSVG({px:700,py:130,lx:920,ly:130,anc:'start',name:'Aurora',nameZh:'极光',fact:'magical sky light',factZh:'神奇的天空之光'})
  )
};
