/* A close route through installed cabin equipment. Coordinates are teaching-model
 * units, with each eye inside the pressure envelope and each look point on a
 * discovery anchor. The camera remains free to orbit after each jump. */
window.StationTour = (() => {
  const stops = [
    { detail: 'interior.racks', name: '设备机柜', enName: 'Equipment racks',
      cue: '先看固定在弧形舱壁上的机柜。抽屉为什么需要卡扣？',
      enCue: 'Look at the racks on the curved wall. Why do their drawers need latches?',
      look: [-3.05, .12, -.40], eye: [-3.55, .05, .55] },
    { detail: 'interior.sleep', name: '睡眠区', enName: 'Sleeping area',
      cue: '转身找蓝色睡袋。人在失重时为什么要把自己系住？',
      enCue: 'Find the blue sleeping bag. Why must the crew fasten it to the wall?',
      look: [-2.18, 0, -.32], eye: [-2.90, .05, .54] },
    { detail: 'interior.table', name: '用餐区', enName: 'Galley',
      cue: '看看桌上的食物袋，找出防止它们飘走的固定方式。',
      enCue: 'Look at the food pouches. How are they kept from floating away?',
      look: [-1.25, -.25, -.22], eye: [-1.95, .12, .52] },
    { detail: 'interior.treadmill', name: '锻炼区', enName: 'Exercise area',
      cue: '走到跑步机旁。没有重力压住脚，背带怎样帮忙？',
      enCue: 'Visit the treadmill. How does the harness hold a runner down?',
      look: [-.55, -.35, .20], eye: [-1.40, .15, -.46] },
    { detail: 'interior.plants', name: '植物实验箱', enName: 'Plant chamber',
      cue: '进入横舱，看看叶子、箱壁和固定的灯。',
      enCue: 'Enter the cross module. Look for leaves, clear walls and fixed lamps.',
      look: [.2, -.31, -1.2], eye: [.25, .20, -.13] },
    { detail: 'interior.crystals', name: '晶体实验箱', enName: 'Crystal chamber',
      cue: '再到另一侧横舱，观察密封箱里晶体的棱面。',
      enCue: 'Visit the other cross module. Find the flat faces of the crystals.',
      look: [.2, -.31, 1.2], eye: [.25, .20, .13] }
  ];
  function pose(stop) {
    const dx = stop.eye[0] - stop.look[0];
    const dy = stop.eye[1] - stop.look[1];
    const dz = stop.eye[2] - stop.look[2];
    const distance = Math.hypot(dx, dy, dz);
    return { yaw: Math.atan2(dx, dz), pitch: Math.asin(dy / distance), distance };
  }
  return { stops, pose };
})();
