/* ============================================================
   Seed book interactive SVG overlays
   viewBox 1000x667, uses shared/overlays.js helpers
   ============================================================ */
window.OVL = {
  seed_cover: () => svgWrap(
    partSVG({px:720,py:130,lx:820,ly:130,anc:'start',name:'Sun',nameZh:'太阳',fact:'gives warmth and light',factZh:'给种子温暖和光亮'}) +
    partSVG({px:500,py:520,lx:620,ly:520,anc:'start',name:'Seed',nameZh:'种子',fact:'a baby plant waiting to grow',factZh:'一个等待长大的小宝宝植物'}) +
    partSVG({px:300,py:400,lx:180,ly:400,anc:'end',name:'Sprout',nameZh:'小芽',fact:'first green shoot from a seed',factZh:'种子长出的第一抹绿色'})
  ),
  seed_02: () => svgWrap(
    partSVG({px:380,py:450,lx:250,ly:450,anc:'end',name:'Seed',nameZh:'种子',fact:'sleeping in the cozy soil',factZh:'在舒服的泥土里睡觉'}) +
    partSVG({px:680,py:430,lx:820,ly:430,anc:'start',name:'Worm',nameZh:'蚯蚓',fact:'a friend who helps the soil',factZh:'帮助泥土松软的好朋友'})
  ),
  seed_03: () => svgWrap(
    partSVG({px:500,py:200,lx:620,ly:200,anc:'start',name:'Raindrop',nameZh:'雨滴',fact:'wakes the seed up',factZh:'叫醒种子'}) +
    partSVG({px:380,py:550,lx:250,ly:550,anc:'end',name:'Seed',nameZh:'种子',fact:'drinks water and starts to grow',factZh:'喝水后开始生长'}) +
    partSVG({px:660,py:600,lx:780,ly:600,anc:'start',name:'Sprout',nameZh:'小芽',fact:'first green leaves above the soil',factZh:'钻出泥土的第一片绿叶'})
  ),
  seed_04: () => svgWrap(
    partSVG({px:500,py:150,lx:650,ly:150,anc:'start',name:'Roots',nameZh:'根',fact:'grow down to hold the plant',factZh:'往下长，紧紧抓住植物'}) +
    partSVG({px:520,py:450,lx:400,ly:450,anc:'end',name:'Stone',nameZh:'石头',fact:'roots grow around it',factZh:'根会绕开它生长'}) +
    partSVG({px:680,py:520,lx:820,ly:520,anc:'start',name:'Worm',nameZh:'蚯蚓',fact:'makes tunnels in the soil',factZh:'在土里钻出通道'})
  ),
  seed_05: () => svgWrap(
    partSVG({px:720,py:150,lx:820,ly:150,anc:'start',name:'Sun',nameZh:'太阳',fact:'gives energy to the plant',factZh:'给植物能量'}) +
    partSVG({px:480,py:480,lx:600,ly:480,anc:'start',name:'Stem',nameZh:'茎',fact:'carries water up to the leaves',factZh:'把水送到叶子上'}) +
    partSVG({px:360,py:300,lx:220,ly:300,anc:'end',name:'Leaf',nameZh:'叶子',fact:'catches sunlight and makes food',factZh:'吸收阳光，制造养分'})
  ),
  seed_06: () => svgWrap(
    partSVG({px:420,py:400,lx:280,ly:400,anc:'end',name:'Flower',nameZh:'花朵',fact:'opens to welcome friends',factZh:'开放来欢迎朋友'}) +
    partSVG({px:650,py:250,lx:780,ly:250,anc:'start',name:'Butterfly',nameZh:'蝴蝶',fact:'visits flowers for sweet nectar',factZh:'来花丛喝甜甜的花蜜'})
  ),
  seed_07: () => svgWrap(
    partSVG({px:400,py:420,lx:260,ly:420,anc:'end',name:'Flower',nameZh:'花朵',fact:'has yellow pollen inside',factZh:'里面有黄色的花粉'}) +
    partSVG({px:540,py:360,lx:680,ly:360,anc:'start',name:'Bee',nameZh:'蜜蜂',fact:'carries pollen from flower to flower',factZh:'把花粉从一朵花带到另一朵花'})
  ),
  seed_08: () => svgWrap(
    partSVG({px:520,py:420,lx:650,ly:420,anc:'start',name:'Apple',nameZh:'苹果',fact:'a fruit that holds new seeds',factZh:'藏着新种子的果实'}) +
    partSVG({px:330,py:320,lx:200,ly:320,anc:'end',name:'Leaves',nameZh:'树叶',fact:'make food for the tree',factZh:'为大树制造养分'})
  ),
  seed_09: () => svgWrap(
    partSVG({px:180,py:300,lx:80,ly:300,anc:'end',name:'Tree',nameZh:'树',fact:'where the seeds started',factZh:'种子出发的地方'}) +
    partSVG({px:600,py:350,lx:740,ly:350,anc:'start',name:'Bird',nameZh:'小鸟',fact:'helps seeds travel far',factZh:'帮助种子去远方'}) +
    partSVG({px:300,py:250,lx:180,ly:250,anc:'end',name:'Seeds',nameZh:'种子',fact:'riding the wind to a new home',factZh:'随风飘向新家'})
  ),
  seed_10: () => svgWrap(
    partSVG({px:500,py:450,lx:620,ly:450,anc:'start',name:'Seedling',nameZh:'小苗',fact:'a young plant starting its journey',factZh:'开始新旅程的小植物'}) +
    partSVG({px:200,py:150,lx:80,ly:150,anc:'end',name:'Cloud',nameZh:'云朵',fact:'brings rain for the new plant',factZh:'给小苗带来雨水'})
  ),
  seed_11: () => svgWrap(
    partSVG({px:430,py:350,lx:300,ly:350,anc:'end',name:'Tree',nameZh:'大树',fact:'gives us fresh air',factZh:'给我们新鲜空气'}) +
    partSVG({px:660,py:500,lx:800,ly:500,anc:'start',name:'Child',nameZh:'小朋友',fact:'loves shade and food from plants',factZh:'喜欢树荫和植物的食物'}) +
    partSVG({px:180,py:580,lx:80,ly:580,anc:'end',name:'Vegetables',nameZh:'蔬菜',fact:'plants become yummy food',factZh:'植物变成美味的食物'})
  )
};
