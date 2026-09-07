(() => {
  const grid = document.getElementById('labs-grid');
  const labs = window.LABS_CATALOG || [];
  const readyCount=labs.filter(l=>l.status==='ready').length, plannedCount=labs.filter(l=>l.status==='planned').length;
  document.getElementById('lab-count').textContent = `${readyCount} 个已开放${plannedCount ? ` · ${plannedCount} 个筹备中` : ' · 一起动手探索'}`;
  const element = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className;
    if (text) node.textContent = text; return node;
  };
  labs.forEach(lab => {
    const ready = lab.status === 'ready';
    const card = element('article', `lab-card ${ready ? 'ready' : 'planned'}`);
    card.dataset.labId = lab.id;
    const cover = element('div', 'lab-cover');
    if (ready && lab.image) {
      const img = element('img', ''); img.src = lab.image;
      img.alt = `${lab.title}中的可拆解教学模型`; img.width = 800; img.height = 480; cover.append(img);
    } else { const icon = element('span','placeholder-icon',lab.icon); icon.setAttribute('aria-hidden','true'); cover.append(icon); }
    cover.append(element('span','status',ready ? '现在可以探索' : '筹备中'));
    const content = element('div', 'lab-content');
    content.append(element('p','lab-english',lab.englishTitle),element('h3','',lab.title),element('p','description',lab.description));
    const features = element('div','features');
    (lab.features || []).forEach(f => features.append(element('span','',f)));
    content.append(features);
    if (ready) {
      const a = element('a','enter-lab','进入实验室 →'); a.href = lab.href; content.append(a);
    } else { content.append(element('p','coming-soon','还在准备中，敬请期待')); }
    card.append(cover,content); grid.append(card);
  });
})();
