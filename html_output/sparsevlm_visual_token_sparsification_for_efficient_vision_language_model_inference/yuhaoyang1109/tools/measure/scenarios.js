// SparseVLM 性能 / 状态场景（改写自 DivPrune v9.5 的 scenarios.js）。在 measure.html?all=1 上运行（1440×900，减少动态效果关闭），
// harness.js 接管 rAF 与 IntersectionObserver：用虚拟帧推进，结果写到 window.__result。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const R = {};
  document.documentElement.style.scrollBehavior = 'auto';
  const io = () => window.__io();
  const go = async (id) => { document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }); await sleep(80); io(); await sleep(30); };
  const cv = (id) => document.querySelector(`[id="${id}"] canvas`);
  const setRange = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); };
  await sleep(1000);
  window.scrollTo(0, 0); await sleep(80); io();

  // S1 封面在视口内：播放中有 1 个循环；7 秒（420 帧）后应停止
  await __pump(10);
  R.S1_cover_playing = __summary(await __pump(60));
  await __pump(420);
  R.S1_cover_after_7s = __summary(await __pump(60));

  // S2 停在 6.1（按步播放用 setTimeout，不开 rAF）
  await go('m-6.1');
  await __pump(10);
  R.S2_at_6_1_idle = __summary(await __pump(120));

  // S3 拖动 2.1 保留比例：每帧改一次值共 10 帧；松手后几帧静止
  await go('m-2.1');
  await __settle(cv('m-2.1'));
  const s3 = document.querySelector('[id="m-2.1"] input[type=range]');
  for (let i = 1; i <= 10; i += 1) { setRange(s3, 12 + i * 3); await __pump(1); }
  R.S3_slider_settle_frames = await __settle(cv('m-2.1'));

  // S4 2.1 切到“评分员打分”后点另一个问题（保留的图块随问题改变）：离散切换的过渡帧数
  //   先等 200ms，避开滑块“直接到位”的 120ms 窗口。“不看问题”模式下换问题不改变保留图块，没有过渡，属正常。
  await sleep(200);
  [...document.querySelectorAll('[id="m-2.1"] [role=radio]')].find((b) => b.textContent.includes('评分员')).click();
  await sleep(30);
  await __settle(cv('m-2.1'));
  [...document.querySelectorAll('[id="m-2.1"] [role=radio]')].find((b) => b.textContent.includes('公交')).click();
  await sleep(30);
  R.S4_click_settle_frames = await __settle(cv('m-2.1'));

  // S5 6.1 连点 5 次“下一步”，再点 2 次“上一步”（中间不给帧）；步骤与反馈是否一致
  await go('m-6.1');
  const btn = (t) => [...document.querySelectorAll('[id="m-6.1"] button')].find((b) => b.textContent.trim() === t);
  // 两次点击之间留一个宏任务（真实连点也是不同的事件），仍然不给帧
  for (let i = 0; i < 5; i += 1) { btn('下一步').click(); await sleep(0); }
  btn('上一步').click(); await sleep(0); btn('上一步').click();
  await sleep(40);
  R.S5_rapid_settle_frames = await __settle(cv('m-6.1'));
  R.S5_step = document.querySelector('[id="m-6.1"] .lv-ph.is-cur')?.textContent;
  R.S5_feedback = document.querySelector('[id="m-6.1"] .sv-fb')?.textContent.slice(0, 18);

  // S6 7.1 时间轴：进入视口自动播放；播放中滚走 → 屏外不画、不推进；回来从原进度继续
  await go('m-7.1');
  await __pump(60);
  const range = () => Number(document.querySelector('[id="m-7.1"] .lv-tbar-range').value);
  R.S6_playing = __summary(await __pump(30));
  const p0 = range();
  await go('m-9.2');
  R.S6_offscreen = __summary(await __pump(120));
  await go('m-7.1');
  const p1 = range();
  for (let i = 0; i < 3; i += 1) { await __pump(10); await sleep(120); }  // 进度条显示约每 90ms（真实时间）刷新一次
  R.S6_progress = { beforeLeave: p0, afterBack: p1, after30More: range() };

  // S6b 播放中连点阶段按钮再拖时间轴：画面与读数是否一致
  // S7 1.1：暂停后拖动滑块，松手几帧静止
  await go('m-1.1');
  const pauseBtn = document.querySelector('[id="m-1.1"] .lv-tbar-btn[aria-label="暂停"]');
  pauseBtn?.click(); await sleep(30);
  const s7 = document.querySelector('[id="m-1.1"] .sv-range input');
  for (let i = 1; i <= 10; i += 1) { setRange(s7, 100 + i * 10); await __pump(1); }
  R.S7_slider_settle_frames = await __settle(cv('m-1.1'));

  // S8 6.1 自动播放（快）在屏外暂停、回来继续（真实时间，setTimeout 驱动）
  await go('m-6.1');
  for (let i = 0; i < 6; i += 1) { btn('上一步')?.click(); await sleep(0); }
  await sleep(40);
  [...document.querySelectorAll('[id="m-6.1"] [role=radio]')].find((b) => b.textContent === '快').click();
  btn('自动播放').click();
  await sleep(3200);
  const sA = document.querySelector('[id="m-6.1"] .lv-ph.is-cur')?.textContent;
  await go('m-9.2');
  await sleep(3200);
  const sB = document.querySelector('[id="m-6.1"] .lv-ph.is-cur')?.textContent;
  await go('m-6.1');
  await sleep(1600);
  const sC = document.querySelector('[id="m-6.1"] .lv-ph.is-cur')?.textContent;
  R.S8_autoplay_offscreen = { after3s: sA, after3sOffscreen: sB, after1_6sBack: sC };

  // S9 停在 9.2：全部画布静止或在屏外
  await go('m-9.2');
  await __pump(60);
  R.S9_idle = __summary(await __pump(120));
  R.pendingLoops = __pending();
  window.__result = R;
})();
'started';
