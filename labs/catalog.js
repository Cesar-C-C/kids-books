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
    description: '打开整流罩，发现卫星、上面级、贮箱和发动机，认识 9 类火箭关键部件与 26 个内部细节。',
    icon: '🚀', status: 'ready', href: 'rocket/index.html', image: 'rocket/preview.png', bookId: 'rocket', age: '4–8 岁',
    features: ['连续放大', '26 个内部细节', '英文点读', '剖视与机构演示']
  },
  {
    id: 'hsr', title: '高铁 3D 实验室', englishTitle: 'High-Speed Train Lab',
    description: '走进绘本里的白蓝高铁，放大探索车厢、转向架与受电弓的 25 个内部细节。',
    icon: '🚄', status: 'ready', href: 'hsr/index.html', image: 'hsr/preview.png', bookId: 'hsr', age: '4–8 岁',
    features: ['连续放大', '25 个内部细节', '英文点读', '剖视与机构演示']
  },
  {
    id: 'schoolbus', title: '校车 3D 实验室', englishTitle: 'School Bus Lab',
    description: '打开一辆长头黄校车，从发动机舱盖到车厢，探索座椅、安全带、停车臂与警示灯的 37 个内部细节。',
    icon: '🚌', status: 'ready', href: 'schoolbus/index.html', image: 'schoolbus/preview.png', bookId: 'schoolbus', age: '4–8 岁',
    features: ['连续放大', '37 个内部细节', '英文点读', '剖视与机构演示']
  },
  {
    id: 'doubledecker', title: '双层巴士 3D 实验室', englishTitle: 'Double-Decker Lab',
    description: '爬上楼梯看看上层车厢：红色双层巴士的 10 类部件、39 个内部细节与楼梯结构。',
    icon: '🚍', status: 'ready', href: 'doubledecker/index.html', image: 'doubledecker/preview.png', bookId: 'bus', age: '4–8 岁',
    features: ['连续放大', '39 个内部细节', '英文点读', '剖视与机构演示']
  }
];
