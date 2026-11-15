// Patch badge server: GET /badge?label=members&source=discord&id=INVITE&color=5865f2&logo=discord
const si = require('simple-icons');
const ICONS = {};
Object.values(si).forEach((i) => { if (i && i.slug && i.path) ICONS[i.slug] = i; });

const FONTS = {
  Inter: 'Inter, system-ui, sans-serif',
  Serif: "Georgia, 'Times New Roman', serif",
  Mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
  System: 'system-ui, -apple-system, Segoe UI, sans-serif',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d, lo, hi) => { const n = parseFloat(v); return isNaN(n) ? d : Math.min(hi, Math.max(lo, n)); };
const hex = (v, d) => { v = String(v || '').replace('#', ''); if (/^[0-9a-f]{3}$/i.test(v)) v = v.split('').map((c) => c + c).join(''); return /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : d; };
const on = (v) => v === '1' || v === 'true';
const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
const contrast = (bg) => (lum(bg) > 0.6 ? '#111827' : '#ffffff');

// Approximate text width (em units) for a sans-serif at semibold weight.
function tw(t, fs, fw, ls) {
  let w = 0;
  for (const c of t) w += "iljtf.,:;'|!()[] I".includes(c) ? 0.3 : 'mwMW@%'.includes(c) ? 0.88 : /[A-Z0-9]/.test(c) ? 0.66 : 0.56;
  return w * fs * (fw >= 700 ? 1.04 : fw <= 400 ? 0.96 : 1) + t.length * ls;
}

const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));
const get = async (url) => { const r = await fetch(url, { headers: { 'User-Agent': 'patch-badges' } }); if (!r.ok) throw new Error(r.status); return r.json(); };

// Live sources. Add your own here.
const SOURCES = {
  discord: async (id) => short((await get(`https://discord.com/api/v9/invites/${encodeURIComponent(id)}?with_counts=true`)).approximate_member_count) + ' members',
  ghfollowers: async (id) => short((await get(`https://api.github.com/users/${id}`)).followers),
  ghstars: async (id) => short((await get(`https://api.github.com/repos/${id}`)).stargazers_count),
  npmdl: async (id) => short((await get(`https://api.npmjs.org/downloads/point/last-month/${id}`)).downloads) + '/mo',
};

function render(q, label, msg) {
  let style = ['solid', 'soft', 'outline', 'square', 'plastic', 'ftb'].includes(q.style) ? q.style : 'solid';
  const h = num(q.h, 28, 16, 64), F = FONTS[q.font] || FONTS.Inter;
  let fw = num(q.fw, 600, 300, 900), pad = h * num(q.pad, 40, 10, 120) / 100;
  const fs = Math.round(h * num(q.fsz, 46, 20, 80) / 10) / 10;
  const mc = hex(q.color, '#16a34a'), lc = hex(q.labelColor, '#1b1740');
  const up = on(q.up) || style === 'ftb', grad = on(q.grad) || style === 'plastic';
  if (style === 'ftb') { fw = 700; pad *= 1.3; }
  const r = style === 'square' || style === 'ftb' ? 3 : h / 2 * num(q.rad, 100, 0, 100) / 100;
  const ls = style === 'ftb' ? fs * 0.1 : 0;
  const icon = q.logo ? ICONS[String(q.logo).toLowerCase()] : null, isz = h * 0.5;
  const dot = on(q.dot), dotW = dot ? h * 0.38 : 0, lead = dotW + (icon ? isz + h * 0.18 : 0);
  const lab = up ? label.toUpperCase() : label, m = up ? msg.toUpperCase() : msg;
  const hasL = lab.length > 0;
  const lw = hasL ? tw(lab, fs, fw, ls) + pad * 2 + lead : 0;
  const mW = tw(m, fs, fw, ls) + pad * 2 + (hasL ? 0 : lead);
  const W = Math.ceil(lw + mW), ty = h / 2 + fs * 0.35;

  let lt, mt, dc, lo = 1, body = '';
  if (style === 'soft') { body = `<rect width="${W}" height="${h}" fill="${mc}" fill-opacity=".14"/>`; lt = mt = dc = mc; lo = 0.7; }
  else if (style === 'outline') {
    body = `<rect x=".75" y=".75" width="${W - 1.5}" height="${h - 1.5}" rx="${Math.max(0, r - 0.75)}" fill="none" stroke="${mc}" stroke-width="1.5"/>` + (hasL ? `<rect x="${lw}" width="1.5" height="${h}" fill="${mc}" fill-opacity=".5"/>` : '');
    lt = mt = dc = mc;
  } else {
    body = `<rect width="${W}" height="${h}" fill="${mc}"/>` + (hasL ? `<rect width="${lw}" height="${h}" fill="${lc}"/>` : '');
    lt = contrast(lc); mt = contrast(mc); dc = hasL ? mc : mt;
    if (grad) body += `<rect width="${W}" height="${h}" fill="url(#g)"/>`;
  }
  if (on(q.bord) && style !== 'outline') body += `<rect width="${W}" height="${h}" rx="${r}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="2"/>`;
  lt = hex(q.ltc, lt); mt = hex(q.mtc, mt);

  let d = '';
  if (dot) {
    const cx = pad + h * 0.1, cy = h / 2, dr = h * 0.12, col = hex(q.dotColor, dc), a = q.anim;
    if (a === 'pulse') d += `<circle cx="${cx}" cy="${cy}" r="${dr}" fill="none" stroke="${col}" stroke-width="${h * 0.04}"><animate attributeName="r" values="${dr};${dr * 2.8}" dur="1.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".7;0" dur="1.4s" repeatCount="indefinite"/></circle>`;
    d += `<circle cx="${cx}" cy="${cy}" r="${dr}" fill="${col}">` + (a === 'blink' ? '<animate attributeName="fill-opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/>' : '') + (a === 'bounce' ? `<animate attributeName="cy" values="${cy};${cy - h * 0.1};${cy}" dur=".8s" repeatCount="indefinite"/>` : '') + '</circle>';
  }
  if (icon) d += `<svg x="${pad + dotW}" y="${(h - isz) / 2}" width="${isz}" height="${isz}" viewBox="0 0 24 24"><path fill="${hex(q.logoColor, hasL ? lt : mt)}" d="${icon.path}"/></svg>`;

  const text = `<g font-family="${F}" font-size="${fs}" font-weight="${fw}" letter-spacing="${ls}">` +
    (hasL ? `<text x="${lw / 2 + lead / 2}" y="${ty}" text-anchor="middle" fill="${lt}" fill-opacity="${lo}">${esc(lab)}</text>` : '') +
    `<text x="${lw + mW / 2 + (hasL ? 0 : lead / 2)}" y="${ty}" text-anchor="middle" fill="${mt}">${esc(m)}</text></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label + ' ' + msg)}"><defs><clipPath id="c"><rect width="${W}" height="${h}" rx="${r}"/></clipPath>` +
    (grad ? '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>' : '') +
    `</defs><g clip-path="url(#c)">${body}</g>${d}${text}</svg>`;
}

module.exports = async (req, res) => {
  const q = req.query || {};
  let label = q.label !== undefined ? String(q.label) : '', msg = q.msg !== undefined ? String(q.msg) : '';
  let ttl = 31536000;
  if (q.source) {
    ttl = 600;
    try { if (!SOURCES[q.source]) throw new Error('unknown source'); msg = await SOURCES[q.source](String(q.id || '')); }
    catch (e) { msg = 'unavailable'; ttl = 60; }
  }
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', `public, max-age=${Math.min(ttl, 300)}, s-maxage=${ttl}, stale-while-revalidate=86400`);
  res.status(200).send(render(q, label.slice(0, 60), msg.slice(0, 60)));
};
