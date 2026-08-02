/* ============================================================
   High-Speed Rail book data: 中国高铁 / China's High-Speed Train
   ============================================================ */
window.BOOK = {
  id: 'hsr',
  title: "China's High-Speed Train",
  titleZh: '中国高铁',
  subtitle: 'How a super-fast train works',
  subtitleZh: '超级快车的构造与工作原理',
  age: '4-8 岁',
  coverImg: 'assets/01_cover.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/01_cover.webp',
    cover: true,
    en: "China's High-Speed Train",
    zh: '中国高铁'
  },
  {
    img: 'assets/02_train.webp',
    en: 'This is a high-speed train. It is long, clean, and very fast. People wait on the platform and step inside when the doors open.',
    zh: '这是高铁。它很长、很干净、非常快。人们在站台上等待，门打开时走进车厢。',
    ov: 'hsr_02', interactive: true
  },
  {
    img: 'assets/03_nose.webp',
    en: 'Look at the front of the train. Its nose is smooth and pointy like a bullet. This shape helps the train cut through the wind.',
    zh: '看火车的前端。它的车头光滑又尖尖的，像子弹一样。这种外形帮助火车切开风。',
    ov: 'hsr_03', interactive: true
  },
  {
    img: 'assets/04_carriage.webp',
    en: 'The train has many carriages, like long rooms connected together. Inside, passengers sit in soft seats and look out the windows.',
    zh: '高铁有很多节车厢，就像连在一起的长房间。乘客坐在软椅上，看着窗外。',
    ov: 'hsr_04', interactive: true
  },
  {
    img: 'assets/05_track.webp',
    en: 'High-speed trains run on special tracks made of strong steel. The tracks are smooth and straight so the train can go fast safely.',
    zh: '高铁在特制的轨道上运行，轨道由坚固的钢铁制成。轨道又平又直，火车才能又快又安全。',
    ov: 'hsr_05', interactive: true
  },
  {
    img: 'assets/06_pantograph.webp',
    en: 'On top of the train is a metal bow called a pantograph. It touches the overhead wire and brings electricity to the train.',
    zh: '火车顶上有一个金属弓，叫受电弓。它接触上面的电线，把电带给火车。',
    ov: 'hsr_06', interactive: true
  },
  {
    img: 'assets/07_power.webp',
    en: 'The electricity powers motors under the train. The motors turn the wheels, and the wheels push the train forward.',
    zh: '电驱动火车下方的电动机。电动机带动车轮，车轮推动火车前进。',
    ov: 'hsr_07', interactive: true
  },
  {
    img: 'assets/08_bridge.webp',
    en: 'When the land has rivers or valleys, the railway is built on tall bridges. This keeps the track straight and level.',
    zh: '当遇到河流或山谷时，铁路会建在高高的桥梁上。这让轨道保持平直。',
    ov: 'hsr_08', interactive: true
  },
  {
    img: 'assets/09_tunnel.webp',
    en: 'When there is a big mountain, the train goes through a tunnel. A tunnel is a long, dark hole dug right through the rock.',
    zh: '当有大山时，火车会穿过隧道。隧道是在岩石中开凿的一条又长又黑的通道。',
    ov: 'hsr_09', interactive: true
  },
  {
    img: 'assets/10_driver.webp',
    en: 'The driver sits in the front cab. They watch the track, press buttons, and use a control panel to keep everyone safe.',
    zh: '司机坐在前端的驾驶室里。他们观察轨道、按按钮，用控制台保证大家的安全。',
    ov: 'hsr_10', interactive: true
  },
  {
    img: 'assets/11_speed.webp',
    en: 'High-speed trains can travel up to 350 kilometers per hour. That is much faster than cars on a highway!',
    zh: '高铁最高时速可达 350 公里。这比高速公路上的汽车快得多！',
    ov: 'hsr_11', interactive: true
  },
  {
    img: 'assets/12_vocab.webp',
    en: 'Great job! You learned how a high-speed train uses tracks, electricity, bridges, and tunnels to zoom across the country.',
    zh: '真棒！你学到了高铁如何利用轨道、电力、桥梁和隧道在全国各地飞驰。',
    ov: 'hsr_12', interactive: true,
    glossary: [
      {en:'High-speed train', zh:'高铁', def:'a very fast train', defZh:'一种非常快的火车'},
      {en:'Streamlined nose', zh:'流线型车头', def:'a smooth front shape that cuts wind', defZh:'能切开风的平滑前部'},
      {en:'Carriage', zh:'车厢', def:'a long passenger room on wheels', defZh:'带轮子的长乘客室'},
      {en:'Track', zh:'轨道', def:'steel rails a train runs on', defZh:'火车行驶的钢轨'},
      {en:'Pantograph', zh:'受电弓', def:'a bow that collects electricity', defZh:'收集电力的弓'},
      {en:'Tunnel', zh:'隧道', def:'a passage through a mountain', defZh:'穿过山体的通道'}
    ]
  }
];

Reader.init();
