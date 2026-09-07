/* Add new subjects here. Only ready entries receive clickable routes.
   Paths are relative to labs/. Keep model code in labs/<id>/. */
window.LABS_CATALOG = [
  {
    id: 'airplane', title: '飞机 3D 实验室', englishTitle: 'Airplane Lab',
    description: '转动一架飞机，拆开 10 类关键部件，听听它们的英文名字和小秘密。',
    icon: '✈', status: 'ready', href: 'airplane/index.html',
    image: 'airplane/preview.png', bookId: 'airplane', age: '4–8 岁',
    features: ['360° 观察', '部件拆解', '英文点读', '找部件挑战']
  },
  {
    id: 'rocket', title: '火箭 3D 实验室', englishTitle: 'Rocket Lab',
    description: '下一站，太空！未来一起探索火箭的结构与飞向太空的秘密。',
    icon: '🚀', status: 'planned', href: null, image: null, bookId: 'rocket', age: '4–8 岁',
    features: []
  },
  {
    id: 'hsr', title: '高铁 3D 实验室', englishTitle: 'High-Speed Train Lab',
    description: '未来一起走进高速列车，认识车头、车厢和更多有趣的部件。',
    icon: '🚄', status: 'planned', href: null, image: null, bookId: 'hsr', age: '4–8 岁',
    features: []
  }
];
