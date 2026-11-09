// 数值核对（不进正式构建）：读取页面上实际显示的读数，与独立录入的论文表格 / 代码推算值逐项比对。
// 在 index.html?all=1&motion=reduce 上运行，结果写到 window.__num。期望值按 ICML 正式版 PDF 文本独立录入，不从 sv-data.ts 读取。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const card = (id) => document.querySelector(`[id="${id}"]`);
  const radio = (c, text) => qa('[role=radio]', c).find((b) => b.textContent.trim() === text || b.textContent.includes(text));
  const readout = (c, label) => {
    const r = qa('.sv-read', c).find((x) => x.querySelector('.sv-read-k').textContent.startsWith(label));
    return r ? r.querySelector('.sv-read-v').textContent.trim() : null;
  };
  const N = { checked: 0, bad: [] };
  const eq = (name, got, want) => {
    N.checked++;
    if (String(got) !== String(want)) N.bad.push(`${name}: 页面 ${got} ≠ 期望 ${want}`);
  };
  await sleep(800);

  // 表 1（正式版 p.6）：原始分数与 8 项平均
  const T1 = {
    192: { ToMe: ['54.3 60.5 1563 72.4 65.2 53.1 52.1 27.9', 88.9], FastV: ['52.6 61.0 1605 64.8 69.1 52.1 52.5 26.7', 87.9], PDrop: ['57.1 63.2 1766 82.3 70.2 54.7 56.1 30.5', 95.9], SparseVLM: ['59.5 64.1 1787 85.3 68.7 58.7 57.8 33.1', 99.1] },
    128: { ToMe: ['52.4 53.3 1343 62.8 59.6 50.9 49.1 27.2', 81.9], FastV: ['49.6 56.1 1490 53.4 68.6 48.1 50.5 26.3', 82.4], PDrop: ['56.0 61.1 1664 82.3 69.9 53.3 55.1 30.8', 94.3], SparseVLM: ['58.4 64.5 1746 85.0 68.6 58.2 56.7 29.0', 96.7] },
    64: { ToMe: ['48.6 43.7 1138 52.5 50.0 44.0 45.3 24.1', 71.1], FastV: ['46.1 47.2 1255 38.2 68.7 43.7 47.8 19.6', 72.0], PDrop: ['41.9 33.3 1092 55.9 69.2 40.0 45.9 30.7', 73.4], SparseVLM: ['53.8 60.1 1589 77.5 69.8 52.2 53.4 24.9', 89.3] },
  };
  const c81 = card('m-8.1');
  for (const b of ['192', '128', '64']) {
    radio(c81, `保留 ${b}`).click(); await sleep(40);
    radio(c81, '8 项平均').click(); await sleep(40);
    for (const m of ['ToMe', 'FastV', 'PDrop', 'SparseVLM']) {
      const btn = qa('.sv-hbar', c81).find((x) => x.textContent.includes(m));
      eq(`8.1 ${b} ${m} 平均`, btn.querySelector('b').textContent, `${T1[b][m][1].toFixed(1)}%`);
      btn.click(); await sleep(40);
      const raws = qa('.sv-detail tbody tr', c81).map((tr) => Number(tr.children[1].textContent));
      eq(`8.1 ${b} ${m} 原始分数`, raws.join(' '), T1[b][m][0].split(' ').map(Number).join(' '));
    }
  }
  // PDrop 128 MMB：表中 95.4%，复算 94.6%，应标琥珀
  radio(c81, '保留 128').click(); await sleep(40);
  qa('.sv-hbar', c81).find((x) => x.textContent.includes('PDrop')).click(); await sleep(40);
  const mmb = qa('.sv-detail tbody tr', c81)[1];
  eq('8.1 PDrop128 MMB 表中%', mmb.children[2].textContent, '95.4');
  eq('8.1 PDrop128 MMB 复算%', mmb.children[3].textContent, '94.6');
  eq('8.1 PDrop128 MMB 标记', mmb.children[3].classList.contains('is-flag'), true);

  // 9.1：代码计数式复算（图像之外 118 个）
  const c91 = card('m-9.1');
  const want91 = { 原模型: ['4.62', '4.62'], '192 档': ['2.13', '2.14'], '128 档': ['1.73', '1.72'], '64 档': ['1.31', '1.30'] };
  const uni = { '192 档': '2.03', '128 档': '1.61', '64 档': '1.19' };
  for (const k of Object.keys(want91)) {
    radio(c91, k).click(); await sleep(40);
    eq(`9.1 ${k} 复算`, readout(c91, '本页复算'), want91[k][0]);
    eq(`9.1 ${k} 表1`, readout(c91, '表 1'), want91[k][1]);
    if (uni[k]) eq(`9.1 ${k} 每层都 R 个`, readout(c91, '对照'), uni[k]);
  }

  // 7.1：两种平均（按代码常数推算）
  const c71 = card('m-7.1');
  const want71 = { 192: ['192.0', '206.5', '576 → 309 → 204 → 113'], 128: ['128.6', '145.4', '576 → 312 → 117 → 39'], 64: ['64.8', '82.3', '576 → 82 → 32 → 18'] };
  for (const b of ['192', '128', '64']) {
    radio(c71, `保留 ${b} 个`).click(); await sleep(40);
    eq(`7.1 ${b} 代码口径平均`, readout(c71, '代码口径平均'), want71[b][0]);
    eq(`7.1 ${b} 进入计算平均`, readout(c71, '进入计算的平均'), want71[b][1]);
    eq(`7.1 ${b} 逐层`, q('.sv-tw-seq b', c71).textContent, want71[b][2]);
  }
  radio(c71, '保留 192 个').click(); await sleep(40);
  eq('7.1 192 视觉 KV', readout(c71, '视觉 KV'), '35.9%');

  // 5.1 图像版代码：三层的进入 / 配额 / 删除 / 合并 / 之后
  const c51 = card('m-5.1');
  radio(c51, '图像版代码').click(); await sleep(60);
  const want51 = { 192: '576 300 276 9 309|309 200 109 4 204|204 110 94 3 113', 128: '576 303 273 9 312|312 110 202 7 117|117 36 81 3 39', 64: '576 66 510 16 82|82 30 52 2 32|32 17 15 1 18' };
  for (const b of ['192', '128', '64']) {
    radio(c51, `${b} 档`).click(); await sleep(40);
    const rows = qa('tbody tr', c51).map((tr) => [...tr.children].slice(1).map((td) => td.textContent).join(' ')).join('|');
    eq(`5.1 ${b} 配额表`, rows, want51[b]);
  }
  radio(c51, '论文 Eq. (7)').click(); await sleep(40);
  eq('5.1 rank（Lt=12、40 种图样）', readout(c51, 'rank(P)'), '12');

  // 6.1：回收池与簇数
  const c61 = card('m-6.1');
  eq('6.1 被删', readout(c61, '被删'), '90');
  eq('6.1 回收池', readout(c61, '回收池'), '28');
  eq('6.1 簇数', readout(c61, '簇数'), '3');

  // 6.2：表 4（正式版 p.8）
  const c62 = card('m-6.2');
  const want62 = { GQA: ['52.2 53.8 55.2 56.4 58.1 58.4 59.4 59.5', '+1.6 +1.2 +0.3 +0.1'], POPE: ['72.8 77.5 77.5 81.9 83.7 85.0 85.2 85.3', '+4.7 +4.4 +1.3 +0.1'] };
  for (const b of ['GQA', 'POPE']) {
    radio(c62, b).click(); await sleep(40);
    eq(`6.2 ${b} 分数`, qa('.sv-tr-bar span', c62).map((x) => x.textContent).join(' '), want62[b][0]);
    eq(`6.2 ${b} 提升`, qa('.sv-tr-gain', c62).map((x) => x.textContent).join(' '), want62[b][1]);
  }

  // 3.1：图 5（正式版 p.7，标签读数）
  const c31 = card('m-3.1');
  eq('3.1 图 5', qa('.sv-r-fig5-row b', c31).map((x) => x.textContent).join(' '), '52.6 53.0 53.4 66.1 74.8 77.5');

  // 8.2：VisionZip 表 1 的 SparseVLM(2024.10) 与正式版，192 档
  const c82 = card('m-8.2');
  radio(c82, '保留 192').click(); await sleep(40);
  eq('8.2 192 VisionZip 引用', qa('tbody tr', c82).slice(0, 8).map((tr) => tr.children[4].textContent).join(' '), '57.6 62.5 1721 83.6 69.1 55.8 56.1 31.5');
  eq('8.2 192 正式版', qa('tbody tr', c82).slice(0, 8).map((tr) => tr.children[2].textContent).join(' '), '59.5 64.1 1787 85.3 68.7 58.7 57.8 33.1');

  // 8.3：表 2、表 3
  const c83 = card('m-8.3');
  radio(c83, 'Qwen2-VL').click(); await sleep(40);
  eq('8.3 表 2 平均', qa('tbody tr', c83).map((tr) => tr.children[4].textContent).join(' '), '83.7 82.1 81.4 80.7');
  radio(c83, 'Video-LLaVA').click(); await sleep(40);
  eq('8.3 表 3 准确率', qa('.sv-vid-row b', c83).map((x) => x.textContent).join(' '), '18.9 10.2 14.9 72.0 58.3 71.7 57.1 52.3 56.1 43.6 41.3 45.1');

  // 9.2：表 1 的 FLOPs / 延迟
  const c92 = card('m-9.2');
  qa('.sv-pts button', c92).find((b) => b.textContent.includes('PDrop 64')).click(); await sleep(40);
  eq('9.2 PDrop64 延迟', readout(c92, '延迟'), '43.41 ms');
  qa('.sv-pts button', c92).find((b) => b.textContent.includes('SparseVLM 128')).click(); await sleep(40);
  eq('9.2 SparseVLM128 FLOPs', readout(c92, 'FLOPs'), '1.72 T');
  eq('9.2 SparseVLM128 延迟', readout(c92, '延迟'), '33.28 ms');

  window.__num = N;
})();
'started';
