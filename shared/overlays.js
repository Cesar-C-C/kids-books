/* ============================================================
   Shared SVG overlay helpers  (viewBox 1000x667, preserveAspectRatio=none)
   Loaded before each book's overlays.js

   COORDINATE CONVENTION:
     All px/py/x1/y1/x2/y2/lx/ly values in book overlay files are
     IMAGE pixel coordinates (1216 x 832, image intrinsic).
     These are auto-converted to SVG viewBox (1000 x 667) below using:
       ovx = 12.6 + img_px/1216 * 974.8
       ovy = img_py/832  * 667
     The 12.6 unit shift accounts for the horizontal letterbox
     from object-fit:contain (image is 1216/832 = 1.4615, container is 1000/667 = 1.499).
   ============================================================ */
const OVERLAY_DEF = `<defs>
  <marker id="ab" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#3a86ff"/></marker>
  <marker id="ar" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#ef476f"/></marker>
  <marker id="ao" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#f4a261"/></marker>
  <marker id="ag" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#6c757d"/></marker>
  <marker id="agrn" markerWidth="11" markerHeight="11" refX="7" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#2a9d8f"/></marker>
</defs>`;

function svgWrap(inner){ return `<svg class="ov" viewBox="0 0 1000 667" preserveAspectRatio="none">${OVERLAY_DEF}${inner}</svg>`; }

/* image-pixel (1216x832) -> SVG viewBox (1000x667) with letterbox offset */
const IMG_W = 1216, IMG_H = 832, VB_W = 1000, VB_H = 667;
const LEFT_MARGIN = 12.6;                                  // letterbox on each side
const VISIBLE_W   = 974.8;                                 // image width inside viewBox
function toOvX(px){ return LEFT_MARGIN + (px/IMG_W) * VISIBLE_W; }
function toOvY(py){ return (py/IMG_H) * VB_H; }

/* a clickable part: a small red dot + leader line + label + invisible hit circle.
   Input: px,py,lx,ly in IMAGE pixel coords (auto-converted to SVG viewBox). */
function partSVG(p){
  const factZh = p.factZh ? ` data-factzh="${p.factZh}"` : '';
  const nmZh = p.nameZh ? ` data-namezh="${p.nameZh}"` : '';
  const x1 = toOvX(p.px), y1 = toOvY(p.py);
  const x2 = toOvX(p.lx), y2 = toOvY(p.ly);
  return `<g>
    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#8a96a3" stroke-width="2.5"/>
    <circle cx="${x1.toFixed(2)}" cy="${y1.toFixed(2)}" r="5.5" fill="#ef476f" stroke="#fff" stroke-width="1.5"/>
    <text x="${x2.toFixed(2)}" y="${y2.toFixed(2)}" text-anchor="${p.anc}" class="lbltxt">${p.name}</text>
    <circle class="part" cx="${x1.toFixed(2)}" cy="${y1.toFixed(2)}" r="40" fill="transparent" data-name="${p.name}" data-fact="${p.fact}"${factZh}${nmZh}/>
  </g>`;
}

/* a labeled animated arrow (also clickable). Input coordinates are image pixels. */
function arrowSVG(a){
  const factZh = a.factZh ? ` data-factzh="${a.factZh}"` : '';
  const nmZh = a.nameZh ? ` data-namezh="${a.nameZh}"` : '';
  const x1 = toOvX(a.x1), y1 = toOvY(a.y1);
  const x2 = toOvX(a.x2), y2 = toOvY(a.y2);
  const tx = toOvX(a.tx), ty = toOvY(a.ty);
  return `<g class="part" data-name="${a.name}" data-fact="${a.fact}"${factZh}${nmZh}>
    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${a.col}" stroke-width="8" marker-end="url(#${a.mk})" class="pulse"/>
    <text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="${a.anc}" class="cap" fill="${a.col}">${a.name}</text>
  </g>`;
}

/* Caption text — coordinates are in SVG viewBox directly (not image pixels) */
function capSVG(t,x,y,col,anc,size){
  return `<text x="${x}" y="${y}" text-anchor="${anc||'middle'}" class="cap" fill="${col}" style="font-size:${size||19}px">${t}</text>`;
}
