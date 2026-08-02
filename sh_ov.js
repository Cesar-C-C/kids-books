/* ============================================================
   Shared SVG overlay helpers  (viewBox 1000x667, preserveAspectRatio=none)
   Loaded before each book's overlays.js
   ============================================================ */
const OVERLAY_DEF = `<defs>
  <marker id="ab" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#3a86ff"/></marker>
  <marker id="ar" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#ef476f"/></marker>
  <marker id="ao" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#f4a261"/></marker>
  <marker id="ag" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#6c757d"/></marker>
  <marker id="agrn" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#2a9d8f"/></marker>
</defs>`;

function svgWrap(inner){ return `<svg class="ov" viewBox="0 0 1000 667" preserveAspectRatio="none">${OVERLAY_DEF}${inner}</svg>`; }

/* a clickable part: a small red dot + leader line + label + invisible hit circle */
function partSVG(p){
  const factZh = p.factZh ? ` data-factzh="${p.factZh}"` : '';
  const nmZh = p.nameZh ? ` data-namezh="${p.nameZh}"` : '';
  return `<g>
    <line x1="${p.px}" y1="${p.py}" x2="${p.lx}" y2="${p.ly}" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="${p.px}" cy="${p.py}" r="5.5" fill="#ef476f" stroke="#fff" stroke-width="1.5"/>
    <text x="${p.lx}" y="${p.ly}" text-anchor="${p.anc}" class="lbltxt">${p.name}</text>
    <circle class="part" cx="${p.px}" cy="${p.py}" r="40" fill="transparent" data-name="${p.name}" data-fact="${p.fact}"${factZh}${nmZh}/>
  </g>`;
}

/* a labeled animated arrow (also clickable) */
function arrowSVG(a){
  const factZh = a.factZh ? ` data-factzh="${a.factZh}"` : '';
  const nmZh = a.nameZh ? ` data-namezh="${a.nameZh}"` : '';
  return `<g class="part" data-name="${a.name}" data-fact="${a.fact}"${factZh}${nmZh}>
    <line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${a.col}" stroke-width="8" marker-end="url(#${a.mk})" class="pulse"/>
    <text x="${a.tx}" y="${a.ty}" text-anchor="${a.anc}" class="cap" fill="${a.col}">${a.name}</text>
  </g>`;
}

function capSVG(t,x,y,col,anc,size){
  return `<text x="${x}" y="${y}" text-anchor="${anc||'middle'}" class="cap" fill="${col}" style="font-size:${size||19}px">${t}</text>`;
}
