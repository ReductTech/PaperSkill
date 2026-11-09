// 宽度检查（取自 DivPrune v9.5 的 tools/measure/layout.js，改为 SparseVLM 的卡片与控件；不进正式构建）：记录页面自身的 window.innerWidth，检查侧栏状态、正文可用宽度，
// 以及每张卡片的三类问题：元素越出卡片、元素内部被裁切（scroll > client）、文字与文字互相重叠。
// 用 window.__layoutCheck(states) 调用；states = true 时还会切换每个分段 / 开关 / 列表按钮 / 滑块端点再查。
window.__layoutCheck = async (states = false) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const setR = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); };
  const side = document.querySelector('.slide-sidebar');
  const sideRect = side.getBoundingClientRect();
  const info = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    sidebarVisible: sideRect.right > 0 && getComputedStyle(side).transform === 'none',
    topbar: getComputedStyle(document.querySelector('.v9-topbar')).display !== 'none',
    moduleBody: Math.round((document.querySelector('.module-body') || document.body).getBoundingClientRect().width),
    pageScrollX: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
  // 文字片段的屏幕矩形（逐个文本节点，按行拆开）
  const textRects = (root) => {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('details:not([open])') || el.closest('select') || el.closest('[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) out.push({ r, t: n.textContent.trim().slice(0, 14) });
    }
    return out;
  };
  const overlaps = (card) => {
    const rs = textRects(card); const hits = [];
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i].r, b = rs[j].r;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 3 && oy > 3) hits.push(rs[i].t + ' × ' + rs[j].t);
    }
    return hits;
  };
  const check = (card) => {
    const cr = card.getBoundingClientRect(); const bad = [];
    card.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; if (r.right > cr.right + 1 || r.left < cr.left - 1) bad.push('越界 ' + String(el.className).split(' ')[0] + ' ' + Math.round(Math.max(r.right - cr.right, cr.left - r.left))); });
    card.querySelectorAll('*').forEach((el) => { if (el.tagName === 'CANVAS' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.closest('details:not([open])')) return; if (el.clientWidth && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) bad.push('裁切 ' + String(el.className).split(' ')[0] + ' ' + (el.textContent || '').trim().slice(0, 12)); });
    overlaps(card).forEach((h) => bad.push('重叠 ' + h));
    return [...new Set(bad)];
  };
  const cards = [...document.querySelectorAll('.module, .analogy-card, .hero, .dl-related-section, #closing .sv-verdict-cols, #glossary, #sources, .formula-explain, .v9-facts, .v9-check')];
  const bad = []; let checks = 0;
  for (const card of cards) {
    const name = card.id || ((card.closest('.chap') || {}).id + ' ' + card.className.split(' ')[0]);
    const audit = (label) => { checks++; const r = check(card); if (r.length) bad.push({ card: name, state: label, issues: r.slice(0, 4) }); };
    audit('默认');
    if (!states) continue;
    for (const g of [...card.querySelectorAll('[role=radiogroup]')]) { const radios = [...g.querySelectorAll('[role=radio]')]; for (const r of radios) { r.click(); await sleep(45); audit(g.getAttribute('aria-label') + '=' + r.textContent); } radios[0]?.click(); await sleep(20); }
    for (const el of [...card.querySelectorAll('input[type=range]')]) { const v0 = el.value; for (const f of [0, 1]) { setR(el, f ? el.max : el.min); await sleep(40); audit('滑块 ' + (f ? '最大' : '最小')); } setR(el, v0); await sleep(20); }
    for (const c of card.querySelectorAll('input[type=checkbox]')) { c.click(); await sleep(45); audit('开关'); c.click(); await sleep(20); }
    for (const b of [...card.querySelectorAll('button[aria-pressed]')]) { b.click(); await sleep(30); audit('按钮 ' + b.textContent.trim().slice(0, 8)); }
    for (const g of [...card.querySelectorAll('.sv-guess-opts button')].slice(0, 1)) { g.click(); await sleep(40); audit('先猜作答'); const again = [...card.querySelectorAll('.sv-btn')].find((b) => b.textContent.includes('再猜')); again?.click(); await sleep(20); }
    for (const b of [...card.querySelectorAll('.sv-btn')].filter((b) => /下一步|上一步/.test(b.textContent))) { for (let i = 0; i < 7 && !b.disabled; i++) { b.click(); await sleep(30); audit(b.textContent.trim() + i); } }
    const det = card.querySelector('details'); if (det) { det.open = true; await sleep(20); audit('展开出处'); det.open = false; }
  }
  // 按卡片汇总
  const byCard = {};
  for (const b of bad) { byCard[b.card] = byCard[b.card] || new Set(); b.issues.forEach((i) => byCard[b.card].add(i)); }
  return { ...info, cards: cards.length, checks, badStates: bad.length, byCard: Object.fromEntries(Object.entries(byCard).map(([k, v]) => [k, [...v].slice(0, 4)])) };
};
