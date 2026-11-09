// 流程 / 点按 / 数值检查（不进正式构建）。在 index.html（不带 ?all）上运行，结果写到 window.__flow。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const F = {};
  document.documentElement.style.scrollBehavior = 'auto';
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const topOf = (id) => Math.round(document.getElementById(id).getBoundingClientRect().top);
  // 先确认按钮中心没被别的元素盖住，再点
  const tap = (el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const ok = hit === el || el.contains(hit);
    if (ok) el.click();
    return ok;
  };
  await sleep(800);
  F.initialChapters = qa('section.chap[id^="chap-"]').length;
  // 封面 → 开始学习
  tap(qa('.hero-cta .chap-loader-btn')[0]); await sleep(600);
  F.afterStart = { chapters: qa('section.chap[id^="chap-"]').length, chap1Top: topOf('chap-1') };
  // 继续 §2、§3
  for (const n of [1, 2]) { tap(qa(`#chap-${n} .chap-loader-btn`)[0]); await sleep(600); }
  F.afterContinue = { chapters: qa('section.chap[id^="chap-"]').length, chap3Top: topOf('chap-3') };
  // 侧栏 / 抽屉跳到 §8
  const drawer = getComputedStyle(q('.v9-topbar')).display !== 'none';
  if (drawer) { tap(q('.v9-menu')); await sleep(300); }
  F.drawerOpened = drawer ? q('.slide-sidebar').classList.contains('is-open') : 'n/a（侧栏常驻）';
  const item = qa('.side-item').find((b) => b.textContent.includes('§8'));
  item.click(); await sleep(1500);
  F.jump8 = { chapters: qa('section.chap[id^="chap-"]').length, chap8Top: topOf('chap-8'), drawerClosed: !q('.slide-sidebar').classList.contains('is-open'), hash: location.hash };
  if (drawer) {
    tap(q('.v9-menu')); await sleep(200);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(200);
    const escClosed = !q('.slide-sidebar').classList.contains('is-open');
    tap(q('.v9-menu')); await sleep(200);
    q('.v9-scrim')?.click(); await sleep(200);
    F.drawer = { escClosed, scrimClosed: !q('.slide-sidebar').classList.contains('is-open') };
  }
  // 章内进度条跳到 §10，再进收束
  tap(qa('#chap-8 .flow-step').find((b) => b.textContent === '§10')); await sleep(1500);
  F.flowJump10 = { chap10Top: topOf('chap-10') };
  tap(q('#chap-10 .chap-loader-btn')); await sleep(1500);
  F.closing = { closingTop: topOf('closing'), videos: qa('#videos .dl-video-card').length, covers: qa('#videos img').length };

  // 10.1：每个筛选 × 每个条目，点按前确认没被遮挡，核对详情标题与选中项一致
  const card = document.getElementById('m-10.1');
  const res101 = { taps: 0, blocked: 0, mismatch: 0 };
  for (const f of qa('[role=radio]', card)) {
    tap(f); await sleep(60);
    for (const b of qa('.sv-list button', card)) {
      if (!tap(b)) { res101.blocked++; continue; }
      res101.taps++; await sleep(40);
      const title = q('.sv-detail h5', card).textContent;
      const sel = qa('.sv-list button[aria-pressed="true"]', card).map((x) => x.textContent.trim());
      if (sel.length !== 1 || !title.startsWith(sel[0])) res101.mismatch++;
    }
  }
  F.codemap = res101;
  // 结论分级同理
  const vc = document.getElementById('m-✦');
  const resV = { taps: 0, blocked: 0, mismatch: 0 };
  for (const f of qa('[role=radio]', vc)) {
    tap(f); await sleep(60);
    for (const b of qa('.sv-list button', vc)) {
      if (!tap(b)) { resV.blocked++; continue; }
      resV.taps++; await sleep(40);
      const title = q('.sv-detail h5', vc).textContent;
      const sel = qa('.sv-list button[aria-pressed="true"]', vc).map((x) => x.textContent.trim());
      if (sel.length !== 1 || title !== sel[0]) resV.mismatch++;
    }
  }
  F.verdict = resV;
  // 10.1 的“去 §N 细看”
  tap(qa('[role=radio]', card)[0]); await sleep(60);
  tap(qa('.sv-list button', card).find((b) => b.textContent.includes('组内合并'))); await sleep(60);
  tap(qa('.sv-btn', card).find((b) => b.textContent.includes('去 §'))); await sleep(1500);
  F.codemapJump = { target: '§6', chap6Top: topOf('chap-6') };
  window.__flow = F;
})();
'started';
