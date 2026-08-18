/* ============================================================
   Seed book interactive SVG overlays (BUBBLE-MODE hotspots, v2).
   viewBox 1000x667, uses shared/overlays.js helpers.
   All px/py are IMAGE pixel coordinates (1216 x 832).
   BUBBLE MODE: every hotspot carries line + lineZh (first-person speech
   line) + lineKey (unique key for pre-generated line MP3). No leader
   lines / SVG labels. Coordinates calibrated page-by-page with GLM vision.
   ============================================================ */
window.OVL = {
  seed_cover: () => svgWrap(
    partSVG({px:680,py:160,name:'Sun',nameZh:'太阳',fact:'gives warmth and light',factZh:'给种子温暖和光亮',
      line:"I'm the Sun — I wake the little seed with warm light!", lineZh:'我是太阳，用温暖的光叫醒小种子！', lineKey:'seed_cover_0'}) +
    partSVG({px:500,py:520,name:'Seed',nameZh:'种子',fact:'a baby plant waiting to grow',factZh:'一个等待长大的小宝宝植物',
      line:"I'm a Seed — a baby plant sleeping in the soil!", lineZh:'我是种子，一个睡在土里的小宝宝植物！', lineKey:'seed_cover_1'}) +
    partSVG({px:300,py:500,name:'Sprout',nameZh:'小芽',fact:'first green shoot from a seed',factZh:'种子长出的第一抹绿色',
      line:"I'm a Sprout — the first green shoot peeking out!", lineZh:'我是小芽，第一抹钻出来的绿色！', lineKey:'seed_cover_2'})
  ),
  seed_02: () => svgWrap(
    partSVG({px:300,py:430,name:'Seed',nameZh:'种子',fact:'sleeping in the cozy soil',factZh:'在舒服的泥土里睡觉',
      line:"I'm the Seed — cozy and sleepy in the soil!", lineZh:'我是种子，在土里舒舒服服地睡觉！', lineKey:'seed_02_0'}) +
    partSVG({px:760,py:450,name:'Worm',nameZh:'蚯蚓',fact:'a friend who helps the soil',factZh:'帮助泥土松软的好朋友',
      line:"I'm a Worm — I make the soil soft and friendly!", lineZh:'我是蚯蚓，让泥土变得松软又舒服！', lineKey:'seed_02_1'})
  ),
  seed_03: () => svgWrap(
    partSVG({px:530,py:240,name:'Raindrop',nameZh:'雨滴',fact:'wakes the seed up',factZh:'叫醒种子',
      line:"I'm a Raindrop — I tap the seed to wake up!", lineZh:'我是雨滴，轻轻敲醒种子！', lineKey:'seed_03_0'}) +
    partSVG({px:360,py:430,name:'Seed',nameZh:'种子',fact:'drinks water and starts to grow',factZh:'喝水后开始生长',
      line:"I'm the Seed — I drink water and start to grow!", lineZh:'我是种子，喝水后开始长大！', lineKey:'seed_03_1'}) +
    partSVG({px:660,py:700,name:'Sprout',nameZh:'小芽',fact:'first green leaves above the soil',factZh:'钻出泥土的第一片绿叶',
      line:"I'm a Sprout — I push up through the soil!", lineZh:'我是小芽，顶开泥土钻出来！', lineKey:'seed_03_2'})
  ),
  seed_04: () => svgWrap(
    partSVG({px:520,py:180,name:'Roots',nameZh:'根',fact:'grow down to hold the plant',factZh:'往下长，紧紧抓住植物',
      line:"I'm Roots — I grow down to hold the plant tight!", lineZh:'我是根，往下长紧紧抓住植物！', lineKey:'seed_04_0'}) +
    partSVG({px:570,py:580,name:'Stone',nameZh:'石头',fact:'roots grow around it',factZh:'根会绕开它生长',
      line:"I'm a Stone — roots grow around me!", lineZh:'我是石头，根会绕着我长！', lineKey:'seed_04_1'}) +
    partSVG({px:700,py:580,name:'Worm',nameZh:'蚯蚓',fact:'makes tunnels in the soil',factZh:'在土里钻出通道',
      line:"I'm a Worm — I dig tunnels in the soil!", lineZh:'我是蚯蚓，在土里钻出通道！', lineKey:'seed_04_2'})
  ),
  seed_05: () => svgWrap(
    partSVG({px:720,py:160,name:'Sun',nameZh:'太阳',fact:'gives energy to the plant',factZh:'给植物能量',
      line:"I'm the Sun — I give the plant energy!", lineZh:'我是太阳，给植物能量！', lineKey:'seed_05_0'}) +
    partSVG({px:330,py:520,name:'Stem',nameZh:'茎',fact:'carries water up to the leaves',factZh:'把水送到叶子上',
      line:"I'm the Stem — I carry water up to the leaves!", lineZh:'我是茎，把水送到叶子上！', lineKey:'seed_05_1'}) +
    partSVG({px:300,py:320,name:'Leaf',nameZh:'叶子',fact:'catches sunlight and makes food',factZh:'吸收阳光，制造养分',
      line:"I'm a Leaf — I catch sunlight and make food!", lineZh:'我是叶子，吸收阳光做养分！', lineKey:'seed_05_2'})
  ),
  seed_06: () => svgWrap(
    partSVG({px:480,py:440,name:'Flower',nameZh:'花朵',fact:'opens to welcome friends',factZh:'开放来欢迎朋友',
      line:"I'm a Flower — I open to welcome friends!", lineZh:'我是花朵，开放来欢迎朋友！', lineKey:'seed_06_0'}) +
    partSVG({px:630,py:300,name:'Butterfly',nameZh:'蝴蝶',fact:'visits flowers for sweet nectar',factZh:'来花丛喝甜甜的花蜜',
      line:"I'm a Butterfly — I visit flowers for sweet nectar!", lineZh:'我是蝴蝶，来喝甜甜的花蜜！', lineKey:'seed_06_1'})
  ),
  seed_07: () => svgWrap(
    partSVG({px:500,py:450,name:'Flower',nameZh:'花朵',fact:'has yellow pollen inside',factZh:'里面有黄色的花粉',
      line:"I'm a Flower — I have yellow pollen inside!", lineZh:'我是花朵，里面有黄色的花粉！', lineKey:'seed_07_0'}) +
    partSVG({px:380,py:360,name:'Bee',nameZh:'蜜蜂',fact:'carries pollen from flower to flower',factZh:'把花粉从一朵花带到另一朵花',
      line:"I'm a Bee — I carry pollen from flower to flower!", lineZh:'我是蜜蜂，把花粉带到另一朵花！', lineKey:'seed_07_1'})
  ),
  seed_08: () => svgWrap(
    partSVG({px:520,py:430,name:'Apple',nameZh:'苹果',fact:'a fruit that holds new seeds',factZh:'藏着新种子的果实',
      line:"I'm an Apple — I hold new seeds inside!", lineZh:'我是苹果，里面藏着新种子！', lineKey:'seed_08_0'}) +
    partSVG({px:200,py:260,name:'Leaves',nameZh:'树叶',fact:'make food for the tree',factZh:'为大树制造养分',
      line:"I'm Leaves — I make food for the tree!", lineZh:'我是树叶，为大树做养分！', lineKey:'seed_08_1'})
  ),
  seed_09: () => svgWrap(
    partSVG({px:190,py:350,name:'Tree',nameZh:'树',fact:'where the seeds started',factZh:'种子出发的地方',
      line:"I'm the Tree — where the seeds started!", lineZh:'我是大树，种子从这里出发！', lineKey:'seed_09_0'}) +
    partSVG({px:630,py:380,name:'Bird',nameZh:'小鸟',fact:'helps seeds travel far',factZh:'帮助种子去远方',
      line:"I'm a Bird — I help seeds travel far!", lineZh:'我是小鸟，帮种子去远方！', lineKey:'seed_09_1'}) +
    partSVG({px:240,py:290,name:'Seeds',nameZh:'种子',fact:'riding the wind to a new home',factZh:'随风飘向新家',
      line:"We're Seeds — riding the wind to a new home!", lineZh:'我们是种子，随风飘向新家！', lineKey:'seed_09_2'})
  ),
  seed_10: () => svgWrap(
    partSVG({px:480,py:450,name:'Seedling',nameZh:'小苗',fact:'a young plant starting its journey',factZh:'开始新旅程的小植物',
      line:"I'm a Seedling — a young plant starting its journey!", lineZh:'我是小苗，开始新旅程的小植物！', lineKey:'seed_10_0'}) +
    partSVG({px:830,py:140,name:'Cloud',nameZh:'云朵',fact:'brings rain for the new plant',factZh:'给小苗带来雨水',
      line:"I'm a Cloud — I bring rain for the new plant!", lineZh:'我是云朵，给小苗带来雨水！', lineKey:'seed_10_1'})
  ),
  seed_11: () => svgWrap(
    partSVG({px:450,py:300,name:'Tree',nameZh:'大树',fact:'gives us fresh air',factZh:'给我们新鲜空气',
      line:"I'm the Big Tree — I give fresh air!", lineZh:'我是大树，给大家新鲜空气！', lineKey:'seed_11_0'}) +
    partSVG({px:800,py:550,name:'Child',nameZh:'小朋友',fact:'loves shade and food from plants',factZh:'喜欢树荫和植物的食物',
      line:"I'm a Child — I love shade and food from plants!", lineZh:'我是小朋友，喜欢树荫和植物的食物！', lineKey:'seed_11_1'}) +
    partSVG({px:180,py:650,name:'Vegetables',nameZh:'蔬菜',fact:'plants become yummy food',factZh:'植物变成美味的食物',
      line:"I'm Vegetables — plants become yummy food!", lineZh:'我是蔬菜，植物变成美味的食物！', lineKey:'seed_11_2'})
  )
};
