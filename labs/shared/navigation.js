(() => {
  const nav = document.querySelector('[data-lab-id]');
  if (!nav) return;
  const lab = (window.LABS_CATALOG || []).find(item => item.id === nav.dataset.labId);
  const links = [{text:'← 3D 实验室',href:'../index.html'},{text:'绘本书架',href:'../../index.html'}];
  if (lab?.bookId) links.push({text:'读一读同主题绘本 ↗',href:`../../books/${lab.bookId}/index.html`});
  links.forEach(item => {
    const a = document.createElement('a');
    a.textContent = item.text; a.href = item.href; nav.append(a);
  });
})();
