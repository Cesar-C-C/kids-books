/* ============================================================
   Penguin book interactive SVG overlays
   viewBox 1000x667, uses shared/overlays.js helpers
   ============================================================ */
window.OVL = {
  penguin_cover: () => svgWrap(
    partSVG({px:300,py:420,lx:150,ly:420,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'a bird that cannot fly',factZh:'一种不会飞的鸟'}) +
    partSVG({px:520,py:150,lx:650,ly:150,anc:'start',name:'Sun',nameZh:'太阳',fact:'low in the polar sky',factZh:'低低地挂在极地天空'}) +
    partSVG({px:780,py:500,lx:900,ly:500,anc:'start',name:'Ice',nameZh:'冰',fact:'penguins live on ice',factZh:'企鹅生活在冰上'})
  ),
  penguin_02: () => svgWrap(
    partSVG({px:300,py:500,lx:150,ly:500,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'a big happy group',factZh:'一个快乐的大家庭'}) +
    partSVG({px:720,py:260,lx:880,ly:260,anc:'start',name:'Iceberg',nameZh:'冰山',fact:'a giant floating ice mountain',factZh:'巨大的漂浮冰山'}) +
    partSVG({px:500,py:120,lx:350,ly:150,anc:'end',name:'Mountains',nameZh:'雪山',fact:'snowy peaks behind',factZh:'后面的雪峰'})
  ),
  penguin_03: () => svgWrap(
    partSVG({px:520,py:360,lx:760,ly:360,anc:'start',name:'Chick',nameZh:'企鹅宝宝',fact:'a fluffy baby penguin',factZh:'毛茸茸的小企鹅'}) +
    partSVG({px:220,py:350,lx:120,ly:380,anc:'end',name:'Papa Penguin',nameZh:'企鹅爸爸',fact:'takes care of the family',factZh:'照顾家人'}) +
    partSVG({px:780,py:350,lx:880,ly:380,anc:'start',name:'Mama Penguin',nameZh:'企鹅妈妈',name:'Mama Penguin',fact:'finds food in the sea',factZh:'去海里找食物'})
  ),
  penguin_04: () => svgWrap(
    partSVG({px:500,py:560,lx:760,ly:560,anc:'start',name:'Egg',nameZh:'蛋',fact:'kept warm on dad\'s feet',factZh:'在爸爸脚上保暖'}) +
    partSVG({px:360,py:300,lx:120,ly:300,anc:'end',name:'Papa',nameZh:'爸爸',fact:'protects the egg from cold',factZh:'保护蛋不受冻'}) +
    partSVG({px:180,py:120,lx:120,ly:150,anc:'end',name:'Snowflake',nameZh:'雪花',fact:'gently falling down',factZh:'轻轻飘落'})
  ),
  penguin_05: () => svgWrap(
    partSVG({px:580,py:380,lx:800,ly:380,anc:'start',name:'Chick',nameZh:'小宝宝',fact:'breaking out of the egg',factZh:'破壳而出'}) +
    partSVG({px:280,py:320,lx:120,ly:320,anc:'end',name:'Parent',nameZh:'爸爸妈妈',fact:'so happy to meet baby',factZh:'很高兴见到宝宝'}) +
    partSVG({px:560,py:580,lx:760,ly:580,anc:'start',name:'Eggshell',nameZh:'蛋壳',fact:'broken into pieces',factZh:'碎成一片片'})
  ),
  penguin_06: () => svgWrap(
    partSVG({px:450,py:380,lx:200,ly:380,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'swimming like a torpedo',factZh:'像鱼雷一样游泳'}) +
    partSVG({px:650,py:420,lx:850,ly:420,anc:'start',name:'Fish',nameZh:'鱼',fact:'a tasty little fish',factZh:'一条美味的小鱼'}) +
    partSVG({px:180,py:200,lx:120,ly:230,anc:'end',name:'Bubbles',nameZh:'气泡',fact:'air from swimming fast',factZh:'快速游泳时产生的气泡'})
  ),
  penguin_07: () => svgWrap(
    partSVG({px:520,py:420,lx:760,ly:420,anc:'start',name:'Penguin',nameZh:'企鹅',fact:'sliding on its belly',factZh:'用肚子滑行'}) +
    partSVG({px:520,py:220,lx:760,ly:220,anc:'start',name:'Snow hill',nameZh:'雪坡',fact:'a fun slippery slide',factZh:'好玩的滑滑梯'}) +
    partSVG({px:150,py:150,lx:120,ly:180,anc:'end',name:'Trees',nameZh:'小树',fact:'cold weather friends',factZh:'寒冷天气里的朋友'})
  ),
  penguin_08: () => svgWrap(
    partSVG({px:500,py:340,lx:250,ly:340,anc:'end',name:'Feathers',nameZh:'羽毛',fact:'thick and waterproof',factZh:'又厚又防水'}) +
    partSVG({px:500,py:140,lx:750,ly:140,anc:'start',name:'Snow',nameZh:'雪',fact:'falls without getting wet inside',factZh:'落在外面不会打湿里面'}) +
    partSVG({px:850,py:500,lx:920,ly:500,anc:'start',name:'Iceberg',nameZh:'冰山',fact:'home in the cold',factZh:'寒冷的家'})
  ),
  penguin_09: () => svgWrap(
    partSVG({px:450,py:470,lx:250,ly:470,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'waddling in a line',factZh:'排成一队摇摇摆摆地走'}) +
    partSVG({px:500,py:200,lx:720,ly:200,anc:'start',name:'Mountains',nameZh:'雪山',fact:'walk together to stay safe',factZh:'一起走更安全'}) +
    partSVG({px:150,py:350,lx:120,ly:380,anc:'end',name:'Footprints',nameZh:'脚印',fact:'left in the snow',factZh:'留在雪地上的脚印'})
  ),
  penguin_10: () => svgWrap(
    partSVG({px:500,py:180,lx:760,ly:180,anc:'start',name:'Aurora',nameZh:'极光',fact:'colorful lights in the sky',factZh:'天空中彩色的光'}) +
    partSVG({px:500,py:530,lx:250,ly:530,anc:'end',name:'Penguins',nameZh:'企鹅',fact:'looking up in wonder',factZh:'惊奇地抬头看'}) +
    partSVG({px:150,py:550,lx:120,ly:580,anc:'end',name:'Iceberg',nameZh:'冰山',fact:'floating in dark water',factZh:'漂浮在黑暗的水中'})
  ),
  penguin_11: () => svgWrap(
    partSVG({px:430,py:420,lx:200,ly:420,anc:'end',name:'Child',nameZh:'小朋友',fact:'helps protect penguins',factZh:'帮助保护企鹅'}) +
    partSVG({px:430,py:560,lx:200,ly:560,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'our cute friend',factZh:'我们可爱的朋友'}) +
    partSVG({px:800,py:150,lx:920,ly:150,anc:'start',name:'Heart',nameZh:'爱心',fact:'love keeps them safe',factZh:'爱让它们安全'})
  ),
  penguin_12: () => svgWrap(
    partSVG({px:250,py:450,lx:120,ly:450,anc:'end',name:'Penguin',nameZh:'企鹅',fact:'black and white swimmer',factZh:'黑白相间的游泳健将'}) +
    partSVG({px:520,py:420,lx:520,ly:560,anc:'middle',name:'Egg',nameZh:'蛋',fact:'a tiny penguin starts here',factZh:'小企鹅从这里开始'}) +
    partSVG({px:800,py:400,lx:920,ly:400,anc:'start',name:'Aurora',nameZh:'极光',fact:'magical sky light',factZh:'神奇的天空之光'})
  )
};
