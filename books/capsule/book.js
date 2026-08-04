/* ============================================================
   Return Capsule book data: Inside the Return Capsule / 火箭返回舱的秘密
   Principle-focused: capsule structure → heat shield → cabin →
   parachute → retro rockets → reentry → landing
   ============================================================ */
window.BOOK = {
  id: 'capsule',
  title: 'Inside the Return Capsule',
  titleZh: '火箭返回舱的秘密',
  subtitle: 'the little spaceship that brings astronauts home',
  subtitleZh: '把航天员安全带回家的小飞船',
  age: '4-8 岁',
  coverImg: 'assets/00_cover.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover.webp',
    cover: true,
    en: 'Inside the Return Capsule',
    zh: '火箭返回舱的秘密'
  },
  {
    img: 'assets/01_parts.webp',
    en: 'This is the return capsule — the little spaceship astronauts ride back to Earth. It looks like a big bell! At the bottom is a thick black heat shield. On top hides the parachute. Round windows let astronauts see out.',
    zh: '这是返回舱——航天员坐着回地球的小飞船。它像一个大铃铛！底部是厚厚的黑色防热盾，顶部藏着降落伞，圆圆的舷窗让航天员能看到外面。',
    ov: 'cp_parts', interactive: true
  },
  {
    img: 'assets/02_layers.webp',
    en: 'The capsule wall has three layers. Outside is the black heat shield. In the middle is the brown ablative layer that slowly burns away. Inside is the silver metal hull that keeps the cabin safe.',
    zh: '返回舱的外壳有三层。最外面是黑色防热盾，中间是棕色烧蚀层——它会被慢慢烧掉，最里面是银色的金属舱壁，保护着舱内安全。',
    ov: 'cp_layers', interactive: true
  },
  {
    img: 'assets/03_heatshield.webp',
    en: 'Watch the heat shield at the bottom! When the capsule races through the air, friction makes everything glow and burn. The heat shield takes the heat — it gets charred and black, but the astronauts stay cool and safe inside.',
    zh: '看底部的防热盾！返回舱冲过空气时，摩擦会让一切都发烫燃烧。防热盾挡下这些热量——它被烧得焦黑，但里面的航天员依然凉爽安全。',
    ov: 'cp_heatshield', interactive: true
  },
  {
    img: 'assets/04_cabin.webp',
    en: 'Inside the cabin, three soft seats wait for the astronauts. They strap in tightly for the bumpy ride home. A round window shows the sky, and a control panel helps them fly the capsule.',
    zh: '舱内有三个柔软的座椅等着航天员。回家之路颠颠簸簸，他们要紧紧系好安全带。圆圆的舷窗可以看到天空，控制面板帮助他们驾驶返回舱。',
    ov: 'cp_cabin', interactive: true
  },
  {
    img: 'assets/05_parachute.webp',
    en: 'On top of the capsule hides a secret: the parachute bay! Inside, a big orange-and-white parachute is folded up tight, waiting for the ride home. When it opens, it slows the capsule down like a giant umbrella.',
    zh: '返回舱顶部藏着一个秘密：伞舱！里面折叠着一顶橙白相间的大降落伞，等着回家时打开。它张开时就像一把巨伞，让返回舱慢慢减速。',
    ov: 'cp_parachute', interactive: true
  },
  {
    img: 'assets/06_retro.webp',
    en: 'Just before landing, small retro rockets fire downward. WHOOSH! They give one last push against the ground, making the capsule land softly — not with a big BANG!',
    zh: '就在着陆前，反推火箭向下点火。呼——！它们最后推一把，让返回舱轻轻落地，而不是“砰”地砸下来！',
    ov: 'cp_retro', interactive: true
  },
  {
    img: 'assets/07_window.webp',
    en: 'Through the round window, astronauts see planet Earth — blue oceans, green lands, and fluffy white clouds. Home is getting closer!',
    zh: '透过圆圆的舷窗，航天员看到地球——蓝色的海洋、绿色的陆地、蓬松的白云。家越来越近啦！',
    ov: 'cp_window', interactive: true
  },
  {
    img: 'assets/08_dock.webp',
    en: 'On the way home, the capsule docks with the space station. The round hatch connects to the docking port with a click. Astronauts pass through this door between the capsule and the station.',
    zh: '回家路上，返回舱要和空间站对接。圆圆的舱门“咔哒”一声与对接端口相连。航天员就从这扇门在返回舱和空间站之间进出。',
    ov: 'cp_dock', interactive: true
  },
  {
    img: 'assets/09_reentry.webp',
    en: 'Now comes the scary part! The capsule plunges back into the atmosphere, wrapped in a giant ball of fire. It looks scary, but the heat shield protects everything inside. On we go!',
    zh: '惊险的时刻来了！返回舱冲回大气层，被一团巨大的火球包裹。看起来好吓人，但防热盾保护着里面的一切。继续前进！',
    ov: 'cp_reentry', interactive: true
  },
  {
    img: 'assets/10_parachute.webp',
    en: 'POP! The parachute bursts open above the capsule. It billows like a huge umbrella, catching the air and slowing the fall. The capsule sways gently in the sky like a leaf.',
    zh: '砰！降落伞在返回舱上方打开。它像一把大伞迎风鼓起来，兜住空气，让下降变慢。返回舱像一片叶子一样在天空中轻轻摇晃。',
    ov: 'cp_parachute_open', interactive: true
  },
  {
    img: 'assets/11_landing.webp',
    en: 'Touchdown! The capsule lands on a green meadow, and the astronauts climb out with big smiles. Welcome home, space heroes! Mission accomplished!',
    zh: '着陆啦！返回舱降落在绿色草地上，航天员们带着大大的笑容走出来。欢迎回家，太空英雄！任务完成！',
    ov: 'cp_landing', interactive: true
  },
  {
    img: 'assets/12_vocab.webp',
    en: 'Great job, little astronaut! You learned how the return capsule brings astronauts home. Can you name all the parts?',
    zh: '做得好，小小航天员！你学会了返回舱怎么把航天员安全带回家。你能叫出这些部件的名字吗？',
    ov: 'cp_vocab', interactive: true,
    glossary: [
      {en:'Return capsule', zh:'返回舱', def:'the little ship that brings astronauts home', defZh:'带航天员回家的小飞船'},
      {en:'Heat shield', zh:'防热盾', def:'the thick bottom that takes the heat', defZh:'底部厚厚的挡热层'},
      {en:'Ablative layer', zh:'烧蚀层', def:'the layer that burns away to protect', defZh:'通过烧掉自己来保护的部分'},
      {en:'Pressure hull', zh:'金属舱壁', def:'the silver wall that keeps the cabin safe', defZh:'保护舱内安全的银色舱壁'},
      {en:'Cabin', zh:'乘员舱', def:'where the astronauts sit', defZh:'航天员坐的地方'},
      {en:'Parachute', zh:'降落伞', def:'the big umbrella that slows the fall', defZh:'让下降变慢的大伞'},
      {en:'Retro rocket', zh:'反推火箭', def:'fires down to land softly', defZh:'向下点火让着陆更轻柔'},
      {en:'Window', zh:'舷窗', def:'the round window to see outside', defZh:'看外面的圆窗'}
    ]
  }
];

Reader.init();
