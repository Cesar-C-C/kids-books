/* ============================================================
   Cavities book data: The Little Hole in a Tooth / 牙齿里的小洞洞
   ============================================================ */
window.BOOK = {
  id: 'cavities',
  title: 'The Little Hole in a Tooth',
  titleZh: '牙齿里的小洞洞',
  subtitle: 'Paopao and the midnight acid alarm',
  subtitleZh: '泡泡和午夜酸雨警报',
  age: '4-8 岁',
  coverImg: 'assets/00_cover_v1.webp',
  audioDir: 'audio'
};

window.PAGES = [
  {
    img: 'assets/00_cover_v1.webp',
    cover: true,
    en: 'The Little Hole in a Tooth',
    zh: '牙齿里的小洞洞'
  },
  {
    img: 'assets/01_skip-brushing_v1.webp',
    en: 'After little snacks throughout the evening, five-year-old Paopao yawns. “Can I skip brushing just tonight?” he wonders.',
    zh: '晚上陆陆续续吃了几次小零食后，5 岁的泡泡打了个哈欠。“今晚能不能不刷牙呢？”他想。'
  },
  {
    img: 'assets/02_acid-alarm_v1.webp',
    en: 'A gentle orange alert glows inside Tooth City. In this make-believe story, it is the midnight acid alarm—not real rain inside a mouth.',
    zh: '牙齿城里亮起温和的橙色警报。在这个想象故事里，它叫“午夜酸雨警报”——嘴巴里并不会真的下雨。'
  },
  {
    img: 'assets/03_mouth-community_v1.webp',
    en: 'Paopao sees a busy community of many kinds of tiny microbes. Some bacteria join the tooth-decay process, but not every microbe is a villain. This is an enlarged conceptual picture.',
    zh: '泡泡看见一个热闹的微生物社区，里面有许多不同种类。部分细菌会参与蛀牙过程，但不是每一种微生物都是坏蛋。这是放大的概念示意。'
  },
  {
    img: 'assets/04_sugar-and-starch_v1.webp',
    en: 'Bits of food with sugar and starch can stay near the sticky plaque on teeth. Some plaque bacteria use these leftovers. This is an enlarged conceptual picture.',
    zh: '含有糖和淀粉的食物碎屑可能留在牙面黏黏的牙菌斑附近。牙菌斑里的部分细菌会利用这些食物残渣。这是放大的概念示意。'
  },
  {
    img: 'assets/05_acid-attack_v1.webp',
    en: 'As some bacteria use sugars and starches, they make acid. Orange drops in the diagram are symbols for the acid—they are not monsters or living creatures.',
    zh: '部分细菌利用糖和淀粉时，会产生酸。示意图里的橙色小滴代表酸，它们不是怪兽，也不是真的“蛀牙虫”。'
  },
  {
    img: 'assets/06_mineral-loss_v1.webp',
    en: 'When acid attacks happen again and again, the enamel can lose minerals over time. One snack does not make a cavity at once; this is a gradual, enlarged conceptual picture.',
    zh: '当酸的作用反复发生，牙釉质会随时间逐渐失去矿物质。吃一次零食不会立刻形成蛀洞；这是放大的渐进过程示意。'
  },
  {
    img: 'assets/07_saliva-fluoride_v1.webp',
    en: 'Saliva helps, and fluoride helps enamel resist acid. Together they can support minerals returning during very early damage—but they cannot repair a hole that has already formed.',
    zh: '唾液会帮忙，氟化物也能帮助牙釉质抵抗酸的作用。它们可以支持非常早期的矿物质回到牙釉质，但不能修复已经形成的洞。'
  },
  {
    img: 'assets/08_cavity-forms_v1.webp',
    en: 'If the damage keeps outpacing repair, a permanent little hole—a cavity—can form. Brushing cannot fix an established cavity, so Paopao knows to tell an adult.',
    zh: '如果损伤持续超过修复，就可能形成一个永久的小洞，也就是蛀洞。刷牙不能补好已经形成的蛀洞，所以泡泡知道要告诉大人。'
  },
  {
    img: 'assets/09_dentist-check_v1.webp',
    en: 'A dentist calmly checks Paopao’s teeth and explains what can help. A dentist can care for a cavity; getting help early can make the visit simpler.',
    zh: '牙医平静地检查泡泡的牙齿，说明可以怎样帮忙。蛀洞需要牙医处理，早点求助可以让就诊更从容。'
  },
  {
    img: 'assets/10_outer-surfaces_v1.webp',
    en: 'Back in the bathroom, Paopao’s grown-up helps him place a pea-sized amount of fluoride toothpaste on his yellow brush. He starts gently on the outer tooth surfaces.',
    zh: '回到浴室，大人帮泡泡把豌豆大小的含氟牙膏挤在黄色牙刷上。他先轻轻刷牙齿外侧。'
  },
  {
    img: 'assets/11_all-surfaces_v1.webp',
    en: 'Paopao practises reaching every surface: outer, inner, and chewing. Tap each zone to help him remember them all.',
    zh: '泡泡练习刷到每一个牙面：外侧、内侧和咀嚼面。点一点每个区域，帮他全部记住。',
    activity: { type: 'brush-zones', label: 'Brush every surface', labelZh: '刷到每一个牙面' }
  },
  {
    img: 'assets/12_two-minute-routine_v1.webp',
    en: 'Paopao brushes with fluoride toothpaste twice a day for two minutes, with adult help. He spits instead of swallowing. The timer is optional—he may put the device down while brushing.',
    zh: '泡泡每天用含氟牙膏刷牙两次，每次两分钟，并由大人帮助。他会把牙膏吐出来，不吞下去。计时器可用可不用——刷牙时可以放下设备。',
    activity: { type: 'brush-timer', label: 'Two-minute timer', labelZh: '两分钟刷牙计时' }
  },
  {
    img: 'assets/13_glossary_v1.webp',
    en: 'At bedtime, Paopao puts away his yellow brush. If a tooth hurts or he suspects a cavity, he will tell an adult. Tonight, Tooth City feels calm.',
    zh: '睡前，泡泡收好黄色牙刷。如果牙齿疼，或者他怀疑有蛀洞，就会告诉大人。今晚，牙齿城很安心。',
    glossary: [
      { en: 'Bacteria', zh: '细菌', def: 'tiny living things; some can help make acid in plaque', defZh: '微小的生物；其中一些会在牙菌斑里帮着产酸' },
      { en: 'Plaque', zh: '牙菌斑', def: 'a sticky film that forms on teeth', defZh: '形成在牙齿上的一层黏黏的薄膜' },
      { en: 'Acid', zh: '酸', def: 'a substance some plaque bacteria make from food', defZh: '牙菌斑里的部分细菌利用食物产生的物质' },
      { en: 'Enamel', zh: '牙釉质', def: 'the hard outer layer of a tooth', defZh: '牙齿最外面坚硬的一层' },
      { en: 'Fluoride', zh: '氟化物', def: 'a mineral that helps enamel resist acid and supports early repair', defZh: '帮助牙釉质抵抗酸、支持早期修复的矿物质' },
      { en: 'Cavity', zh: '蛀洞', def: 'a permanent hole in a tooth that needs dental care', defZh: '牙齿上需要牙医处理的永久性小洞' }
    ]
  }
];

Reader.init();
