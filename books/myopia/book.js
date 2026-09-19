/* ============================================================
   Myopia book data: Why Do Faraway Things Look Blurry? / 眼睛为什么看不清了？
   ============================================================ */
window.BOOK = {
  id: 'myopia',
  title: 'Why Do Faraway Things Look Blurry?',
  titleZh: '眼睛为什么看不清了？',
  subtitle: 'Duoduo follows light into the eye',
  subtitleZh: '朵朵跟着光走进眼睛',
  age: '4-8 岁',
  coverImg: 'assets/00_cover_v1.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover_v1.webp',
    cover: true,
    en: 'Why Do Faraway Things Look Blurry?',
    zh: '眼睛为什么看不清了？'
  },
  {
    img: 'assets/01_kite-clue_v1.webp',
    en: 'Duoduo can see her red kite spool clearly. But the number on a faraway kite looks blurry.',
    zh: '朵朵能清楚看见手里的红色风筝线轴，可是远处风筝上的号码看起来模糊了。',
    editableLayer: { type: 'blurred-kite-number', value: '8' }
  },
  {
    img: 'assets/02_speak-up_v1.webp',
    en: '“Dad, far things look fuzzy,” says Duoduo. She tells him instead of hiding the problem.',
    zh: '“爸爸，远处的东西看起来有点模糊。”朵朵说。她没有藏着这个困惑，而是告诉了爸爸。'
  },
  {
    img: 'assets/03_eye-exam_v1.webp',
    en: 'An eye-care professional gives Duoduo a calm, painless eye exam and explains each step.',
    zh: '眼科专业人员为朵朵做了安静、无痛的眼睛检查，还一步一步解释给她听。'
  },
  {
    img: 'assets/04_light-path_v1.webp',
    en: 'Duoduo follows the light. It passes through the cornea and lens, into the eye.',
    zh: '朵朵跟着光线往里走。光线穿过角膜和晶状体，进入眼睛。',
    editableLayer: {
      type: 'eye-diagram-labels',
      ariaLabel: '角膜、晶状体、视网膜、焦点：光线经过角膜和晶状体，焦点朝视网膜形成 / Cornea, Lens, Retina, Focus: light passes through the cornea and lens, with focus forming toward the retina',
      sourceSize: { width: 1216, height: 832 },
      labels: {
        cornea: { label: { x: 300, y: 180 }, target: { x: 448, y: 386 } },
        lens: { label: { x: 500, y: 150 }, target: { x: 557, y: 386 } },
        retina: { label: { x: 980, y: 150 }, target: { x: 932, y: 386 } },
        focus: { label: { x: 730, y: 570 }, target: { x: 780, y: 386 } }
      }
    }
  },
  {
    img: 'assets/05_retina-focus_v1.webp',
    en: '“There they meet!” says Duoduo. When the eye focuses clearly, light comes together on the retina at the back of the eye.',
    zh: '“它们在那里会合啦！”朵朵说。眼睛清楚聚焦时，光线会在眼睛后面的视网膜上会合。',
    editableLayer: {
      type: 'eye-diagram-labels',
      ariaLabel: '角膜、晶状体、视网膜、焦点：焦点落在视网膜上 / Cornea, Lens, Retina, Focus: focus lands on the retina',
      sourceSize: { width: 1216, height: 832 },
      labels: {
        cornea: { label: { x: 300, y: 180 }, target: { x: 448, y: 386 } },
        lens: { label: { x: 500, y: 150 }, target: { x: 557, y: 386 } },
        retina: { label: { x: 990, y: 150 }, target: { x: 935, y: 386 } },
        focus: { label: { x: 850, y: 585 }, target: { x: 935, y: 386 } }
      }
    }
  },
  {
    img: 'assets/06_myopic-focus_v1.webp',
    en: 'With myopia, an eye can be longer, so light focuses in front of the retina and far things may look blurry.',
    zh: '近视时，眼球可能更长，光线会聚焦在视网膜前方，远处的东西就可能看起来模糊。',
    editableLayer: {
      type: 'eye-diagram-labels',
      ariaLabel: '角膜、晶状体、视网膜、焦点：焦点落在视网膜前方 / Cornea, Lens, Retina, Focus: focus falls in front of the retina',
      sourceSize: { width: 1216, height: 832 },
      labels: {
        cornea: { label: { x: 250, y: 160 }, target: { x: 330, y: 386 } },
        lens: { label: { x: 420, y: 130 }, target: { x: 458, y: 386 } },
        retina: { label: { x: 930, y: 140 }, target: { x: 1056, y: 386 } },
        focus: { label: { x: 730, y: 570 }, target: { x: 798, y: 386 } }
      }
    }
  },
  {
    img: 'assets/07_glasses-help_v1.webp',
    en: 'Glasses chosen by an eye-care professional can help redirect light to the retina so Duoduo can see clearly.',
    zh: '眼科专业人员选择的眼镜可以帮助把光线重新导向视网膜，让朵朵看得更清楚。'
  },
  {
    img: 'assets/08_many-influences_v1.webp',
    en: 'Myopia can be linked with family and environment. It is not anyone’s fault.',
    zh: '近视可能和家人的情况、环境都有关系。这不是任何人的错。'
  },
  {
    img: 'assets/09_outdoor-play_v1.webp',
    en: 'Playing outdoors is a helpful healthy habit. It may be linked with less myopia, but it is not a guarantee.',
    zh: '到户外玩耍是一种有帮助的健康习惯。它可能与较少发生近视有关，但不能保证一定不会近视。'
  },
  {
    img: 'assets/10_look-far-break_v1.webp',
    en: 'After close-up work, Duoduo pauses and looks into the distance. Her eyes enjoy the far-away view.',
    zh: '近距离看书或画画一会儿后，朵朵停下来看看远处。她的眼睛喜欢这片远远的风景。'
  },
  {
    img: 'assets/11_focus-model_v1.webp',
    en: '“Let me try!” Duoduo moves the slider to see where the light meets. Can you help her bring the focus back to the retina with glasses?',
    zh: '“让我试试！”朵朵拖动滑块，看看光线在哪里会合。你能帮她戴上眼镜，让焦点回到视网膜上吗？',
    activity: { type: 'focus-model' }
  },
  {
    img: 'assets/12_tell-an-adult_v1.webp',
    en: 'If far things look blurry, you squint often, or your eyes feel uncomfortable, tell an adult and ask an eye-care professional.',
    zh: '如果远处看不清、经常眯眼，或眼睛觉得不舒服，要告诉大人，并请眼科专业人员帮助评估。'
  },
  {
    img: 'assets/13_glossary_v1.webp',
    en: 'At the kite festival, Duoduo smiles. With help and good questions, she is ready to fly her kite again!',
    zh: '风筝节上，朵朵笑了。有了帮助和好问题，她又准备好放风筝啦！',
    glossary: [
      { en: 'Cornea', zh: '角膜', def: 'the clear front window of the eye', defZh: '眼睛前面透明的小窗' },
      { en: 'Lens', zh: '晶状体', def: 'a clear part that helps focus light', defZh: '帮助聚焦光线的透明部分' },
      { en: 'Retina', zh: '视网膜', def: 'the light-sensing layer at the back of the eye', defZh: '眼睛后面感受光线的一层' },
      { en: 'Focus', zh: '聚焦', def: 'when light comes together clearly', defZh: '光线清楚会合的地方' },
      { en: 'Myopia', zh: '近视', def: 'when far things may look blurry', defZh: '远处的东西可能看起来模糊' },
      { en: 'Glasses', zh: '眼镜', def: 'lenses that can help people see clearly', defZh: '能帮助人看清楚的镜片' }
    ]
  }
];

if (window.Reader) Reader.init();
