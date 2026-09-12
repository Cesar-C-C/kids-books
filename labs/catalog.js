/* Add new subjects here. Only ready entries receive clickable routes.
   Paths are relative to labs/. Keep model code in labs/<id>/. */
window.LABS_CATALOG = [
  {
    id: 'airplane', title: '飞机 3D 实验室', englishTitle: 'Airplane Lab',
    description: '放大同一架飞机，探索 24 个内部细节：发动机、驾驶舱、客舱、机翼与起落架。',
    icon: '✈', status: 'ready', href: 'airplane/index.html',
    image: 'airplane/preview.png', bookId: 'airplane', age: '4–8 岁',
    features: ['连续放大', '24 个内部细节', '英文点读', '剖视与机构演示']
  },
  {
    id: 'rocket', title: '火箭 3D 实验室', englishTitle: 'Rocket Lab',
    description: '打开整流罩，发现卫星、贮箱和发动机，认识 9 类火箭关键部件。',
    icon: '🚀', status: 'ready', href: 'rocket/index.html', image: 'rocket/preview.png', bookId: 'rocket', age: '4–8 岁',
    features: ['360° 观察', '内部拆解', '英文点读', '找部件挑战']
  },
  {
    id: 'hsr', title: '高铁 3D 实验室', englishTitle: 'High-Speed Train Lab',
    description: '放大同一列高铁，探索 25 个内部细节：车头、客舱、车门、转向架与受电弓。',
    icon: '🚄', status: 'ready', href: 'hsr/index.html', image: 'hsr/preview.png', bookId: 'hsr', age: '4–8 岁',
    features: ['连续放大', '25 个内部细节', '英文点读', '剖视与机构演示']
  },
  {
    id: 'schoolbus', title: '校车 3D 实验室', englishTitle: 'School Bus Lab',
    description: '拆开黄色校车，找到座椅、安全带和驾驶区，认识 10 类部件的小秘密。',
    icon: '🚌', status: 'ready', href: 'schoolbus/index.html', image: 'schoolbus/preview.png', bookId: 'schoolbus', age: '4–8 岁',
    features: ['360° 观察', '车厢拆解', '英文点读', '找部件挑战']
  }
];
