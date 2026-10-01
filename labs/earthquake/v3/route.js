(function (root) {
  'use strict';
  const cards = new Set(['elastic-rebound', 'fault-types', 'focus-epicenter', 'waves']);
  const sources = new Map([['earthquake-fault', 'fault-lab'], ['earthquake-waves', 'wave-lab']]);
  const language = value => value === 'en' ? 'en' : 'zh';
  function parse(search = '', hash = '') {
    const params = new URLSearchParams(search);
    const from = params.get('from');
    const proposedCard = String(hash).replace(/^#/, '');
    return {
      lang: language(params.get('lang')),
      from: sources.has(from) ? from : null,
      card: cards.has(proposedCard) ? proposedCard : 'elastic-rebound'
    };
  }
  function bookHref({ lang, from } = {}) {
    const anchor = sources.get(from);
    return `../../books/earthquake/index.html?lang=${language(lang)}${anchor ? '#' + anchor : ''}`;
  }
  const api = { parse, bookHref };
  root.EarthquakeRoute = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
