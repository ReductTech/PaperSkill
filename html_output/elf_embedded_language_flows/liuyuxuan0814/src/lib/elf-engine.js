/* eslint-disable */
// ELF 教程交互引擎（从单 HTML 成品提取，逻辑原样保留）。
// React 挂载完成后由 App 调用 initElfTutorial() 执行。
export function initElfTutorial() {
/* ========================================================================
   ELF Interactive Tutorial — 学术风格（无游戏化）
   每个模块多个递进功能：slider + view-switch + click-explore + step
   ======================================================================== */
// JSDOM 兼容：让 canvas.getContext 在不支持 canvas 的环境返回 no-op proxy
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype._noCtxFix) {
  const _origGC = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(t) {
    const ctx = _origGC.call(this, t);
    if (ctx) return ctx;
    const noop = () => ({});
    return new Proxy({}, {
      get: (tt, p) => {
        if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop: noop });
        if (p === 'measureText') return () => ({ width: 0 });
        if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
        return noop;
      },
      set: () => true
    });
  };
  HTMLCanvasElement.prototype._noCtxFix = true;
}
const $ = (id) => document.getElementById(id);
const $qa = (sel, p) => Array.from((p || document).querySelectorAll(sel));

/* ---------- Hero：GPT vs ELF 对比动画 ---------- */
(function() {
  const words = ['I', 'love', 'Chinese', 'landscape'];

  // --- GPT：逐字从左到右蹦出 ---
  const gptCv = $('bg-cvs-gpt');
  if (gptCv) {
    const ctx = gptCv.getContext('2d');
    const W = gptCv.width, H = gptCv.height;
    let gptPhase = 0;
    function drawGpt() {
      ctx.fillStyle = '#fafbfc'; ctx.fillRect(0, 0, W, H);
      const slotW = W / (words.length + 1);
      const visible = Math.floor(gptPhase);
      const partial = gptPhase - visible;
      for (let i = 0; i < words.length; i++) {
        const x = slotW * (i + 1);
        const y = H / 2;
        if (i < visible) {
          ctx.fillStyle = '#475569'; ctx.font = 'bold 16px Georgia';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(words[i], x, y);
          ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
          ctx.strokeRect(x - 28, y - 14, 56, 28);
        } else if (i === visible) {
          const offset = (1 - partial) * 20;
          ctx.globalAlpha = partial;
          ctx.fillStyle = '#475569'; ctx.font = 'bold 16px Georgia';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(words[i], x, y + offset);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x - 28, y - 14, 56, 28);
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x - 28, y - 14, 56, 28);
          ctx.setLineDash([]);
        }
      }
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(20, H - 16); ctx.lineTo(W - 20, H - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 20, H - 16); ctx.lineTo(W - 26, H - 19); ctx.lineTo(W - 26, H - 13); ctx.closePath();
      ctx.fillStyle = '#94a3b8'; ctx.fill();
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px "Microsoft YaHei"';
      ctx.textAlign = 'left';
      ctx.fillText('time →', 20, H - 20);
      gptPhase += 0.04;
      if (gptPhase > words.length + 1) gptPhase = 0;
    }
    let gptVisible = false;
    const gptObs = new IntersectionObserver((entries) => {
      gptVisible = entries[0].isIntersecting;
    });
    gptObs.observe(gptCv);
    function gptLoop() {
      if (gptVisible) drawGpt();
      requestAnimationFrame(gptLoop);
    }
    gptLoop();
  }

  // --- ELF：所有词同时从噪声还原 ---
  const elfCv = $('bg-cvs-elf');
  if (elfCv) {
    const ctx = elfCv.getContext('2d');
    const W = elfCv.width, H = elfCv.height;
    let elfPhase = 0;
    function drawElf() {
      ctx.fillStyle = '#fafbfc'; ctx.fillRect(0, 0, W, H);
      const slotW = W / (words.length + 1);
      const noiseLevel = Math.abs(Math.sin(elfPhase * 0.015));
      for (let i = 0; i < words.length; i++) {
        const x = slotW * (i + 1);
        const y = H / 2 - 5;
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
        ctx.strokeRect(x - 28, y - 14, 56, 28);
        if (noiseLevel < 0.85) {
          ctx.globalAlpha = 1 - noiseLevel;
          ctx.fillStyle = '#2563eb'; ctx.font = 'bold 16px Georgia';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(words[i], x, y);
          ctx.globalAlpha = 1;
        }
        if (noiseLevel > 0.1) {
          for (let j = 0; j < 8; j++) {
            const nx = x - 24 + Math.random() * 48;
            const ny = y - 10 + Math.random() * 20;
            const sz = 1 + Math.random() * 2;
            ctx.fillStyle = 'rgba(148,163,184,' + (noiseLevel * 0.7) + ')';
            ctx.fillRect(nx, ny, sz, sz);
          }
        }
      }
      const barY = H - 16;
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(20, barY, W - 40, 4);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(20, barY, (W - 40) * (1 - noiseLevel), 4);
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px "Microsoft YaHei"';
      ctx.textAlign = 'left';
      const label = noiseLevel > 0.7 ? '噪声' : (noiseLevel > 0.3 ? '去噪中...' : '清晰 ✓');
      ctx.fillText(label, 20, barY - 6);
      elfPhase++;
    }
    let elfVisible = false;
    const elfObs = new IntersectionObserver((entries) => {
      elfVisible = entries[0].isIntersecting;
    });
    elfObs.observe(elfCv);
    function elfLoop() {
      if (elfVisible) drawElf();
      requestAnimationFrame(elfLoop);
    }
    elfLoop();
  }
})();

/* ---------- 表格交互 ---------- */
$qa('#result-table tbody tr').forEach(tr => {
  tr.addEventListener('click', () => {
    $('lbl-result-detail').textContent = tr.dataset.detail;
    $('lbl-result-detail').classList.add('good');
  });
});

/* 通用工具函数 */
function lerp(a, b, t) { return a + (b - a) * t; }

/* ---------- §1 噪声 — 三列独立canvas演示 ---------- */
(function() {
  const cvClean = $('cv-clean');
  const cvNoisy = $('cv-noisy');
  const cvRecover = $('cv-recover');
  if (!cvClean || !cvNoisy || !cvRecover) return;

  const ctxClean = cvClean.getContext('2d');
  const ctxNoisy = cvNoisy.getContext('2d');
  const ctxRecover = cvRecover.getContext('2d');

  let noiseT = 0.40, trainPct = 0.60;
  let noiseTimer = null, trainTimer = null;

  const toks = ['我','爱','中','国','山','水'];
  const noiseVocab = ['硝','铂','霖','鍪','爝','鬣','氚','熵','砜','鱚','魍','飝'];
  const noiseChars = toks.map((_, i) => noiseVocab[(i * 3 + 1) % noiseVocab.length]);

  function drawTokens(ctx, W, H, noiseLevel, recoverQuality, label, color) {
    ctx.clearRect(0, 0, W, H);
    const boxW = Math.min(58, (W - 30) / 6 - 4);
    const boxH = 48;
    const gap = 4;
    const totalW = 6 * boxW + 5 * gap;
    const gx = (W - totalW) / 2;
    const gy = (H - boxH) / 2 + 4;

    for (let i = 0; i < 6; i++) {
      const x = gx + i * (boxW + gap);
      const y = gy;

      let bgR, bgG, bgB, bdR, bdG, bdB;
      const cleanBg = [236, 253, 245], noiseBg = [254, 242, 242], recoverBg = [239, 246, 255];
      const cleanBd = [22, 163, 74], noiseBd = [239, 68, 68], recoverBd = [59, 130, 246];

      if (recoverQuality >= 0) {
        bgR = lerp(noiseBg[0], recoverBg[0], recoverQuality);
        bgG = lerp(noiseBg[1], recoverBg[1], recoverQuality);
        bgB = lerp(noiseBg[2], recoverBg[2], recoverQuality);
        bdR = lerp(noiseBd[0], recoverBd[0], recoverQuality);
        bdG = lerp(noiseBd[1], recoverBd[1], recoverQuality);
        bdB = lerp(noiseBd[2], recoverBd[2], recoverQuality);
      } else {
        bgR = lerp(cleanBg[0], noiseBg[0], noiseLevel);
        bgG = lerp(cleanBg[1], noiseBg[1], noiseLevel);
        bgB = lerp(cleanBg[2], noiseBg[2], noiseLevel);
        bdR = lerp(cleanBd[0], noiseBd[0], noiseLevel);
        bdG = lerp(cleanBd[1], noiseBd[1], noiseLevel);
        bdB = lerp(cleanBd[2], noiseBd[2], noiseLevel);
      }

      ctx.fillStyle = 'rgb(' + Math.floor(bgR) + ',' + Math.floor(bgG) + ',' + Math.floor(bgB) + ')';
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = 'rgb(' + Math.floor(bdR) + ',' + Math.floor(bdG) + ',' + Math.floor(bdB) + ')';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxW, boxH);

      const cleanAlpha = recoverQuality >= 0 ? recoverQuality : Math.max(0.1, 1 - noiseLevel * 0.9);
      ctx.globalAlpha = cleanAlpha;
      ctx.fillStyle = '#1a2e1a';
      ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(toks[i], x + boxW/2, y + boxH/2);

      const noiseAlpha = recoverQuality >= 0 ? (1 - recoverQuality) * 0.85 : noiseLevel * 0.85;
      if (noiseAlpha > 0.05) {
        ctx.globalAlpha = noiseAlpha;
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        ctx.fillText(noiseChars[i], x + boxW/2 + 2, y + boxH/2 + 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  function drawAll() {
    const W1 = cvClean.width, H1 = cvClean.height;
    const W2 = cvNoisy.width, H2 = cvNoisy.height;
    const W3 = cvRecover.width, H3 = cvRecover.height;

    drawTokens(ctxClean, W1, H1, 0, -1, '原始文本', 'green');
    drawTokens(ctxNoisy, W2, H2, noiseT, -1, '加噪后', 'red');
    const effectiveQuality = trainPct * (1 - Math.abs(noiseT - 0.5) * 0.5);
    drawTokens(ctxRecover, W3, H3, noiseT, effectiveQuality, '网络恢复', 'blue');
  }

  $('rng-noise').addEventListener('input', (e) => {
    noiseT = +e.target.value / 100;
    $('lbl-noise').textContent = noiseT.toFixed(2);
    drawAll();
  });
  $('rng-train').addEventListener('input', (e) => {
    trainPct = +e.target.value / 100;
    $('lbl-train').textContent = Math.round(trainPct * 100) + '%';
    drawAll();
  });

  $('btn-noise-anim').addEventListener('click', () => {
    if (noiseTimer) {
      clearInterval(noiseTimer); noiseTimer = null;
      $('btn-noise-anim').textContent = '▶ 加噪过程'; return;
    }
    $('btn-noise-anim').textContent = '⏸ 暂停';
    let dir = 1;
    let t = Math.round(noiseT * 100);
    noiseTimer = setInterval(() => {
      t += dir * 2;
      if (t >= 100) { t = 100; dir = -1; }
      if (t <= 0) { t = 0; dir = 1; }
      noiseT = t / 100;
      $('rng-noise').value = t;
      $('lbl-noise').textContent = noiseT.toFixed(2);
      drawAll();
    }, 60);
  });

  $('btn-train-anim').addEventListener('click', () => {
    if (trainTimer) {
      clearInterval(trainTimer); trainTimer = null;
      $('btn-train-anim').textContent = '▶ 训练过程'; return;
    }
    $('btn-train-anim').textContent = '⏸ 暂停';
    let t = 0;
    trainTimer = setInterval(() => {
      t += 2;
      if (t >= 100) { t = 100; clearInterval(trainTimer); trainTimer = null; $('btn-train-anim').textContent = '▶ 训练过程'; }
      trainPct = t / 100;
      $('rng-train').value = t;
      $('lbl-train').textContent = t + '%';
      drawAll();
    }, 50);
  });

  drawAll();
})();

/* ---------- §2 嵌入 2D/3D 可视化 ---------- */
const cvE = $('cv-embed');
const ctxE = cvE.getContext('2d');
// 3D 坐标 (x, y, z)，全部限制在 [0, 500] 范围内
// 动物类 (cat/dog/bird) 在 x=100-150 区域聚集
// 天气类 (sun/rain) 在 x=350-400 区域聚集
// 行为类 (run) 在 x=230-280 区域
// y/z 轴上 3 类在不同维度上分离，确保 3 种投影都能看到 3 类的空间关系
const embedWords = [
  { word: 'cat',   cat: 0, x: 100, y: 110, z: 130 },
  { word: 'dog',   cat: 0, x: 130, y: 100, z: 150 },
  { word: 'bird',  cat: 0, x: 145, y: 105, z: 135 },
  { word: 'sun',   cat: 1, x: 360, y: 100, z: 360 },
  { word: 'rain',  cat: 1, x: 400, y: 130, z: 400 },
  { word: 'run',   cat: 2, x: 250, y: 380, z: 250 }
];
const catColors = { 0: '#4a5d3a', 1: '#a8553a', 2: '#5b7a8c' };
const initEmbed = embedWords.map(p => ({ ...p }));
// proj = 'xy' | 'xz' | 'yz'，决定 2D 投影用哪两个维度
let projMode = 'xy';
let embedLabels = false, dragIdx = -1;

function project(p) {
  // 返回当前投影下的 (x, y) 画布坐标
  // 简单实现：每维映射到 40-720 (x) 或 30-300 (y)
  const mapX = v => 50 + (v / 500) * 700;  // z 维 0-500 映射到画布
  const mapY = v => 30 + (v / 500) * 260;
  if (projMode === 'xy') return { x: mapX(p.x), y: mapY(p.y) };
  if (projMode === 'xz') return { x: mapX(p.x), y: mapY(p.z) };
  /* yz */              return { x: mapX(p.y), y: mapY(p.z) };
}

function drawEmbed() {
  ctxE.fillStyle = '#ffffff'; ctxE.clearRect(0, 0, cvE.width, cvE.height);
  ctxE.fillRect(0, 0, cvE.width, cvE.height);
  // 网格
  ctxE.strokeStyle = '#e5e8ef'; ctxE.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctxE.beginPath(); ctxE.moveTo(40 + i * 72, 20); ctxE.lineTo(40 + i * 72, cvE.height - 20); ctxE.stroke();
    ctxE.beginPath(); ctxE.moveTo(40, 20 + i * 28); ctxE.lineTo(cvE.width - 20, 20 + i * 28); ctxE.stroke();
  }
  // 坐标轴标签
  ctxE.strokeStyle = '#4a4a4a'; ctxE.lineWidth = 1.5;
  ctxE.beginPath(); ctxE.moveTo(40, 20); ctxE.lineTo(40, cvE.height - 20); ctxE.lineTo(cvE.width - 20, cvE.height - 20); ctxE.stroke();
  ctxE.fillStyle = '#4a4a4a'; ctxE.font = '11px Georgia';
  const xLabel = projMode === 'xy' ? 'dim 1 (x)' : (projMode === 'xz' ? 'dim 1 (x)' : 'dim 1 (y)');
  const yLabel = projMode === 'xy' ? 'dim 2 (y)' : (projMode === 'xz' ? 'dim 2 (z)' : 'dim 2 (z)');
  ctxE.fillText(xLabel, cvE.width - 80, cvE.height - 8);
  ctxE.save();
  ctxE.translate(14, 60);
  ctxE.rotate(-Math.PI / 2);
  ctxE.fillText(yLabel, 0, 0);
  ctxE.restore();

  // 圆点（按投影后的位置）
  embedWords.forEach(p => {
    const pos = project(p);
    ctxE.fillStyle = catColors[p.cat];
    ctxE.beginPath(); ctxE.arc(pos.x, pos.y, 14, 0, Math.PI * 2); ctxE.fill();
    ctxE.strokeStyle = '#1a1a1a'; ctxE.lineWidth = 1.5; ctxE.stroke();
    if (embedLabels) {
      ctxE.fillStyle = '#1a1a1a'; ctxE.font = '12px Consolas';
      ctxE.fillText(p.word, pos.x + 16, pos.y + 4);
    }
  });
}

function getMouseCv(cv, e) {
  const rect = cv.getBoundingClientRect();
  const sx = cv.width / rect.width, sy = cv.height / rect.height;
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
}

function hitTest(mx, my) {
  for (let i = 0; i < embedWords.length; i++) {
    const pos = project(embedWords[i]);
    const dx = mx - pos.x, dy = my - pos.y;
    if (dx * dx + dy * dy < 196) return i;
  }
  return -1;
}

// 用 pointer events，鼠标 + 触屏都支持
function onPointerDown(e) {
  e.preventDefault();
  const { x, y } = getMouseCv(cvE, e);
  dragIdx = hitTest(x, y);
  if (dragIdx >= 0) {
    try { cvE.setPointerCapture(e.pointerId); } catch (_) {}
  }
}
function onPointerMove(e) {
  if (dragIdx < 0) return;
  e.preventDefault();
  const { x, y } = getMouseCv(cvE, e);
  // 把画布坐标反投影回 3D
  const p = embedWords[dragIdx];
  if (projMode === 'xy') { p.x = (x - 50) / 700 * 500; p.y = (y - 30) / 260 * 500; }
  else if (projMode === 'xz') { p.x = (x - 50) / 700 * 500; p.z = (y - 30) / 260 * 500; }
  else { p.y = (x - 50) / 700 * 500; p.z = (y - 30) / 260 * 500; }
  // 限幅
  p.x = Math.max(0, Math.min(500, p.x));
  p.y = Math.max(0, Math.min(500, p.y));
  p.z = Math.max(0, Math.min(500, p.z));
  drawEmbed();
}
function onPointerUp(e) {
  dragIdx = -1;
  try { cvE.releasePointerCapture(e.pointerId); } catch (_) {}
}
cvE.addEventListener('pointerdown', onPointerDown);
cvE.addEventListener('pointermove', onPointerMove);
cvE.addEventListener('pointerup', onPointerUp);
cvE.addEventListener('pointercancel', onPointerUp);
// 兜底鼠标事件
cvE.addEventListener('mousedown', (e) => { if (dragIdx < 0) onPointerDown(e); });
cvE.addEventListener('mousemove', (e) => { if (dragIdx >= 0) onPointerMove(e); });
cvE.addEventListener('mouseup', onPointerUp);

$('btn-embed-reset').addEventListener('click', () => {
  initEmbed.forEach((v, i) => Object.assign(embedWords[i], v));
  drawEmbed();
});
$('btn-embed-labels').addEventListener('click', () => {
  embedLabels = !embedLabels;
  $('btn-embed-labels').textContent = embedLabels ? '隐藏标签' : '显示标签';
  $('btn-embed-labels').classList.toggle('active', embedLabels);
  drawEmbed();
});
$('btn-embed-shuffle').addEventListener('click', () => {
  // 打散后自动归位：模拟"网络学会把词放回正确位置"
  const btn = $('btn-embed-shuffle');
  btn.disabled = true;
  btn.textContent = '🔄 归位中...';
  // 第一步：随机打散
  const scatter = embedWords.map(p => ({
    x: 50 + Math.random() * 400,
    y: 50 + Math.random() * 400,
    z: 50 + Math.random() * 400,
  }));
  embedWords.forEach((p, i) => { p.x = scatter[i].x; p.y = scatter[i].y; p.z = scatter[i].z; });
  drawEmbed();
  // 第二步：动画归位（弹性插值）
  const targets = initEmbed.map(v => ({ x: v.x, y: v.y, z: v.z }));
  const start = embedWords.map(p => ({ x: p.x, y: p.y, z: p.z }));
  const dur = 1800;
  const t0 = performance.now();
  function animateBack(ts) {
    const t = Math.min(1, (ts - t0) / dur);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    embedWords.forEach((p, i) => {
      p.x = start[i].x + (targets[i].x - start[i].x) * ease;
      p.y = start[i].y + (targets[i].y - start[i].y) * ease;
      p.z = start[i].z + (targets[i].z - start[i].z) * ease;
    });
    drawEmbed();
    // 在归位过程中画连接线（词→目标位置）
    if (t < 1) {
      ctxE.save();
      ctxE.strokeStyle = 'rgba(168,85,58,0.3)';
      ctxE.setLineDash([4, 4]); ctxE.lineWidth = 1;
      embedWords.forEach((p, i) => {
        const from = project(p);
        const to = project({ x: targets[i].x, y: targets[i].y, z: targets[i].z });
        ctxE.beginPath(); ctxE.moveTo(from.x, from.y); ctxE.lineTo(to.x, to.y); ctxE.stroke();
      });
      ctxE.restore();
      requestAnimationFrame(animateBack);
    } else {
      btn.disabled = false;
      btn.textContent = '🎲 随机打散';
      // 归位完成后画一个高亮提示
      ctxE.save();
      ctxE.fillStyle = 'rgba(74,93,58,0.85)';
      ctxE.fillRect(cvE.width / 2 - 100, 8, 200, 26);
      ctxE.fillStyle = '#fff'; ctxE.font = 'bold 13px Georgia';
      ctxE.textAlign = 'center';
      ctxE.fillText('✓ 网络已将词归回正确位置', cvE.width / 2, 26);
      ctxE.textAlign = 'left';
      ctxE.restore();
      setTimeout(drawEmbed, 1500);
    }
  }
  requestAnimationFrame(animateBack);
});
drawEmbed();

/* ---------- §3 线性路径可逆性 2D 演示 ---------- */
(function() {
  const cvC = $('cv-cycle');
  if (!cvC) return;
  const ctxC = cvC.getContext('2d');
  let cycleT = 0.3, cycleTimer = null, cycleDir = 1;

  const cleanPt = { x: 140, y: 135 };   // 绿点：清晰的词（起点）
  const noisePt = { x: 660, y: 155 };   // 红点：纯噪声（终点）
  const v = { x: noisePt.x - cleanPt.x, y: noisePt.y - cleanPt.y }; // 加噪方向：清晰→噪声

  function drawCycle() {
    const W = cvC.width, H = cvC.height;
    ctxC.fillStyle = '#fafbfc'; ctxC.fillRect(0, 0, W, H);

    // 网格背景
    ctxC.strokeStyle = '#e8ecf0'; ctxC.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      ctxC.beginPath(); ctxC.moveTo(40 + i * 45, 20); ctxC.lineTo(40 + i * 45, H - 20); ctxC.stroke();
      ctxC.beginPath(); ctxC.moveTo(30, 20 + i * 15); ctxC.lineTo(W - 20, 20 + i * 15); ctxC.stroke();
    }

    // 路径虚线（清晰词 → 纯噪声）
    ctxC.strokeStyle = '#94a3b8'; ctxC.lineWidth = 2; ctxC.setLineDash([6, 4]);
    ctxC.beginPath(); ctxC.moveTo(cleanPt.x, cleanPt.y); ctxC.lineTo(noisePt.x, noisePt.y); ctxC.stroke();
    ctxC.setLineDash([]);

    // 当前位置：t=0在清晰词，t=1在纯噪声
    const cur = {
      x: cleanPt.x + cycleT * v.x,
      y: cleanPt.y + cycleT * v.y,
    };

    // 速度箭头（方向恒定）
    const arrowLen = 55;
    const vLen = Math.sqrt(v.x*v.x + v.y*v.y);
    const ux = v.x / vLen, uy = v.y / vLen;
    ctxC.strokeStyle = '#f59e0b'; ctxC.lineWidth = 3;
    ctxC.beginPath(); ctxC.moveTo(cur.x, cur.y); ctxC.lineTo(cur.x + ux*arrowLen, cur.y + uy*arrowLen); ctxC.stroke();
    ctxC.fillStyle = '#f59e0b';
    const tipX = cur.x + ux*arrowLen, tipY = cur.y + uy*arrowLen;
    ctxC.beginPath();
    ctxC.moveTo(tipX, tipY);
    ctxC.lineTo(tipX - ux*10 + uy*5, tipY - uy*10 - ux*5);
    ctxC.lineTo(tipX - ux*10 - uy*5, tipY - uy*10 + ux*5);
    ctxC.closePath(); ctxC.fill();

    // 绿点：清晰的词
    ctxC.fillStyle = '#16a34a';
    ctxC.beginPath(); ctxC.arc(cleanPt.x, cleanPt.y, 18, 0, Math.PI*2); ctxC.fill();
    ctxC.strokeStyle = '#15803d'; ctxC.lineWidth = 2; ctxC.stroke();
    ctxC.fillStyle = '#fff'; ctxC.font = 'bold 14px "Microsoft YaHei"'; ctxC.textAlign = 'center'; ctxC.textBaseline = 'middle';
    ctxC.fillText('清', cleanPt.x, cleanPt.y);
    ctxC.fillStyle = '#16a34a'; ctxC.font = 'bold 13px "Microsoft YaHei"';
    ctxC.fillText('清晰的词', cleanPt.x, cleanPt.y - 32);

    // 红点：纯噪声
    ctxC.fillStyle = '#ef4444';
    ctxC.beginPath(); ctxC.arc(noisePt.x, noisePt.y, 18, 0, Math.PI*2); ctxC.fill();
    ctxC.strokeStyle = '#dc2626'; ctxC.lineWidth = 2; ctxC.stroke();
    ctxC.fillStyle = '#fff'; ctxC.font = 'bold 14px "Microsoft YaHei"'; ctxC.textAlign = 'center'; ctxC.textBaseline = 'middle';
    ctxC.fillText('噪', noisePt.x, noisePt.y);
    ctxC.fillStyle = '#ef4444'; ctxC.font = 'bold 13px "Microsoft YaHei"';
    ctxC.fillText('纯噪声', noisePt.x, noisePt.y - 32);

    // 蓝点：当前状态
    ctxC.fillStyle = '#2563eb';
    ctxC.beginPath(); ctxC.arc(cur.x, cur.y, 15, 0, Math.PI*2); ctxC.fill();
    ctxC.strokeStyle = '#1e40af'; ctxC.lineWidth = 2; ctxC.stroke();
    ctxC.fillStyle = '#fff'; ctxC.font = 'bold 12px "Microsoft YaHei"'; ctxC.textAlign = 'center'; ctxC.textBaseline = 'middle';
    ctxC.fillText('当', cur.x, cur.y);

    // 方向说明
    ctxC.fillStyle = '#f59e0b'; ctxC.font = 'bold 12px "Microsoft YaHei"';
    ctxC.textAlign = 'left'; ctxC.textBaseline = 'alphabetic';
    ctxC.fillText('方向一直不变 = 速度恒定', cur.x + 15, cur.y - 18);

    ctxC.textAlign = 'left'; ctxC.textBaseline = 'alphabetic';
  }

  const rngT = $('rng-t'), lblT = $('lbl-t');
  const btnAdd = $('btn-add'), btnSub = $('btn-sub'), btnReset = $('btn-reset-cycle');

  function setT(t) {
    cycleT = Math.max(0, Math.min(1, t));
    rngT.value = cycleT * 100; lblT.textContent = Math.round(cycleT * 100) + '%';
    drawCycle();
  }

  if (btnAdd) btnAdd.addEventListener('click', () => {
    if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; btnAdd.textContent = '▶ 加噪（走过去）'; btnSub.textContent = '◀ 去噪（走回来）'; return; }
    cycleDir = 1;
    btnAdd.textContent = '⏸ 暂停'; btnSub.textContent = '◀ 去噪（走回来）';
    cycleTimer = setInterval(() => {
      setT(cycleT + 0.015 * cycleDir);
      if (cycleT >= 0.99) { clearInterval(cycleTimer); cycleTimer = null; btnAdd.textContent = '▶ 加噪（走过去）'; }
    }, 30);
  });
  if (btnSub) btnSub.addEventListener('click', () => {
    if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; btnAdd.textContent = '▶ 加噪（走过去）'; btnSub.textContent = '◀ 去噪（走回来）'; return; }
    cycleDir = -1;
    btnSub.textContent = '⏸ 暂停'; btnAdd.textContent = '▶ 加噪（走过去）';
    cycleTimer = setInterval(() => {
      setT(cycleT + 0.015 * cycleDir);
      if (cycleT <= 0.01) { clearInterval(cycleTimer); cycleTimer = null; btnSub.textContent = '◀ 去噪（走回来）'; }
    }, 30);
  });
  if (rngT) rngT.addEventListener('input', (e) => setT(+e.target.value / 100));
  if (btnReset) btnReset.addEventListener('click', () => {
    if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; btnAdd.textContent = '▶ 加噪（走过去）'; btnSub.textContent = '◀ 去噪（走回来）'; }
    setT(0.3);
  });
  drawCycle();
})();

// ----- 公式符号点击交互（支持多个 formula-explain 块）-----
(function() {
  const blocks = document.querySelectorAll('.formula-explain');
  blocks.forEach((fe, idx) => {
    const syms = fe.querySelectorAll('.fe-formula .sym');
    const descs = fe.querySelectorAll('.fe-symbols .sym-desc');
    syms.forEach(s => {
      s.addEventListener('click', () => {
        const k = s.dataset.sym;
        const isActive = s.classList.contains('active');
        syms.forEach(x => x.classList.remove('active'));
        descs.forEach(x => x.classList.remove('active'));
        if (!isActive) {
          syms.forEach(x => { if (x.dataset.sym === k) x.classList.add('active'); });
          descs.forEach(x => { if (x.dataset.desc === k) x.classList.add('active'); });
        }
      });
    });
    // 默认高亮：第1块高亮 z_t；后续块（如 §5.2 CFG 公式）高亮 v̂_uncond
    const defaultKey = (idx === 0) ? 'zt' : 'vuncond';
    syms.forEach(x => { if (x.dataset.sym === defaultKey) x.classList.add('active'); });
    descs.forEach(x => { if (x.dataset.desc === defaultKey) x.classList.add('active'); });
  });
})();

/* ---------- §5 修复拖拽 — 物理模拟 ---------- */
const cvR = $('cv-repair');
const ctxR = cvR.getContext('2d');
const repair = {
  target: { x: 600, y: 160 },
  current: { x: 200, y: 200, history: [], velocity: { x: 0, y: 0 } }
};
let repairDrag = false;
let physicsFriction = 0.3, physicsStep = 0.2, physicsTimer = null;

function drawRepair() {
  ctxR.fillStyle = '#ffffff'; ctxR.fillRect(0, 0, cvR.width, cvR.height);
  ctxR.strokeStyle = '#e5e8ef'; ctxR.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    ctxR.beginPath(); ctxR.moveTo(40 + i * 45, 30); ctxR.lineTo(40 + i * 45, cvR.height - 30); ctxR.stroke();
    ctxR.beginPath(); ctxR.moveTo(40, 30 + i * 16); ctxR.lineTo(cvR.width - 40, 30 + i * 16); ctxR.stroke();
  }
  ctxR.strokeStyle = 'rgba(168,85,58,0.4)'; ctxR.lineWidth = 1.5;
  ctxR.setLineDash([3, 3]);
  ctxR.beginPath();
  repair.current.history.forEach((p, i) => { i === 0 ? ctxR.moveTo(p.x, p.y) : ctxR.lineTo(p.x, p.y); });
  if (repair.current.history.length) ctxR.lineTo(repair.current.x, repair.current.y);
  ctxR.stroke(); ctxR.setLineDash([]);

  ctxR.fillStyle = '#1a1a1a';
  ctxR.beginPath(); ctxR.arc(repair.target.x, repair.target.y, 12, 0, Math.PI*2); ctxR.fill();
  ctxR.fillStyle = '#ffffff'; ctxR.font = '11px Consolas';
  ctxR.fillText('x₀', repair.target.x - 8, repair.target.y + 4);

  ctxR.fillStyle = '#5b7a8c';
  ctxR.beginPath(); ctxR.arc(repair.current.x, repair.current.y, 11, 0, Math.PI*2); ctxR.fill();
  ctxR.strokeStyle = '#1a1a1a'; ctxR.lineWidth = 1.5; ctxR.stroke();
  ctxR.fillStyle = '#ffffff'; ctxR.font = '11px Consolas';
  ctxR.fillText('z_t', repair.current.x - 8, repair.current.y + 4);

  const dx = repair.target.x - repair.current.x, dy = repair.target.y - repair.current.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len > 1) {
    const ux = dx / len, uy = dy / len;
    const ax = repair.current.x + ux * 40, ay = repair.current.y + uy * 40;
    ctxR.strokeStyle = '#a8553a'; ctxR.lineWidth = 3;
    ctxR.beginPath(); ctxR.moveTo(repair.current.x, repair.current.y); ctxR.lineTo(ax, ay); ctxR.stroke();
    ctxR.fillStyle = '#a8553a';
    ctxR.beginPath();
    ctxR.moveTo(ax, ay);
    ctxR.lineTo(ax - ux * 8 + uy * 4, ay - uy * 8 - ux * 4);
    ctxR.lineTo(ax - ux * 8 - uy * 4, ay - uy * 8 + ux * 4);
    ctxR.closePath(); ctxR.fill();
  }
  const err = Math.sqrt(dx*dx + dy*dy);
  let lbl = '距离误差: ' + err.toFixed(0) + ' px';
  if (physicsTimer) lbl += ' · ⚡ 物理模拟中 (' + repair.current.history.length + ' 步)';
  $('lbl-repair').textContent = lbl;
  $('lbl-repair').style.color = err < 30 ? 'var(--olive)' : (err < 100 ? 'var(--accent)' : 'var(--bad)');
}

cvR.addEventListener('mousedown', (e) => {
  if (physicsTimer) { clearInterval(physicsTimer); physicsTimer = null; $('btn-repair-release').textContent = '🚀 释放（自动滚）'; }
  const { x, y } = getMouseCv(cvR, e);
  const dx = x - repair.current.x, dy = y - repair.current.y;
  if (dx*dx + dy*dy < 169) repairDrag = true;
});
cvR.addEventListener('mousemove', (e) => {
  if (!repairDrag) return;
  const { x, y } = getMouseCv(cvR, e);
  repair.current.x = x; repair.current.y = y;
  drawRepair();
});
cvR.addEventListener('mouseup', () => repairDrag = false);
cvR.addEventListener('mouseleave', () => repairDrag = false);

$('btn-repair-reset').addEventListener('click', () => {
  if (physicsTimer) { clearInterval(physicsTimer); physicsTimer = null; $('btn-repair-release').textContent = '🚀 释放（自动滚）'; }
  repair.current = { x: 200, y: 200, history: [], velocity: { x: 0, y: 0 } };
  drawRepair();
});
$('btn-repair-train').addEventListener('click', () => {
  if (physicsTimer) { clearInterval(physicsTimer); physicsTimer = null; $('btn-repair-release').textContent = '🚀 释放（自动滚）'; }
  for (let s = 0; s < 5; s++) {
    repair.current.history.push({ x: repair.current.x, y: repair.current.y });
    repair.current.x += (repair.target.x - repair.current.x) * 0.3;
    repair.current.y += (repair.target.y - repair.current.y) * 0.3;
  }
  drawRepair();
});
$('btn-repair-release').addEventListener('click', () => {
  if (physicsTimer) {
    clearInterval(physicsTimer); physicsTimer = null;
    $('btn-repair-release').textContent = '🚀 释放（自动滚）';
    return;
  }
  $('btn-repair-release').textContent = '⏸ 暂停';
  // 用 velocity 模拟带摩擦的弹簧-阻尼系统：
  // - 步长 s → 弹簧力强度 (拉向目标)
  // - 摩擦 f → 阻尼系数 (高摩擦=快速收敛；0=永远振荡)
  //   velocity += (target - current) * s
  //   velocity *= (1 - f * 0.5)
  //   current += velocity
  if (!repair.velocity) repair.velocity = { x: 0, y: 0 };
  repair.velocity.x = 0; repair.velocity.y = 0;
  physicsTimer = setInterval(() => {
    const dx = repair.target.x - repair.current.x;
    const dy = repair.target.y - repair.current.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len < 3 && Math.abs(repair.velocity.x) < 0.5 && Math.abs(repair.velocity.y) < 0.5) {
      clearInterval(physicsTimer); physicsTimer = null;
      $('btn-repair-release').textContent = '🚀 释放（自动滚）';
      $('lbl-repair').textContent = '✓ 已到达目标！';
      drawRepair();
      return;
    }
    if (repair.current.history.length > 200) { clearInterval(physicsTimer); physicsTimer = null; $('btn-repair-release').textContent = '🚀 释放（自动滚）'; return; }
    // 实时读取摩擦和步长
    const fVal = $('rng-physics-friction') ? +$('rng-physics-friction').value / 100 : 0.3;
    const sVal = $('rng-physics-step') ? +$('rng-physics-step').value / 100 : 0.2;
    repair.current.history.push({ x: repair.current.x, y: repair.current.y });
    if (repair.current.history.length > 80) repair.current.history.shift();
    // 弹簧-阻尼：速度 = (拉力) * 步长；速度 *= (1 - 摩擦*0.5)
    repair.velocity.x += dx * sVal * 0.3;
    repair.velocity.y += dy * sVal * 0.3;
    repair.velocity.x *= (1 - fVal * 0.5);
    repair.velocity.y *= (1 - fVal * 0.5);
    repair.current.x += repair.velocity.x;
    repair.current.y += repair.velocity.y;
    drawRepair();
  }, 50);
});
// 摩擦滑块：实时更新 label + 即使没在跑也显示一个"演示小球"提示
if ($('rng-physics-friction')) $('rng-physics-friction').addEventListener('input', (e) => {
  $('lbl-friction').textContent = (e.target.value/100).toFixed(2);
  if (physicsTimer) return; // 模拟中由 setInterval 实时读取
  // 不在模拟中时，拖动滑块也即时显示一个"小球演示"：
  // 展示摩擦对轨迹形态的影响 (高摩擦→快速收敛；低摩擦→振荡)
  const f = +e.target.value / 100;
  const s = $('rng-physics-step') ? +$('rng-physics-step').value / 100 : 0.2;
  // 在画布左上角显示一个 mini 模拟：模拟 20 步后的位置
  let vx = 0, vy = 0, px = 50, py = 50;
  const tx = 100, ty = 50;
  for (let i = 0; i < 20; i++) {
    const ddx = tx - px, ddy = ty - py;
    vx += ddx * s * 0.3;
    vy += ddy * s * 0.3;
    vx *= (1 - f * 0.5);
    vy *= (1 - f * 0.5);
    px += vx; py += vy;
  }
  // 临时在主画布左上角画一个 mini 演示
  const fEffect = Math.abs(px - 100);
  $('lbl-repair').textContent = '摩擦 ' + f.toFixed(2) + ' · 步长 ' + s.toFixed(2) + ' · 20 步后偏离目标 ≈ ' + fEffect.toFixed(0) + 'px';
  $('lbl-repair').style.color = fEffect < 20 ? 'var(--olive)' : (fEffect < 60 ? 'var(--accent)' : 'var(--bad)');
});
if ($('rng-physics-step')) $('rng-physics-step').addEventListener('input', (e) => {
  $('lbl-step').textContent = (e.target.value/100).toFixed(2);
  if (physicsTimer) {
    // 步长变化时立即跳一步让用户看到效果
    const s = +e.target.value / 100;
    if (!repair.velocity) repair.velocity = { x: 0, y: 0 };
    const dx = repair.target.x - repair.current.x;
    const dy = repair.target.y - repair.current.y;
    repair.velocity.x += dx * s * 0.3;
    repair.velocity.y += dy * s * 0.3;
    repair.current.x += repair.velocity.x;
    repair.current.y += repair.velocity.y;
    drawRepair();
  } else {
    // 不在模拟中：触发摩擦滑块相同的演示
    const fEl = $('rng-physics-friction');
    if (fEl) fEl.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
drawRepair();

/* ---------- §4.2 流场回家演示 — cv-flow-unified ---------- */
(function() {
  const cvF = $('cv-flow-unified');
  if (!cvF) return;
  const ctxF = cvF.getContext('2d');

  // 状态
  const flowState = {
    ball: { x: 400, y: 170 },
    target: { x: 700, y: 100 },
    dragging: false,
    auto: false,
    autoTimer: null,
    strength: 0.7
  };

  // 流场箭头数据
  const flowArrows = [];
  for (let x = 60; x < 760; x += 50) {
    for (let y = 40; y < 300; y += 40) {
      const dx = flowState.target.x - x;
      const dy = flowState.target.y - y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const ux = dx / len, uy = dy / len;
      flowArrows.push({ x, y, ux, uy, len });
    }
  }

  function drawFlow() {
    const W = cvF.width, H = cvF.height;
    ctxF.fillStyle = '#fafbfc'; ctxF.fillRect(0, 0, W, H);

    // 流场箭头
    ctxF.strokeStyle = '#c8c4b4'; ctxF.lineWidth = 1.5;
    flowArrows.forEach(a => {
      const arrowLen = 18 * flowState.strength;
      const tipX = a.x + a.ux * arrowLen;
      const tipY = a.y + a.uy * arrowLen;
      ctxF.beginPath(); ctxF.moveTo(a.x, a.y); ctxF.lineTo(tipX, tipY); ctxF.stroke();
      // 小箭头头
      ctxF.beginPath();
      ctxF.moveTo(tipX, tipY);
      ctxF.lineTo(tipX - a.ux*5 + a.uy*3, tipY - a.uy*5 - a.ux*3);
      ctxF.lineTo(tipX - a.ux*5 - a.uy*3, tipY - a.uy*5 + a.ux*3);
      ctxF.closePath(); ctxF.fillStyle = '#c8c4b4'; ctxF.fill();
    });

    // 目标 x₀
    ctxF.fillStyle = '#1a1a1a';
    ctxF.beginPath(); ctxF.arc(flowState.target.x, flowState.target.y, 14, 0, Math.PI*2); ctxF.fill();
    ctxF.fillStyle = '#fff'; ctxF.font = 'bold 12px Consolas'; ctxF.textAlign = 'center';
    ctxF.fillText('x₀', flowState.target.x, flowState.target.y + 4);
    ctxF.fillStyle = '#1a1a1a'; ctxF.font = '11px "Microsoft YaHei"';
    ctxF.fillText('家', flowState.target.x, flowState.target.y - 22);

    // 蓝 ball (z_t)
    ctxF.fillStyle = '#2563eb';
    ctxF.beginPath(); ctxF.arc(flowState.ball.x, flowState.ball.y, 12, 0, Math.PI*2); ctxF.fill();
    ctxF.strokeStyle = '#1e40af'; ctxF.lineWidth = 2; ctxF.stroke();
    ctxF.fillStyle = '#fff'; ctxF.font = 'bold 10px Consolas';
    ctxF.fillText('z_t', flowState.ball.x, flowState.ball.y + 3);

    // v̂ 箭头：从 ball 指向 target
    const dx = flowState.target.x - flowState.ball.x;
    const dy = flowState.target.y - flowState.ball.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx / len, uy = dy / len;
    const arrowLen = Math.min(60, len * 0.5) * flowState.strength;
    const tipX = flowState.ball.x + ux * arrowLen;
    const tipY = flowState.ball.y + uy * arrowLen;

    ctxF.strokeStyle = '#a8553a'; ctxF.lineWidth = 3;
    ctxF.beginPath(); ctxF.moveTo(flowState.ball.x, flowState.ball.y); ctxF.lineTo(tipX, tipY); ctxF.stroke();
    ctxF.fillStyle = '#a8553a';
    ctxF.beginPath();
    ctxF.moveTo(tipX, tipY);
    ctxF.lineTo(tipX - ux*10 + uy*5, tipY - uy*10 - ux*5);
    ctxF.lineTo(tipX - ux*10 - uy*5, tipY - uy*10 + ux*5);
    ctxF.closePath(); ctxF.fill();

    ctxF.fillStyle = '#a8553a'; ctxF.font = 'bold 12px "Microsoft YaHei"'; ctxF.textAlign = 'left';
    ctxF.fillText('v̂ = 回家方向', tipX + 8, tipY + 4);

    // 误差显示
    const err = Math.sqrt(dx*dx + dy*dy);
    $('lbl-flow-err2').textContent = '误差: ' + err.toFixed(0) + ' px';
    $('lbl-flow-err2').style.color = err < 30 ? 'var(--olive)' : (err < 100 ? 'var(--accent)' : 'var(--bad)');
  }

  // 拖拽
  cvF.addEventListener('mousedown', (e) => {
    if (flowState.autoTimer) { clearInterval(flowState.autoTimer); flowState.autoTimer = null; $('btn-flow-go').textContent = '▶ 自动回家'; }
    const { x, y } = getMouseCv(cvF, e);
    const dx = x - flowState.ball.x, dy = y - flowState.ball.y;
    if (dx*dx + dy*dy < 169) flowState.dragging = true;
  });
  cvF.addEventListener('mousemove', (e) => {
    if (!flowState.dragging) return;
    const { x, y } = getMouseCv(cvF, e);
    flowState.ball.x = Math.max(20, Math.min(cvF.width - 20, x));
    flowState.ball.y = Math.max(20, Math.min(cvF.height - 20, y));
    drawFlow();
  });
  cvF.addEventListener('mouseup', () => flowState.dragging = false);
  cvF.addEventListener('mouseleave', () => flowState.dragging = false);

  // 自动回家
  $('btn-flow-go').addEventListener('click', () => {
    if (flowState.autoTimer) { clearInterval(flowState.autoTimer); flowState.autoTimer = null; $('btn-flow-go').textContent = '▶ 自动回家'; return; }
    $('btn-flow-go').textContent = '⏸ 暂停';
    flowState.autoTimer = setInterval(() => {
      const dx = flowState.target.x - flowState.ball.x;
      const dy = flowState.target.y - flowState.ball.y;
      const err = Math.sqrt(dx*dx + dy*dy);
      if (err < 15) { clearInterval(flowState.autoTimer); flowState.autoTimer = null; $('btn-flow-go').textContent = '▶ 自动回家'; return; }
      flowState.ball.x += dx * 0.08 * flowState.strength;
      flowState.ball.y += dy * 0.08 * flowState.strength;
      drawFlow();
    }, 30);
  });

  // 重置
  $('btn-flow-reset2').addEventListener('click', () => {
    if (flowState.autoTimer) { clearInterval(flowState.autoTimer); flowState.autoTimer = null; $('btn-flow-go').textContent = '▶ 自动回家'; }
    flowState.ball = { x: 400, y: 170 };
    drawFlow();
  });

  // 流场强度
  $('rng-flow2').addEventListener('input', (e) => {
    flowState.strength = +e.target.value / 100;
    $('lbl-flow2').textContent = flowState.strength.toFixed(2);
    drawFlow();
  });

  drawFlow();
})();

/* ---------- §4.2 训练前后对比（增强版） ---------- */
(function() {
  const cvBefore = $('cv-align-before');
  const cvAfter = $('cv-align-after');
  const cvLoss = $('cv-align-loss');
  if (!cvBefore || !cvAfter || !cvLoss) return;

  const ctxB = cvBefore.getContext('2d');
  const ctxA = cvAfter.getContext('2d');
  const ctxL = cvLoss.getContext('2d');

  // 训练数据：100 步的 (v_hat, v_true) 演化
  const training = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const angleDiff = 1.2 * Math.exp(-3 * t) + 0.05;
    const vTrueAngle = 0.3;
    const vHatAngle = vTrueAngle + (i === 0 ? 1.2 : (i === 100 ? 0.05 : angleDiff));
    training.push({ i, vTrueAngle, vHatAngle, angleDiff });
  }

  let currentStep = 0;
  let isPlaying = false;
  let playTimer = null;

  function drawHead(ctx, tipX, tipY, angle) {
    const headLen = 9;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI/6), tipY - headLen * Math.sin(angle - Math.PI/6));
    ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI/6), tipY - headLen * Math.sin(angle + Math.PI/6));
    ctx.closePath(); ctx.fill();
  }

  function drawAlignPanel(ctx, cv, step, label) {
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#fafbfc'; ctx.fillRect(0, 0, W, H);

    // 网格
    ctx.strokeStyle = '#e5e8ef'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(i * W/6, 0); ctx.lineTo(i * W/6, H); ctx.stroke();
    }
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * H/5); ctx.lineTo(W, i * H/5); ctx.stroke();
    }

    // 起点 z_t
    const zX = W * 0.22, zY = H * 0.6;
    ctx.fillStyle = '#5b7a8c';
    ctx.beginPath(); ctx.arc(zX, zY, 9, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Consolas'; ctx.textAlign = 'center';
    ctx.fillText('z_t', zX, zY + 3);

    const data = training[step];

    // v 真值 (绿色) - 注意 y 翻转
    const vLen = 80;
    const vTrueTipX = zX + Math.cos(data.vTrueAngle) * vLen;
    const vTrueTipY = zY - Math.sin(data.vTrueAngle) * vLen;
    ctx.strokeStyle = '#4a5d3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(zX, zY); ctx.lineTo(vTrueTipX, vTrueTipY); ctx.stroke();
    ctx.fillStyle = '#4a5d3a';
    drawHead(ctx, vTrueTipX, vTrueTipY, -data.vTrueAngle);
    ctx.fillStyle = '#4a5d3a'; ctx.font = 'bold 11px "Microsoft YaHei"'; ctx.textAlign = 'left';
    ctx.fillText('v', vTrueTipX + 6, vTrueTipY + 4);

    // v̂ 预测 (橙色)
    const vHatTipX = zX + Math.cos(data.vHatAngle) * vLen;
    const vHatTipY = zY - Math.sin(data.vHatAngle) * vLen;
    ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(zX, zY); ctx.lineTo(vHatTipX, vHatTipY); ctx.stroke();
    ctx.fillStyle = '#a8553a';
    drawHead(ctx, vHatTipX, vHatTipY, -data.vHatAngle);
    ctx.fillStyle = '#a8553a';
    ctx.fillText('v̂', vHatTipX + 6, vHatTipY + 4);

    // 角度扇形
    const sweepAng = data.vHatAngle - data.vTrueAngle;
    const arcR = 32;
    ctx.strokeStyle = 'rgba(74,85,170,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(zX, zY, arcR, -data.vTrueAngle, -data.vHatAngle, sweepAng > 0);
    ctx.stroke();

    // 损失数值
    const mse = data.angleDiff * data.angleDiff;
    const angleDeg = data.angleDiff * 180 / Math.PI;
    return { mse, angleDeg };
  }

  function drawLoss() {
    const W = cvLoss.width, H = cvLoss.height;
    ctxL.fillStyle = '#fafbfc'; ctxL.fillRect(0, 0, W, H);

    // 网格
    ctxL.strokeStyle = '#e5e8ef'; ctxL.lineWidth = 0.5;
    for (let i = 1; i < 5; i++) {
      ctxL.beginPath(); ctxL.moveTo(0, i * H/5); ctxL.lineTo(W, i * H/5); ctxL.stroke();
    }

    // loss 曲线
    const maxLoss = 1.5;
    ctxL.strokeStyle = '#a8553a'; ctxL.lineWidth = 2.5;
    ctxL.beginPath();
    for (let i = 0; i <= 100; i++) {
      const data = training[i];
      const loss = data.angleDiff * data.angleDiff;
      const x = (i / 100) * W;
      const y = H - (loss / maxLoss) * H;
      i === 0 ? ctxL.moveTo(x, y) : ctxL.lineTo(x, y);
    }
    ctxL.stroke();

    // 当前位置指示
    const curData = training[currentStep];
    const curLoss = curData.angleDiff * curData.angleDiff;
    const curX = (currentStep / 100) * W;
    const curY = H - (curLoss / maxLoss) * H;
    ctxL.fillStyle = '#a8553a';
    ctxL.beginPath(); ctxL.arc(curX, curY, 5, 0, Math.PI*2); ctxL.fill();
    ctxL.strokeStyle = '#fff'; ctxL.lineWidth = 1.5; ctxL.stroke();

    // Y 轴标签
    ctxL.fillStyle = '#64748b'; ctxL.font = '9px Consolas'; ctxL.textAlign = 'left';
    ctxL.fillText(maxLoss.toFixed(1), 2, 10);
    ctxL.fillText('0', 2, H - 2);

    // X 轴标签
    ctxL.textAlign = 'center';
    ctxL.fillText('0', 8, H - 2);
    ctxL.fillText('50', W/2, H - 2);
    ctxL.fillText('100', W - 8, H - 2);

    $('lbl-align-loss') && ($('lbl-align-loss').textContent = '当前 Loss (MSE): ' + curLoss.toFixed(4));
  }

  function redraw() {
    // 训练前 = step 0 (deviation最大)
    const before = drawAlignPanel(ctxB, cvBefore, 0, 'before');
    $('align-stat-before') && ($('align-stat-before').textContent =
      `MSE: ${before.mse.toFixed(4)} | 角度偏差: ${before.angleDeg.toFixed(1)}°`);

    // 训练后 = currentStep
    const after = drawAlignPanel(ctxA, cvAfter, currentStep, 'after');
    $('align-stat-after') && ($('align-stat-after').textContent =
      `MSE: ${after.mse.toFixed(4)} | 角度偏差: ${after.angleDeg.toFixed(1)}°`);

    drawLoss();
    $('lbl-align-step') && ($('lbl-align-step').textContent = '步: ' + currentStep + ' / 100');
  }

  // 控件
  $('btn-align-play') && $('btn-align-play').addEventListener('click', () => {
    if (isPlaying) {
      clearInterval(playTimer);
      isPlaying = false;
      $('btn-align-play').textContent = '▶ 继续训练';
      return;
    }
    if (currentStep >= 100) { currentStep = 0; redraw(); }
    isPlaying = true;
    $('btn-align-play').textContent = '⏸ 暂停训练';
    playTimer = setInterval(() => {
      currentStep += 2;
      if (currentStep >= 100) {
        currentStep = 100;
        clearInterval(playTimer);
        isPlaying = false;
        $('btn-align-play').textContent = '▶ 重新训练';
      }
      redraw();
    }, 80);
  });

  $('btn-align-prev') && $('btn-align-prev').addEventListener('click', () => {
    if (isPlaying) { clearInterval(playTimer); isPlaying = false; $('btn-align-play').textContent = '▶ 继续训练'; }
    currentStep = Math.max(0, currentStep - 5);
    redraw();
  });

  $('btn-align-next') && $('btn-align-next').addEventListener('click', () => {
    if (isPlaying) { clearInterval(playTimer); isPlaying = false; $('btn-align-play').textContent = '▶ 继续训练'; }
    currentStep = Math.min(100, currentStep + 5);
    redraw();
  });

  $('btn-align-reset') && $('btn-align-reset').addEventListener('click', () => {
    if (isPlaying) { clearInterval(playTimer); isPlaying = false; $('btn-align-play').textContent = '▶ 开始训练'; }
    currentStep = 0;
    redraw();
  });

  redraw();
})();

/* ---------- §7.1 三种训练目标：同一 z_t，网络可猜三样东西 ---------- */
const cvT = $('cv-target');
const ctxT = cvT.getContext('2d');
let targetT = 0.5;

// 局部箭头绘制（避免与全局 drawArrow 冲突）
function drawTargetArrow(x1, y1, x2, y2, color, width, dash) {
  ctxT.strokeStyle = color; ctxT.lineWidth = width;
  ctxT.setLineDash(dash || []);
  ctxT.beginPath(); ctxT.moveTo(x1, y1); ctxT.lineTo(x2, y2); ctxT.stroke();
  ctxT.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 11;
  ctxT.fillStyle = color;
  ctxT.beginPath();
  ctxT.moveTo(x2, y2);
  ctxT.lineTo(x2 - ah * Math.cos(ang - 0.42), y2 - ah * Math.sin(ang - 0.42));
  ctxT.lineTo(x2 - ah * Math.cos(ang + 0.42), y2 - ah * Math.sin(ang + 0.42));
  ctxT.closePath();
  ctxT.fill();
}

function drawTarget() {
  const W = cvT.width, H = cvT.height;
  ctxT.fillStyle = '#ffffff'; ctxT.fillRect(0, 0, W, H);
  const cy = H / 2 + 18;
  const x0 = { x: 120, y: cy };
  const eps = { x: W - 120, y: cy };
  const zt = { x: x0.x + (eps.x - x0.x) * targetT, y: cy };
  const span = eps.x - x0.x;

  // 左上：单句说明
  ctxT.fillStyle = '#2d2a26';
  ctxT.font = 'bold 13.5px "Microsoft YaHei", sans-serif';
  ctxT.textAlign = 'left';
  ctxT.fillText('同一时刻 z_t，网络可以猜三样东西', 16, 26);
  // 右上：ELF 选择
  ctxT.fillStyle = '#a8553a';
  ctxT.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
  ctxT.textAlign = 'right';
  ctxT.fillText('★ ELF 选 x₀', W - 16, 26);

  // 主轴虚线 x0 → ε
  ctxT.strokeStyle = '#d8d3c2'; ctxT.lineWidth = 1.5;
  ctxT.setLineDash([6, 5]);
  ctxT.beginPath(); ctxT.moveTo(x0.x, cy); ctxT.lineTo(eps.x, cy); ctxT.stroke();
  ctxT.setLineDash([]);

  // t 刻度 tick
  ctxT.strokeStyle = '#c8c0a8'; ctxT.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const tx = x0.x + i * span / 5;
    ctxT.beginPath(); ctxT.moveTo(tx, cy - 4); ctxT.lineTo(tx, cy + 4); ctxT.stroke();
  }
  // 端点语义标签（翻译模型语境）
  ctxT.fillStyle = '#1a1a1a';
  ctxT.font = 'bold 11.5px "Microsoft YaHei", sans-serif';
  ctxT.textAlign = 'center';
  ctxT.fillText('清晰译文', x0.x, cy + 24);
  ctxT.fillStyle = '#a8553a';
  ctxT.fillText('纯噪声', eps.x, cy + 24);

  // 三种目标箭头（同时显示）
  // 1) x₀ 目标：黑色实线，z_t → x₀（向左）
  drawTargetArrow(zt.x, zt.y, x0.x, x0.y, '#1a1a1a', 3);
  // 2) ε 目标：橙色虚线，z_t → ε（向右）
  drawTargetArrow(zt.x, zt.y, eps.x, eps.y, '#a8553a', 2.5, [6, 4]);
  // 3) v 目标：绿色粗箭头，沿 v = ε - x₀ 方向（向右），固定长度
  const vLen = 90;
  drawTargetArrow(zt.x, zt.y, zt.x + vLen, zt.y, '#4a7a3a', 4);

  // 三种目标的中部标签 + loss
  const lossX0 = (Math.abs(zt.x - x0.x) / span) * 4.5;
  const lossEps = (Math.abs(eps.x - zt.x) / span) * 4.5;
  const lossV = 1.1;

  // x₀ 标签（在 z_t 与 x0 之间上方）
  const midX0 = (zt.x + x0.x) / 2;
  ctxT.fillStyle = '#1a1a1a';
  ctxT.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
  ctxT.textAlign = 'center';
  ctxT.fillText('x₀  猜译文', midX0, cy - 28);
  ctxT.fillStyle = '#5a5a5a';
  ctxT.font = '11px "Microsoft YaHei", sans-serif';
  ctxT.fillText('loss ' + lossX0.toFixed(2), midX0, cy - 12);

  // ε 标签（在 z_t 与 eps 之间上方）
  const midEps = (zt.x + eps.x) / 2;
  ctxT.fillStyle = '#a8553a';
  ctxT.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
  ctxT.fillText('ε  猜噪声', midEps, cy - 28);
  ctxT.fillStyle = '#7a5a4a';
  ctxT.font = '11px "Microsoft YaHei", sans-serif';
  ctxT.fillText('loss ' + lossEps.toFixed(2), midEps, cy - 12);

  // v 标签（在 v 箭头下方）
  ctxT.fillStyle = '#4a7a3a';
  ctxT.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
  ctxT.fillText('v  猜方向', zt.x + vLen / 2, cy + 22);
  ctxT.fillStyle = '#5a6a4a';
  ctxT.font = '11px "Microsoft YaHei", sans-serif';
  ctxT.fillText('loss ' + lossV.toFixed(2), zt.x + vLen / 2, cy + 38);

  // 端点 x₀（深色圆）
  ctxT.fillStyle = '#1a1a1a';
  ctxT.beginPath(); ctxT.arc(x0.x, x0.y, 11, 0, Math.PI*2); ctxT.fill();
  ctxT.fillStyle = '#fff'; ctxT.font = 'bold 12px Consolas, monospace';
  ctxT.textAlign = 'center';
  ctxT.fillText('x₀', x0.x, x0.y + 4);

  // 端点 ε（橙色圆）
  ctxT.fillStyle = '#a8553a';
  ctxT.beginPath(); ctxT.arc(eps.x, eps.y, 11, 0, Math.PI*2); ctxT.fill();
  ctxT.fillStyle = '#fff'; ctxT.font = 'bold 12px Consolas, monospace';
  ctxT.fillText('ε', eps.x, eps.y + 4);

  // z_t 当前点（蓝色，最上层）
  ctxT.fillStyle = '#5b7a8c';
  ctxT.beginPath(); ctxT.arc(zt.x, zt.y, 11, 0, Math.PI*2); ctxT.fill();
  ctxT.fillStyle = '#fff'; ctxT.font = 'bold 11px Consolas, monospace';
  ctxT.fillText('z', zt.x, zt.y + 4);
  ctxT.fillStyle = '#5b7a8c'; ctxT.font = '11px "Microsoft YaHei", sans-serif';
  ctxT.fillText('t=' + targetT.toFixed(2), zt.x, zt.y - 18);

  // 同步右下角 loss 摘要
  $('lbl-target-loss').textContent = 'x₀=' + lossX0.toFixed(2) + '  ε=' + lossEps.toFixed(2) + '  v=' + lossV.toFixed(2);
}

$('rng-target-t').addEventListener('input', (e) => {
  targetT = +e.target.value / 100;
  $('lbl-target-t').textContent = targetT.toFixed(2);
  drawTarget();
});
drawTarget();

/* ---------- §7.2 猜终点→知方向 ---------- */
window.drawFx_cv_guess_dir = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let gT = 0.5, gErr = 0.2;

  function drawArrow(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ah = 11;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ah * Math.cos(ang - 0.42), y2 - ah * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - ah * Math.cos(ang + 0.42), y2 - ah * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const sx = 100, sy = H - 40;   // ε 起点（左下）
    const ex = W - 100, ey = 40;   // x₀ 终点（右上）
    // z_t 当前位置
    const zx = sx + (ex - sx) * gT, zy = sy + (ey - sy) * gT;
    // x̂₀ 网络猜测（在 x₀ 附近有偏差，方向随机但固定）
    const errOff = gErr * 70;
    const gx = ex + errOff * 0.6, gy = ey + errOff * 0.5;

    // 左上：承接 §7.1 的说明
    ctx.fillStyle = '#2d2a26';
    ctx.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('猜到终点 x̂₀  →  方向 v̂ 自动算出', 16, 22);

    // 轨迹虚线 ε → x₀
    ctx.strokeStyle = '#d8d3c2'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);

    // ε 起点
    ctx.fillStyle = '#a8553a';
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText('ε', sx, sy + 4);
    ctx.fillStyle = '#a8553a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('噪声', sx, sy + 26);

    // x₀ 真实终点
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(ex, ey, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas, monospace';
    ctx.fillText('x₀', ex, ey + 4);
    ctx.fillStyle = '#1a1a1a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('真实译文', ex, ey - 18);

    // x̂₀ 网络猜测（空心圆，黑色描边以呼应 §7.1 的 x₀ 配色）
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy, 9, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('x̂₀', gx, gy - 14);
    ctx.fillStyle = '#5a5a5a'; ctx.font = '10.5px "Microsoft YaHei", sans-serif';
    ctx.fillText('猜的终点', gx, gy + 22);

    // z_t 当前位置
    ctx.fillStyle = '#5b7a8c';
    ctx.beginPath(); ctx.arc(zx, zy, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Consolas, monospace';
    ctx.fillText('z_t', zx, zy + 4);
    ctx.fillStyle = '#5b7a8c'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('t=' + gT.toFixed(2), zx, zy - 18);

    // v̂ 方向箭头：从 z_t 指向 x̂₀（这是关键，加粗加长）
    const dx = gx - zx, dy = gy - zy;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx / len, uy = dy / len;
    const aL = Math.min(len * 0.75, 95);
    const ax = zx + ux * aL, ay = zy + uy * aL;
    drawArrow(zx, zy, ax, ay, '#4a7a3a', 4);

    // v̂ 标签（简洁）
    ctx.fillStyle = '#4a7a3a'; ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('v̂  走路方向', ax + 8, ay + (uy < 0 ? -8 : 16));
  }

  // 绑定控件
  const rngT = $('rng-guess-t'), rngE = $('rng-guess-err');
  const lblT = $('lbl-guess-t'), lblE = $('lbl-guess-err');
  if (rngT) rngT.addEventListener('input', () => {
    gT = +rngT.value / 100; lblT.textContent = gT.toFixed(2); draw();
  });
  if (rngE) rngE.addEventListener('input', () => {
    gErr = +rngE.value / 100;
    lblE.textContent = gErr < 0.3 ? '准' : gErr < 0.6 ? '偏一点' : '偏很多';
    draw();
  });
  draw();
};

/* ---------- §7 CFG ---------- */
const cvCfg = $('cv-cfg');
const ctxCfg = cvCfg.getContext('2d');
let cfgOmega = 2.5;

function calcMetrics(w) {
  return {
    quality: 1 - Math.exp(-0.5 * (w - 1)),
    diversity: 1 / (1 + 0.3 * (w - 1)),
    cost: 1 + 0.15 * w
  };
}

// 翻译散点数据：三档ω对应的译文分布
const cfgScatter = [
  { lo:{t:'love I Chinese landscape',dx:.72,dy:-.52}, mid:{t:'I adore Chinese landscape',dx:.32,dy:-.22}, hi:{t:'I love Chinese landscape',dx:.07,dy:.04} },
  { lo:{t:'Chinese love I landscape',dx:-.62,dy:.42}, mid:{t:'I like Chinese landscape',dx:-.28,dy:.32}, hi:{t:'I love Chinese landscape',dx:-.06,dy:.05} },
  { lo:{t:'landscape I Chinese love',dx:.52,dy:.62}, mid:{t:'I cherish landscape',dx:.22,dy:.38}, hi:{t:'I love Chinese landscape',dx:.04,dy:-.06} },
  { lo:{t:'I landscape love Chinese',dx:-.72,dy:-.32}, mid:{t:'I fancy Chinese views',dx:-.38,dy:-.14}, hi:{t:'I love Chinese landscape',dx:-.03,dy:-.03} },
  { lo:{t:'love Chinese I landscape',dx:.42,dy:-.72}, mid:{t:'I miss scenery',dx:.14,dy:-.42}, hi:{t:'I love Chinese landscape',dx:.05,dy:.06} },
  { lo:{t:'landscape love I Chinese',dx:-.48,dy:.58}, mid:{t:'I love the scenery',dx:-.16,dy:.28}, hi:{t:'I love Chinese landscape',dx:-.04,dy:-.05} },
];

function drawCfg() {
  ctxCfg.fillStyle = '#fafaf8'; ctxCfg.fillRect(0, 0, cvCfg.width, cvCfg.height);
  const cx = 160, cy = cvCfg.height / 2;
  const spread = 130 / Math.max(0.5, cfgOmega);

  // 选中当前档位
  let level = cfgOmega < 1.8 ? 'lo' : (cfgOmega > 3.5 ? 'hi' : 'mid');
  let blend = 0;
  if (cfgOmega >= 1.8 && cfgOmega <= 2.5) { level = 'mid'; blend = (cfgOmega - 1.8) / 0.7; }
  else if (cfgOmega > 2.5 && cfgOmega <= 3.5) { level = 'mid'; blend = (cfgOmega - 2.5) / 1.0; }
  else if (cfgOmega > 3.5) { level = 'hi'; blend = Math.min(1, (cfgOmega - 3.5) / 1.5); }

  // 散布圈
  ctxCfg.strokeStyle = '#e0d8c8'; ctxCfg.lineWidth = 1; ctxCfg.setLineDash([3,3]);
  ctxCfg.beginPath(); ctxCfg.arc(cx, cy, spread * 0.9, 0, Math.PI*2); ctxCfg.stroke();
  ctxCfg.setLineDash([]);

  // 画散点（带译文标签）
  const dotColor = level === 'lo' ? '#c97a5a' : (level === 'hi' ? '#7a9ab0' : '#6b8a52');
  for (const d of cfgScatter) {
    let px, py, label;
    if (level === 'lo') { px = d.lo.dx; py = d.lo.dy; label = d.lo.t; }
    else if (level === 'hi') { px = d.hi.dx; py = d.hi.dy; label = d.hi.t; }
    else {
      const t = blend < 0.5 ? 0 : (blend - 0.5) * 2;
      px = lerp(d.mid.dx, d.hi.dx, t); py = lerp(d.mid.dy, d.hi.dy, t);
      label = t > 0.5 ? d.hi.t : d.mid.t;
    }
    const x = cx + px * spread;
    const y = cy + py * spread * 0.75;
    ctxCfg.globalAlpha = 0.85;
    ctxCfg.fillStyle = dotColor;
    ctxCfg.beginPath(); ctxCfg.arc(x, y, 4, 0, Math.PI*2); ctxCfg.fill();
    ctxCfg.globalAlpha = 1;
    ctxCfg.fillStyle = '#555'; ctxCfg.font = '10px "Microsoft YaHei"';
    ctxCfg.fillText(label, x + 6, y + 3);
  }

  // 中心：正确译文
  ctxCfg.fillStyle = '#4a5d3a';
  ctxCfg.beginPath(); ctxCfg.arc(cx, cy, 9, 0, Math.PI*2); ctxCfg.fill();
  ctxCfg.fillStyle = '#fff'; ctxCfg.font = 'bold 10px Consolas'; ctxCfg.textAlign = 'center';
  ctxCfg.fillText('✓', cx, cy + 3);
  ctxCfg.fillStyle = '#1a1a1a'; ctxCfg.font = 'bold 11px "Microsoft YaHei"';
  ctxCfg.fillText('"I love Chinese landscape"', cx, cy - 18);
  ctxCfg.fillStyle = '#999'; ctxCfg.font = '9px "Microsoft YaHei"';
  ctxCfg.fillText('正确译文', cx, cy + 24);
  ctxCfg.textAlign = 'left';

  // 左上角标注（去掉"生成的多种译文"）
  const stateLabel = level === 'lo' ? '乱序·语序错' : (level === 'hi' ? '重复·太死板' : '准确·有变化');
  const stateColor = level === 'lo' ? '#c97a5a' : (level === 'hi' ? '#7a9ab0' : '#4a5d3a');
  ctxCfg.fillStyle = stateColor; ctxCfg.font = 'bold 11px "Microsoft YaHei"';
  ctxCfg.fillText('ω=' + cfgOmega.toFixed(1) + ' ' + stateLabel, 12, 18);

  // === 右侧：曲线图 ===
  const ox = 380, oy = 30, ow = 400, oh = cvCfg.height - 50;
  ctxCfg.strokeStyle = '#d8d3c2'; ctxCfg.lineWidth = 1; ctxCfg.strokeRect(ox, oy, ow, oh);
  function plot(fn, color) {
    ctxCfg.strokeStyle = color; ctxCfg.lineWidth = 2;
    ctxCfg.beginPath();
    for (let i = 0; i <= 60; i++) {
      const w = 1 + i * 6 / 60;
      const v = fn(w);
      const px = ox + (w - 1) / 6 * ow;
      const py = oy + (1 - v) * oh;
      i === 0 ? ctxCfg.moveTo(px, py) : ctxCfg.lineTo(px, py);
    }
    ctxCfg.stroke();
    if (cfgOmega >= 1 && cfgOmega <= 7) {
      const v = fn(cfgOmega);
      const px = ox + (cfgOmega - 1) / 6 * ow;
      const py = oy + (1 - v) * oh;
      ctxCfg.fillStyle = color;
      ctxCfg.beginPath(); ctxCfg.arc(px, py, 5, 0, Math.PI*2); ctxCfg.fill();
    }
  }
  plot(w => 1 - Math.exp(-0.5 * (w - 1)), '#4a5d3a');
  plot(w => 1 / (1 + 0.3 * (w - 1)), '#5b7a8c');
  plot(w => Math.min(1, 0.18 * w), '#a8553a');
  ctxCfg.fillStyle = '#4a4a4a'; ctxCfg.font = '10px Georgia';
  for (let i = 0; i <= 6; i++) {
    const w = 1 + i;
    const px = ox + i / 6 * ow;
    ctxCfg.fillText('ω=' + w, px - 12, oy + oh + 14);
  }
  if (cfgOmega >= 1 && cfgOmega <= 7) {
    const px = ox + (cfgOmega - 1) / 6 * ow;
    ctxCfg.strokeStyle = '#1a1a1a'; ctxCfg.lineWidth = 1;
    ctxCfg.setLineDash([2, 2]);
    ctxCfg.beginPath(); ctxCfg.moveTo(px, oy); ctxCfg.lineTo(px, oy + oh); ctxCfg.stroke();
    ctxCfg.setLineDash([]);
  }
  // 图例移到右下角（ox+ow 减去 8px 内边距）
  const legX = ox + ow - 8, legY = oy + oh - 8;
  ctxCfg.textAlign = 'right';
  ctxCfg.fillStyle = '#4a5d3a'; ctxCfg.font = 'bold 11px "Microsoft YaHei"';
  ctxCfg.fillText('— 贴题', legX, legY - 28);
  ctxCfg.fillStyle = '#5b7a8c'; ctxCfg.fillText('— 多样', legX, legY - 14);
  ctxCfg.fillStyle = '#a8553a'; ctxCfg.fillText('— 算力', legX, legY);
  ctxCfg.textAlign = 'left';

  const m = calcMetrics(cfgOmega);
  $('cfg-quality').textContent = m.quality.toFixed(2);
  $('cfg-div').textContent = m.diversity.toFixed(2);
  $('cfg-cost').textContent = m.cost.toFixed(2) + 'x';
  $('cfg-q-bar').style.width = (m.quality * 100) + '%';
  $('cfg-d-bar').style.width = (m.diversity * 100) + '%';
  $('cfg-c-bar').style.width = (Math.min(1, m.cost / 2) * 100) + '%';

  // 更新输出条
  const outEl = $('cfg-io-out');
  if (outEl) {
    if (level === 'lo') { outEl.textContent = '"love I Chinese landscape"'; outEl.style.color = '#c97a5a'; }
    else if (level === 'hi') { outEl.textContent = '"I love Chinese landscape" (每次都一样)'; outEl.style.color = '#7a9ab0'; }
    else { outEl.textContent = '"I love Chinese landscape"'; outEl.style.color = '#4a5d3a'; }
  }
}

$('rng-omega').addEventListener('input', (e) => { cfgOmega = +e.target.value / 10; $('lbl-omega').textContent = cfgOmega.toFixed(1); drawCfg(); });
$('btn-omega-1').addEventListener('click', () => { $('rng-omega').value = 10; cfgOmega = 1; $('lbl-omega').textContent = '1.0'; drawCfg(); });
$('btn-omega-sweet').addEventListener('click', () => { $('rng-omega').value = 25; cfgOmega = 2.5; $('lbl-omega').textContent = '2.5'; drawCfg(); });
$('btn-omega-5').addEventListener('click', () => { $('rng-omega').value = 50; cfgOmega = 5; $('lbl-omega').textContent = '5.0'; drawCfg(); });
drawCfg();

/* ========================================================================
   精细化交互新增模块（递进点击 / 3D / 向量 / 柱状图 / 结论卡）
   ======================================================================== */

/* ---------- §2.2 真实嵌入空间：1024 维的 3D 投影（增强版） ---------- */
(function setup3DEmbed() {
  const cv3d = document.getElementById('cv-embed3d');
  if (!cv3d) { console.warn('cv-embed3d not found'); return; }
  const ctx3d = cv3d.getContext('2d');
  if (!ctx3d) { console.warn('cv-embed3d 2d ctx failed'); return; }

  window.cv3d = cv3d;
  window.ctx3d = ctx3d;
  window.embed3dState = {
    rotX: 0.4, rotY: 0.6, scale: 1.0,
    drag: false, lx: 0, ly: 0, dragMoved: false,
    filterCat: -1,
    showNearest: false,
    selected: -1,
    auto: false, autoTimer: null,
    mouseDownTs: 0
  };

  const catNames3d = ['动物类', '天气类', '行为类'];
  const catColor   = { 0: '#9bc46f', 1: '#e08560', 2: '#7aa4be' };
  const wordSamples = [
    ['cat','dog','bird','fish','horse','cow','pig','sheep','mouse','tiger','lion','rabbit'],
    ['sun','rain','snow','cloud','wind','storm','fog','thunder','rainbow','sky','humid','frost'],
    ['run','jump','walk','swim','dance','sing','eat','sleep','work','play','climb','rest']
  ];

  let _seed = 12345;
  function srand() {
    // Mulberry32
    _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
    let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function fillPoints() {
    const arr = [];
    for (let cat = 0; cat < 3; cat++) {
      const cx = (cat - 1) * 0.7;
      for (let i = 0; i < 12; i++) {
        arr.push({
          x: cx + (srand() - 0.5) * 0.18,
          y: (srand() - 0.5) * 0.5,
          z: (srand() - 0.5) * 0.5,
          cat: cat,
          word: wordSamples[cat][i]
        });
      }
    }
    return arr;
  }
  const points3d = fillPoints();
  window.points3d = points3d;
  window.catNames3d = catNames3d;

  function project3d(p, cx, cy) {
    const s = window.embed3dState;
    let x1 = p.x * Math.cos(s.rotY) - p.z * Math.sin(s.rotY);
    let z1 = p.x * Math.sin(s.rotY) + p.z * Math.cos(s.rotY);
    let y1 = p.y * Math.cos(s.rotX) - z1 * Math.sin(s.rotX);
    z1 = p.y * Math.sin(s.rotX) + z1 * Math.cos(s.rotX);
    const persp = 4 / (4 + z1);
    return {
      x: cx + x1 * 200 * persp * s.scale,
      y: cy - y1 * 200 * persp * s.scale,
      z: z1, persp: persp
    };
  }
  window.project3d = project3d;

  function drawEmbed3d() {
    try {
      const cv = cv3d;
      const ctx = ctx3d;
      const cx = cv.width / 2, cy = cv.height / 2;
      const s = window.embed3dState;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const p1 = project3d({ x: i * 0.3, y: -0.4, z: -1.2 }, cx, cy);
        const p2 = project3d({ x: i * 0.3, y: -0.4, z:  1.2 }, cx, cy);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        const p3 = project3d({ x: -1.2, y: -0.4, z: i * 0.3 }, cx, cy);
        const p4 = project3d({ x:  1.2, y: -0.4, z: i * 0.3 }, cx, cy);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      const projList = [];
      for (let i = 0; i < points3d.length; i++) {
        const pt = points3d[i];
        const pr = project3d(pt, cx, cy);
        projList.push({ idx: i, pt: pt, pr: pr });
      }
      projList.sort((a, b) => a.pr.z - b.pr.z);

      const nearestWords = new Set();
      if (s.selected >= 0 && s.showNearest && s.selected < points3d.length) {
        const selPt = points3d[s.selected];
        const dists = [];
        for (let i = 0; i < points3d.length; i++) {
          if (i === s.selected) continue;
          const q = points3d[i];
          const dx = q.x - selPt.x, dy = q.y - selPt.y, dz = q.z - selPt.z;
          dists.push({ i: i, w: q.word, d: Math.sqrt(dx*dx + dy*dy + dz*dz) });
        }
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < 3; k++) nearestWords.add(dists[k].w);
      }

      for (let k = 0; k < projList.length; k++) {
        const it = projList[k];
        const pt = it.pt;
        const pr = it.pr;
        const isSel = (it.idx === s.selected);
        const isNN  = nearestWords.has(pt.word);
        const isHL  = isSel || isNN;
        const visible = (s.filterCat === -1) || (pt.cat === s.filterCat) || isHL;
        if (!visible) continue;
        const r = (4 + pr.persp * 4) * (isHL ? 1.5 : 1);
        ctx.globalAlpha = isHL ? 1 : (s.filterCat === -1 ? 0.85 : 0.95);
        ctx.fillStyle = isHL ? '#f0c800' : catColor[pt.cat];
        ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isHL ? '#ffffff' : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = isHL ? 2 : 1;
        ctx.stroke();
        if (isHL && pt.word) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Consolas';
          ctx.fillText(pt.word, pr.x + r + 4, pr.y + 4);
        }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#aaa'; ctx.font = '11px Consolas';
      ctx.fillText('ω: ' + s.rotY.toFixed(2) + ' rad  ·  θ: ' + s.rotX.toFixed(2) + ' rad  ·  zoom: ' + s.scale.toFixed(2), 12, 16);
      const fl = s.filterCat === -1 ? '全部 (36)' : catNames3d[s.filterCat];
      const sl = (s.showNearest && s.selected >= 0 && s.selected < points3d.length)
                 ? '  ·  已选: ' + points3d[s.selected].word : '';
      ctx.fillText('当前筛选: ' + fl + sl, 12, 32);
    } catch (err) {
      console.error('drawEmbed3d error:', err);
    }
  }
  window.drawEmbed3d = drawEmbed3d;

  cv3d.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const s = window.embed3dState;
    s.drag = true; s.dragMoved = false;
    s.lx = e.clientX; s.ly = e.clientY;
    s.mouseDownTs = Date.now();
  });
  cv3d.addEventListener('mousemove', (e) => {
    const s = window.embed3dState;
    if (!s.drag) return;
    const dx = e.clientX - s.lx;
    const dy = e.clientY - s.ly;
    if (Math.abs(dx) + Math.abs(dy) > 3) s.dragMoved = true;
    s.rotY += dx * 0.008;
    s.rotX += dy * 0.008;
    s.lx = e.clientX; s.ly = e.clientY;
    drawEmbed3d();
  });
  window.addEventListener('mouseup', () => {
    window.embed3dState.drag = false;
  });
  cv3d.addEventListener('mouseleave', () => {});
  cv3d.addEventListener('wheel', (e) => {
    e.preventDefault();
    const s = window.embed3dState;
    s.scale *= (e.deltaY < 0 ? 1.1 : 0.9);
    s.scale = Math.max(0.4, Math.min(2.5, s.scale));
    drawEmbed3d();
  }, { passive: false });

  function pickAt(mx, my) {
    let bestI = -1, bestD = 1e9;
    const fc = window.embed3dState.filterCat;
    for (let i = 0; i < points3d.length; i++) {
      const pt = points3d[i];
      if (fc !== -1 && pt.cat !== fc) continue;
      const pr = project3d(pt, cv3d.width / 2, cv3d.height / 2);
      const d = Math.hypot(pr.x - mx, pr.y - my);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    return { i: bestI, d: bestD };
  }

  function handleClickAt(mx, my) {
    const pick = pickAt(mx, my);
    const s = window.embed3dState;
    const lbl = document.getElementById('lbl-3d-pick');
    if (pick.i >= 0 && pick.d < 25) {
      s.selected = pick.i;
      s.showNearest = true;
      const selPt = points3d[pick.i];
      const dists = [];
      for (let j = 0; j < points3d.length; j++) {
        if (j === pick.i) continue;
        const q = points3d[j];
        const dx = q.x - selPt.x, dy = q.y - selPt.y, dz = q.z - selPt.z;
        dists.push({ w: q.word, c: q.cat, d: Math.sqrt(dx*dx + dy*dy + dz*dz) });
      }
      dists.sort((a, b) => a.d - b.d);
      const nn1 = dists[0], nn2 = dists[1];
      const sameCat = dists.find(x => x.c === selPt.cat);
      const diffCat = dists.find(x => x.c !== selPt.cat);
      if (lbl) {
        lbl.innerHTML =
          '<strong>选中: ' + selPt.word + '</strong> (' + catNames3d[selPt.cat] + ')<br>' +
          '<span style="display:inline-block; padding-left:24px;">🔎 <b>最近邻 #1</b>: <b>' + nn1.w + '</b> (' + catNames3d[nn1.c] + ') · 距离 <b>' + nn1.d.toFixed(2) + '</b></span><br>' +
          '<span style="display:inline-block; padding-left:24px;">🔎 <b>最近邻 #2</b>: ' + nn2.w + ' (' + catNames3d[nn2.c] + ') · 距离 ' + nn2.d.toFixed(2) + '</span><br>' +
          '<span style="display:inline-block; padding-left:24px; color:var(--olive);">✓ 同类最近邻 (' + (sameCat ? sameCat.w : '无') + ') 距离 = ' + (sameCat ? sameCat.d.toFixed(2) : '—') + '</span>' +
          '  <span style="color:var(--rust);">✗ 异类最近邻 (' + (diffCat ? diffCat.w : '无') + ') 距离 = ' + (diffCat ? diffCat.d.toFixed(2) : '—') + '</span>';
        lbl.className = 'feedback good';
      }
    } else {
      s.selected = -1; s.showNearest = false;
      if (lbl) {
        lbl.innerHTML = '👆 点任一圆点查看：词义、最近邻、欧氏距离';
        lbl.className = 'feedback';
      }
    }
    drawEmbed3d();
  }

  cv3d.addEventListener('click', (e) => {
    const s = window.embed3dState;
    if (s.dragMoved) { s.dragMoved = false; return; }
    if (s.drag) return;
    const rect = cv3d.getBoundingClientRect();
    const sx = cv3d.width / rect.width, sy = cv3d.height / rect.height;
    const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy;
    handleClickAt(mx, my);
  });
  cv3d.addEventListener('touchend', (e) => {
    if (window.embed3dState.dragMoved) { window.embed3dState.dragMoved = false; return; }
    if (e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const rect = cv3d.getBoundingClientRect();
    const sx = cv3d.width / rect.width, sy = cv3d.height / rect.height;
    const mx = (t.clientX - rect.left) * sx, my = (t.clientY - rect.top) * sy;
    handleClickAt(mx, my);
  });

  drawEmbed3d();
  // 默认自动旋转
  const _s = window.embed3dState;
  if (_s.auto) {
    _s.autoTimer = setInterval(() => { _s.rotY += 0.02; drawEmbed3d(); }, 50);
  }
})();

/* ---------- §5.2 CFG 向量可视化 ---------- */
const cvCfgVec = $('cv-cfg-vec');
const ctxCfgVec = cvCfgVec ? cvCfgVec.getContext('2d') : null;
const vecPairs = [
  { uncond:{x:0.2,y:0.3}, cond:{x:0.85,y:0.7}, zh:'我爱中国山水', uc:'"I ??? Chinese ???"', c:'"I love Chinese landscape"', cfg:'"I love Chinese landscape"' },
  { uncond:{x:0.3,y:0.2}, cond:{x:0.8,y:0.75}, zh:'春眠不觉晓', uc:'"Spring ??? not ???"', c:'"Spring sleep I wake not"', cfg:'"Spring sleep I wake not"' },
  { uncond:{x:0.25,y:0.35}, cond:{x:0.88,y:0.65}, zh:'读书破万卷', uc:'"??? breaks ??? scrolls"', c:'"Reading breaks ten thousand scrolls"', cfg:'"Reading breaks ten thousand scrolls"' },
];
let vecPairIdx = 0;
let vecOmega = 2.5;
function drawCfgVec() {
  if (!ctxCfgVec) return;
  const cv = cvCfgVec;
  const ctx = ctxCfgVec;
  const cx = cv.width / 2, cy = cv.height / 2;
  const scale = 180;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = '#e5e8ef'; ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * scale/3, 20); ctx.lineTo(cx + i * scale/3, cv.height - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, cy + i * scale/3); ctx.lineTo(cv.width - 40, cy + i * scale/3); ctx.stroke();
  }
  ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(cv.width - 40, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, cv.height - 20); ctx.stroke();

  const pair = vecPairs[vecPairIdx];
  const u = pair.uncond, c = pair.cond;
  const cfgX = u.x + vecOmega * (c.x - u.x);
  const cfgY = u.y + vecOmega * (c.y - u.y);

  // 屏幕坐标（注意 y 翻转）
  const ux = u.x * scale, uy = -u.y * scale;
  const cxv = c.x * scale, cyv = -c.y * scale;
  const cfgXv = cfgX * scale, cfgYv = -cfgY * scale;

  // 三条箭头，标签改为翻译语义
  drawArrow(ctx, cx, cy, ux, uy, '#bbb', '不看源文');
  drawArrow(ctx, cx, cy, cxv, cyv, '#5b7a8c', '看源文');
  drawArrow(ctx, cx, cy, cfgXv, cfgYv, '#4a5d3a', 'CFG结果', 4);

  // 橙色虚线：差值 = 看源文 - 不看源文（从 uncond 端点 → cond 端点）
  ctx.save();
  ctx.strokeStyle = '#d97746'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(cx + ux, cy + uy); ctx.lineTo(cx + cxv, cy + cyv); ctx.stroke();
  // 差值箭头头
  const ddx = cxv - ux, ddy = cyv - uy;
  const dlen = Math.sqrt(ddx*ddx + ddy*ddy);
  if (dlen > 5) {
    const dux = ddx/dlen, duy = ddy/dlen;
    ctx.fillStyle = '#d97746';
    ctx.beginPath();
    ctx.moveTo(cx + cxv, cy + cyv);
    ctx.lineTo(cx + cxv - dux*10 + duy*5, cy + cyv - duy*10 - dux*5);
    ctx.lineTo(cx + cxv - dux*10 - duy*5, cy + cyv - duy*10 + dux*5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d97746'; ctx.font = 'bold 12px "Microsoft YaHei"';
    ctx.fillText('差值=源文带来的方向', cx + ux + ddx*0.5 + 8, cy + uy + ddy*0.5 - 8);
  }
  ctx.restore();

  // 左上角：当前例句 + ω
  ctx.fillStyle = '#64748b'; ctx.font = '11px "Microsoft YaHei"';
  ctx.fillText('源文: ' + pair.zh, 16, 18);
  const stateLabel = vecOmega < 0.5 ? '不引导' : (vecOmega < 1.5 ? '平凡' : (vecOmega > 4 ? '过强' : '平衡 ⭐'));
  const stateColor = vecOmega < 0.5 ? '#bbb' : (vecOmega < 1.5 ? '#5b7a8c' : (vecOmega > 4 ? '#a8553a' : '#4a5d3a'));
  ctx.fillStyle = stateColor; ctx.font = 'bold 12px "Microsoft YaHei"';
  ctx.fillText('ω=' + vecOmega.toFixed(1) + ' ' + stateLabel, 16, 36);

  // 底部说明：差值的作用
  ctx.fillStyle = '#64748b'; ctx.font = '11px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('CFG = 不看源文 + ω × 差值（放大源文带来的方向，让生成更贴题）', cv.width / 2, cv.height - 12);
  ctx.textAlign = 'left';

  // 更新翻译卡片
  $('vc-uncond').textContent = pair.uc;
  $('vc-cond').textContent = pair.c;
  // ω=0 时退化为 uncond，ω=1 时退化为 cond，ω>1 时外推
  let cfgText;
  if (vecOmega < 0.3) cfgText = pair.uc;
  else if (vecOmega < 1.5) cfgText = pair.c;
  else if (vecOmega > 4) cfgText = pair.cfg + ' (死板)';
  else cfgText = pair.cfg + ' ✓';
  $('vc-cfg').textContent = cfgText;
  const mag = Math.sqrt(cfgX*cfgX + cfgY*cfgY);
  $('vc-cfg-bar').style.width = Math.min(100, mag * 50) + '%';
  $('vc-omega').textContent = vecOmega.toFixed(1);
}
function drawArrow(ctx, x0, y0, dx, dy, color, label, lw) {
  ctx.strokeStyle = color; ctx.lineWidth = lw || 2.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dx, y0 + dy); ctx.stroke();
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len > 5) {
    const ux = dx/len, uy = dy/len;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0 + dx, y0 + dy);
    ctx.lineTo(x0 + dx - ux*10 + uy*5, y0 + dy - uy*10 - ux*5);
    ctx.lineTo(x0 + dx - ux*10 - uy*5, y0 + dy - uy*10 + ux*5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.font = 'bold 12px Consolas';
    ctx.fillText(label, x0 + dx + 8, y0 + dy - 6);
  }
}
if (cvCfgVec) {
  $('rng-cfg-omega') && $('rng-cfg-omega').addEventListener('input', (e) => {
    vecOmega = +e.target.value / 10;
    drawCfgVec();
  });
  $('btn-vec-swap') && $('btn-vec-swap').addEventListener('click', () => {
    vecPairIdx = (vecPairIdx + 1) % vecPairs.length;
    // 同步更新 cfg-demo 源文 + 重绘画布
    setCfgDemo(cfgDemoState.condOn);
    drawCfgVec();
  });
  $('btn-vec-collapse') && $('btn-vec-collapse').addEventListener('click', () => { vecOmega = 0; $('rng-cfg-omega').value = 0; drawCfgVec(); });
  $('btn-vec-mix') && $('btn-vec-mix').addEventListener('click', () => { vecOmega = 1; $('rng-cfg-omega').value = 10; drawCfgVec(); });
  $('btn-vec-overshoot') && $('btn-vec-overshoot').addEventListener('click', () => { vecOmega = 5; $('rng-cfg-omega').value = 50; drawCfgVec(); });
  drawCfgVec();
}

/* ---------- §7.2 CFG 交互演示：源文→网络→z_t 处的 v̂ ---------- */
const cfgDemoState = { condOn: true };
function drawCfgDemo() {
  const cv = $('cfg-demo-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  const tx = W - 25, ty = 25;
  const ztX = 55, ztY = H - 35;
  const cols = 5, rows = 3;
  const stepX = (W - 80) / (cols - 1);
  const stepY = (H - 80) / (rows - 1);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = 50 + i * stepX;
      const y = 30 + j * stepY;
      const dx = tx - x, dy = ty - y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const ux = dx / len, uy = dy / len;
      const L = 10;
      ctx.strokeStyle = '#c0bba6'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux*L, y + uy*L); ctx.stroke();
    }
  }
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2d2a26'; ctx.font = 'bold 12px Georgia';
  ctx.fillText('x₀', tx + 8, ty + 4);
  ctx.fillStyle = '#a8a39a';
  ctx.beginPath(); ctx.arc(ztX, ztY, 8, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#2d2a26'; ctx.font = 'bold 12px Georgia';
  ctx.fillText('zₜ', ztX + 12, ztY + 4);
  if (cfgDemoState.condOn) {
    const dx = tx - ztX, dy = ty - ztY;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx / len, uy = dy / len;
    const L = Math.min(140, len * 0.85);
    drawCfgDemoArrow(ctx, ztX, ztY, ztX + ux*L, ztY + uy*L, '#4a5d3a', 3.5);
  } else {
    const dx = tx - ztX, dy = ty - ztY;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx / len, uy = dy / len;
    const uxW = ux * 0.9 - uy * 0.4;
    const uyW = uy * 0.9 + ux * 0.3;
    const L = Math.min(80, len * 0.45);
    drawCfgDemoArrow(ctx, ztX, ztY, ztX + uxW*L, ztY + uyW*L, '#a8a39a', 2.5);
    ctx.fillStyle = '#6b6357';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('?', ztX + uxW*L*0.5, ztY + uyW*L*0.5 - 10);
  }
}
function drawCfgDemoArrow(ctx, x1, y1, x2, y2, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const headLen = 6;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI/6), y2 - headLen * Math.sin(ang - Math.PI/6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI/6), y2 - headLen * Math.sin(ang + Math.PI/6));
  ctx.stroke();
}
function setCfgDemo(on) {
  cfgDemoState.condOn = on;
  const textEl = $('cfg-demo-text');
  const maskEl = $('cfg-demo-mask');
  const inputEl = $('cfg-demo-input');
  const formulaEl = $('cfg-demo-formula-label');
  const labelEl = $('cfg-demo-out-label');
  const tOn = $('cfg-toggle-on'), tOff = $('cfg-toggle-off');
  const pair = vecPairs[vecPairIdx] || vecPairs[0];
  // 动态同步源文（中文源文 + 英文译文）
  const zhChars = pair.zh.split('');
  textEl.innerHTML = '"<b>' + zhChars[0] + '</b>' + zhChars.slice(1).join('') + '"<br><span class="cfg-demo-text-zh">' + pair.c.replace(/"/g, '') + '</span>';
  // 同步 cfg-pipeline 三步文字
  const pipeUc = $('cfg-pipe-uc'), pipeC = $('cfg-pipe-c'), pipeCfg = $('cfg-pipe-cfg');
  if (pipeUc) pipeUc.textContent = pair.uc;
  if (pipeC) pipeC.textContent = pair.c;
  if (pipeCfg) pipeCfg.textContent = pair.cfg + ' ✓';
  if (on) {
    textEl.style.display = 'block';
    maskEl.style.display = 'none';
    inputEl.textContent = '第1次：看源文';
    if (formulaEl) formulaEl.textContent = '→ ' + pair.c;
    labelEl.textContent = '准确指向 ✓';
    labelEl.style.color = '#4a5d3a';
    tOn.classList.add('on'); tOff.classList.remove('on');
  } else {
    textEl.style.display = 'none';
    maskEl.style.display = 'flex';
    inputEl.textContent = '第2次：不看源文';
    if (formulaEl) formulaEl.textContent = '→ ' + pair.uc;
    labelEl.textContent = '偏离 · 瞎猜';
    labelEl.style.color = '#a8a39a';
    tOn.classList.remove('on'); tOff.classList.add('on');
  }
  drawCfgDemo();
}
$('cfg-toggle-on') && $('cfg-toggle-on').addEventListener('click', () => setCfgDemo(true));
$('cfg-toggle-off') && $('cfg-toggle-off').addEventListener('click', () => setCfgDemo(false));
setCfgDemo(true);

/* ---------- TOC 高亮当前章节 ---------- */
const tocLinks = $qa('#toc a');
const sections = tocLinks.map(a => $(a.getAttribute('href').substring(1)));
function updateTocActive() {
  const scrollY = window.scrollY + 120;
  let activeIdx = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i] && sections[i].offsetTop <= scrollY) activeIdx = i;
  }
  tocLinks.forEach((a, i) => a.classList.toggle('active', i === activeIdx));
}
window.addEventListener('scroll', updateTocActive, { passive: true });
updateTocActive();

/* 兜底：JSDOM 等环境可能没有 getContext */
function safeCtx(canvas, w, h) {
  if (!canvas) return null;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  try {
    return canvas.getContext('2d');
  } catch (e) {
    return null;
  }
}

/* ========================================================================
   §8 共享权重 + 双 loss 训练 交互
   ======================================================================== */
(function () {
  // ----- 8.1 同一个网络，两种工作模式 -----
  const modeRange = $('rng-mode');
  const lblMode = $('lbl-mode');
  const lblModeOut = $('lbl-mode-output');
  const cvMode = $('cv-mode');
  if (modeRange && cvMode) {
    function drawModeArrow(x1, y1, x2, y2, color, w) {
      const ctx = cvMode.getContext('2d');
      ctx.strokeStyle = color; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const ah = 9;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ah * Math.cos(ang - 0.42), y2 - ah * Math.sin(ang - 0.42));
      ctx.lineTo(x2 - ah * Math.cos(ang + 0.42), y2 - ah * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
    }
    function drawMode() {
      const ctx = safeCtx(cvMode, 800, 260);
      if (!ctx) return;
      const W = 800, H = 260;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

      const t = +modeRange.value / 100;
      const isDecode = t >= 1;

      // 共享 Transformer 主干（中间大方块）
      const tx = 260, ty = 80, tw = 180, th = 110;
      ctx.fillStyle = isDecode ? '#f5efe0' : '#f0f5ec';
      ctx.strokeStyle = '#8a7d5f'; ctx.lineWidth = 1.5;
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeRect(tx, ty, tw, th);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('共享 Transformer', tx + tw/2, ty + 22);
      ctx.font = '11px Consolas, monospace';
      ctx.fillStyle = '#5a4d2f';
      for (let i = 0; i < 3; i++) ctx.fillText('Layer ' + (i+1), tx + tw/2, ty + 44 + i*18);
      // 共享权重标记
      ctx.fillStyle = '#a8553a';
      ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('★ Embedding=Decode', tx + tw/2, ty + th - 6);

      // 输入 z_t（左侧）
      ctx.fillStyle = '#5b7a8c';
      ctx.beginPath(); ctx.arc(160, 135, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('z_t', 160, 139);
      ctx.fillStyle = '#5b7a8c'; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('t=' + t.toFixed(2), 160, 160);
      // 输入→主干 箭头
      drawModeArrow(172, 135, 258, 135, '#1a1a1a', 1.8);

      // 上分支：denoise 头（t<1 激活，绿色）
      const denoiseActive = !isDecode;
      const dhx = 500, dhy = 70, dhw = 150, dhh = 48;
      ctx.fillStyle = denoiseActive ? '#4a7a3a' : '#d8e0d2';
      ctx.fillRect(dhx, dhy, dhw, dhh);
      ctx.strokeStyle = denoiseActive ? '#3a5a2a' : '#b8c0a8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dhx, dhy, dhw, dhh);
      ctx.fillStyle = denoiseActive ? '#fff' : '#8a8a7a';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('denoise 头', dhx + dhw/2, dhy + 20);
      ctx.font = '11px Consolas, monospace';
      ctx.fillText('→ 向量 x̂₀', dhx + dhw/2, dhy + 38);
      // 主干→denoise 箭头（激活时实线，否则虚线淡）
      if (denoiseActive) {
        drawModeArrow(tx + tw, ty + 30, dhx, dhy + dhh/2, '#4a7a3a', 2.5);
      } else {
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(tx + tw, ty + 30); ctx.lineTo(dhx, dhy + dhh/2); ctx.stroke();
        ctx.setLineDash([]);
      }

      // 下分支：decode 头（t=1 激活，橙色）
      const chx = 500, chy = 150, chw = 150, chh = 48;
      ctx.fillStyle = isDecode ? '#a8553a' : '#e8d8c8';
      ctx.fillRect(chx, chy, chw, chh);
      ctx.strokeStyle = isDecode ? '#8a3a2a' : '#c8b8a8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(chx, chy, chw, chh);
      ctx.fillStyle = isDecode ? '#fff' : '#9a8a7a';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('decode 头', chx + chw/2, chy + 20);
      ctx.font = '11px Consolas, monospace';
      ctx.fillText('→ token 词', chx + chw/2, chy + 38);
      // 主干→decode 箭头
      if (isDecode) {
        drawModeArrow(tx + tw, ty + th - 30, chx, chy + chh/2, '#a8553a', 2.5);
      } else {
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(tx + tw, ty + th - 30); ctx.lineTo(chx, chy + chh/2); ctx.stroke();
        ctx.setLineDash([]);
      }

      // 输出（右侧）— 放在 head 右侧，标签竖排避免截断
      if (denoiseActive) {
        // x̂₀ 向量
        ctx.fillStyle = '#4a7a3a';
        ctx.beginPath(); ctx.arc(690, dhy + dhh/2, 9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('x̂₀', 705, dhy + dhh/2 + 4);
        ctx.fillStyle = '#5a6a4a';
        ctx.font = '10.5px "Microsoft YaHei", sans-serif';
        ctx.fillText('连续向量', 705, dhy + dhh/2 + 20);
        drawModeArrow(dhx + dhw, dhy + dhh/2, 681, dhy + dhh/2, '#4a7a3a', 2);
      }
      if (isDecode) {
        // token
        ctx.fillStyle = '#a8553a';
        ctx.beginPath(); ctx.arc(690, chy + chh/2, 9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('"love"', 705, chy + chh/2 + 4);
        ctx.fillStyle = '#7a5a4a';
        ctx.font = '10.5px "Microsoft YaHei", sans-serif';
        ctx.fillText('离散词', 705, chy + chh/2 + 20);
        drawModeArrow(chx + chw, chy + chh/2, 681, chy + chh/2, '#a8553a', 2);
      }

      // 底部：服务说明
      ctx.fillStyle = '#5a5a5a';
      ctx.font = '11.5px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      const serveText = isDecode
        ? 't=1 · decode 模式 · 服务"最终选词"'
        : 't<1 · denoise 模式 · 服务"ODE 一步步去噪"';
      ctx.fillText(serveText, W/2, H - 16);

      // 标签同步
      if (lblMode) lblMode.textContent = t.toFixed(2);
      if (lblModeOut) {
        lblModeOut.style.color = isDecode ? 'var(--rust)' : 'var(--olive)';
        lblModeOut.textContent = isDecode ? 'decode 模式' : 'denoise 模式';
      }
    }
    modeRange.addEventListener('input', drawMode);
    drawMode();
  }

  // ----- 8.2 双 loss 训练：MSE + CE -----
  const mixRange = $('rng-loss-mix');
  const lblMix = $('lbl-loss-mix');
  const lblBleu = $('lbl-loss-bleu');
  const cvMix = $('cv-loss-mix');
  if (mixRange && cvMix) {
    // 论文未对 CE 比例做 BLEU 扫描：训练固定 80% MSE + 20% CE（§4）。
    // 最佳结果 BLEU 26.4（WMT14 De-En，见 §10.1 Table 1）。
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function drawMix() {
      const ctx = safeCtx(cvMix, 800, 280);
      if (!ctx) return;
      const W = 800, H = 280;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

      const v = +mixRange.value; // 0-100 CE 占比

      // 左上：标题
      ctx.fillStyle = '#2d2a26';
      ctx.font = 'bold 13.5px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('每个训练 batch 随机抽一种 loss', 16, 24);

      // 上半：训练 batch 时间轴（20 个圆点）
      const N = 20;
      const dotR = 12, gap = 34, startX = 60, dotY = 72;
      const ceCount = Math.round((v / 100) * N);
      for (let i = 0; i < N; i++) {
        const isCe = i < ceCount;
        const cx = startX + i * gap;
        // 连线
        if (i > 0) {
          ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx - gap + dotR, dotY); ctx.lineTo(cx - dotR, dotY); ctx.stroke();
        }
        // 圆点（带浅色外圈）
        ctx.fillStyle = isCe ? '#f0d8c8' : '#d8e8d0';
        ctx.beginPath(); ctx.arc(cx, dotY, dotR + 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = isCe ? '#a8553a' : '#4a7a3a';
        ctx.beginPath(); ctx.arc(cx, dotY, dotR, 0, Math.PI*2); ctx.fill();
        // 标签
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isCe ? 'CE' : 'MSE', cx, dotY + 3);
      }
      // 时间轴标签
      ctx.fillStyle = '#8a8a7a';
      ctx.font = '10.5px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('训练 step →', startX - 4, dotY + 30);

      // 中部：两 loss 卡片（圆角，带占比条）
      const cardY = 118, cardH = 82, cardW = 360, gap2 = 20;
      const msePct = 100 - v;
      // MSE 卡片
      roundRect(ctx, 40, cardY, cardW, cardH, 10);
      ctx.fillStyle = '#f4f8f0'; ctx.fill();
      ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 1.5;
      roundRect(ctx, 40, cardY, cardW, cardH, 10); ctx.stroke();
      // MSE 标题 + 占比
      ctx.fillStyle = '#4a7a3a';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MSE', 56, cardY + 24);
      ctx.fillStyle = '#8a8a7a';
      ctx.font = '11.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('连续去噪 · 服务 ODE 采样', 100, cardY + 24);
      // MSE 占比条
      const barX1 = 56, barY1 = cardY + 36, barW1 = cardW - 32, barH1 = 10;
      ctx.fillStyle = '#e8ecde';
      roundRect(ctx, barX1, barY1, barW1, barH1, 5); ctx.fill();
      ctx.fillStyle = '#4a7a3a';
      roundRect(ctx, barX1, barY1, barW1 * msePct / 100, barH1, 5); ctx.fill();
      // 占比文字
      ctx.fillStyle = '#3a4a2a';
      ctx.font = 'bold 12px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(msePct + '%', 40 + cardW - 16, cardY + 70);

      // CE 卡片
      const ceX = 40 + cardW + gap2;
      roundRect(ctx, ceX, cardY, cardW, cardH, 10);
      ctx.fillStyle = '#fcf2ea'; ctx.fill();
      ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 1.5;
      roundRect(ctx, ceX, cardY, cardW, cardH, 10); ctx.stroke();
      // CE 标题 + 作用
      ctx.fillStyle = '#a8553a';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CE', ceX + 16, cardY + 24);
      ctx.fillStyle = '#8a8a7a';
      ctx.font = '11.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('离散解码 · 服务选词', ceX + 50, cardY + 24);
      // CE 占比条
      const barX2 = ceX + 16, barY2 = cardY + 36, barW2 = cardW - 32, barH2 = 10;
      ctx.fillStyle = '#f0e0d4';
      roundRect(ctx, barX2, barY2, barW2, barH2, 5); ctx.fill();
      ctx.fillStyle = '#a8553a';
      roundRect(ctx, barX2, barY2, barW2 * v / 100, barH2, 5); ctx.fill();
      // 占比文字
      ctx.fillStyle = '#7a3a2a';
      ctx.font = 'bold 12px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(v + '%', ceX + cardW - 16, cardY + 70);

      // 底部：真实说明（论文未对 CE 比例做 BLEU 扫描）
      const noteY = 224;
      ctx.fillStyle = '#a8553a';
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('论文设定：每个 batch 以 80% 概率抽 MSE、20% 概率抽 CE', 16, noteY);
      ctx.fillStyle = '#5b7a8c';
      ctx.font = '11.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('最佳结果 BLEU 26.4（WMT14 De-En，见 §10.1 Table 1）。', 16, noteY + 18);

      // 同步 HTML 标签
      if (lblMix) lblMix.textContent = v + '%';
      if (lblBleu) lblBleu.textContent = '论文固定：80% MSE + 20% CE';
    }
    mixRange.addEventListener('input', drawMix);
    drawMix();
  }
})();

/* ---------- 推理算法逐步走 ---------- */
const infStepData = [
  {
    label: 'Step 0 · 采样高斯噪声',
    math: 'z₀ ← 𝒩(0, I)',
    desc: '<b>干什么</b>：从标准高斯采样一张"纯噪声"张量，<b>维度</b> (D, N) = (1024 维 × token 数)，作为整条 ODE 路径的起点 z₀。'
  },
  {
    label: 'Step 1 · 初始化 self-cond',
    math: 'x̂ ← 0',
    desc: '<b>干什么</b>：self-conditioning 机制需要"上一时刻的预测"作为额外输入；<b>第一帧没历史</b>，所以用 0 占位（论文 L64 也是这么做的）。'
  },
  {
    label: 'Step 2 · 拼接 self-cond',
    math: 'z_sc ← proj(concat[z, x̂])',
    desc: '<b>干什么</b>：把 z 和上一步的 x̂ 沿特征维拼起来，<b>维度翻倍</b>；用一个线性层 self_cond_proj <b>压回 D 维</b>，作为下一步网络的输入。'
  },
  {
    label: 'Step 3 · 网络前向',
    math: 'x̂ ← net(z_sc, t, c, w, mode=denoise)',
    desc: '<b>干什么</b>：把 z_sc + 时间 t + 条件 c + 模式标记 都拼成 token 喂进 net，<b>走 Denoise 头</b>，输出 x_pred（不是 v，直接预测 x₀！）。'
  },
  {
    label: 'Step 4 · x → v 转换 + 积分',
    math: 'v̂ ← (x̂ − z_t) / (1−t);  z ← z + Δt · v̂',
    desc: '<b>干什么</b>：net 出来的是 x_pred（<b>不是 v</b>），用 (x̂−z_t)/(1−t) 代数推出 v̂；再用 Euler 法把 z 沿 v 推 Δt 步，<b>到 t+Δt 时刻</b>。'
  },
  {
    label: 'Step 5 · 解码到 token',
    math: 'tokens ← argmax(W · net(z, t=1, mode=decode))',
    desc: '<b>干什么</b>：t=1 时把 z 再过一次 net，但这次走 <b>Decode 头</b> 拿到 logits；乘 W（unembed 矩阵）映射到词表；<b>argmax</b> 出最可能的那个词。'
  }
];

/* ---------- 训练算法逐步走 ---------- */
const trnStepData = [
  {
    label: 'Step 0 · 编码',
    math: 'x ← encode(s) ∈ ℝ^(D×N)',
    desc: '离散 token → 连续嵌入。T5 encoder 仅在训练时使用。'
  },
  {
    label: 'Step 1 · 选分支（80/20）',
    math: 'P(denoise)=0.8,  P(decode)=0.2',
    desc: '同一 batch 内随机选分支，共享底层权重。'
  },
  {
    label: 'Step 2 · Denoise 分支（橄榄绿）',
    math: 't ← uniform[0,1];  z ← t·x + (1−t)·ε;  L ← MSE',
    desc: '均匀采样 t → 线性插值加噪 → 网络预测 x̂ → 代数转 v̂ → MSE loss。'
  },
  {
    label: 'Step 3 · Decode 分支（赭橙）',
    math: 'z ← corrupt(x);  L ← CE(unembed(net(z, t=1, mode=decode)), s)',
    desc: 't=1 时 per-token 噪声 corrupt → decode 模式 → CE loss 维持离散化能力。'
  },
  {
    label: 'Step 4 · Self-conditioning（50% 概率）',
    math: 'x̂_(2) ← net(concat[z, stopgrad(x̂_(1))])',
    desc: '双前向加速收敛。50% 概率启用，stopgrad 阻断梯度回传。'
  },
  {
    label: 'Step 5 · 训练时 CFG',
    math: 'v_target ← v + (1 − 1/ω)·(v_sc − v_no_sc)',
    desc: '网络直接学引导后轨迹 v_cfg → 推理时单次前向即可，无需额外计算。'
  }
];

/* ---------- 公式展开讲解 canvas 绘制函数 ---------- */
// fx-ode: 拖 t 看流速方向变化 + 拖 N 看步长折线
window.drawFx_fx_ode = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let tVal = 0.5;
  let N = 30;  // 步数（控制 Euler 折线密度）
  const sx = 110, sy = H - 60;
  const ex = W - 110, ey = 60;

  function drawBgArrows() {
    // 背景向量场（5x4 灰箭头，提示"flow"）
    const gx0 = sx + 30, gx1 = ex - 30;
    const gy0 = sy - 30, gy1 = ey + 30;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 4; j++) {
        const x = gx0 + i * (gx1 - gx0) / 5;
        const y = gy0 + j * (gy1 - gy0) / 3;
        const dx = ex - x, dy = ey - y;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const L2 = 14;
        const ex2 = x + ux * L2, ey2 = y + uy * L2;
        ctx.strokeStyle = '#d8d3c2';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex2, ey2); ctx.stroke();
        // 三角箭头
        ctx.fillStyle = '#d8d3c2';
        ctx.beginPath();
        ctx.moveTo(ex2, ey2);
        ctx.lineTo(ex2 - ux*4 + uy*2.4, ey2 - uy*4 - ux*2.4);
        ctx.lineTo(ex2 - ux*4 - uy*2.4, ey2 - uy*4 + ux*2.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawArrowHead(x, y, ux, uy, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * size + uy * size * 0.5, y - uy * size - ux * size * 0.5);
    ctx.lineTo(x - ux * size - uy * size * 0.5, y - uy * size + ux * size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawBgArrows();

    // 标题（画布内顶部）
    ctx.fillStyle = '#5b7a8c';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ODE 轨迹 + 步长折线 (N=${N} 步) — 拖 t 看位置、拖 N 看步长`, 16, 20);

    // 轨迹虚线 ε → x0
    ctx.strokeStyle = '#5b7a8c';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);

    // 起点 ε
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ε', sx, sy + 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('起点 (t=0)', sx - 16, sy + 30);

    // 终点 x0
    ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x', ex, ey + 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('终点 (t=1)', ex + 16, ey - 6);

    // Euler 折线（沿真实轨迹分 N 段）
    ctx.strokeStyle = '#4a5d3a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const px = sx + (ex - sx) * f;
      const py = sy + (ey - sy) * f;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // 折线节点（小点）
    ctx.fillStyle = '#4a5d3a';
    for (let i = 1; i < N; i++) {
      const f = i / N;
      const px = sx + (ex - sx) * f;
      const py = sy + (ey - sy) * f;
      ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI*2); ctx.fill();
    }

    // 当前 z_t 位置（高亮 + 晕圈）
    const zx = sx + (ex - sx) * tVal;
    const zy = sy + (ey - sy) * tVal;

    ctx.strokeStyle = 'rgba(168,85,58,0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(zx, zy, 18, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(168,85,58,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(zx, zy, 16, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = '#a8553a';
    ctx.beginPath(); ctx.arc(zx, zy, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('z', zx, zy + 4);
    ctx.fillStyle = '#a8553a';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.fillText(`z_t  (t=${tVal.toFixed(2)})`, zx, zy - 24);

    // 当前 v̂ 方向箭头（指向 x0，加粗 + 醒目）
    const dx = ex - zx, dy = ey - zy;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx / len, uy = dy / len;
    const aL = 100;
    const ax = zx + ux * aL, ay = zy + uy * aL;

    ctx.strokeStyle = '#a8553a';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(zx, zy); ctx.lineTo(ax, ay); ctx.stroke();
    drawArrowHead(ax, ay, ux, uy, 14, '#a8553a');

    // v̂ 标签
    ctx.fillStyle = '#a8553a';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    const lblOff = (uy < 0) ? -8 : 16;
    ctx.fillText(`v̂_θ = net(z_t, ${tVal.toFixed(2)})`, ax + 8, ay + lblOff);

    // 底部提示
    ctx.fillStyle = '#7a7568';
    ctx.font = '11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    const dt = (1 / N).toFixed(3);
    ctx.fillText(`沿 v̂ 走 Δt=${dt} 步 → 下一站 z_{t+Δt}（N 越小，步长越大）`, 16, H - 14);
  }

  // 防止重复创建 ctrl（多次调用 drawFx_fx_ode 会重复插入）
  if (!cv.nextSibling || !cv.nextSibling.classList || !cv.nextSibling.classList.contains('fx-ode-ctrl')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl fx-ode-ctrl';
    ctrl.style.margin = '8px 0 4px';
    ctrl.style.display = 'flex';
    ctrl.style.flexWrap = 'nowrap';
    ctrl.style.alignItems = 'center';
    ctrl.style.gap = '18px';
    ctrl.style.whiteSpace = 'nowrap';
    ctrl.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
        <label style="font-weight:600;color:#5b7a8c;">时间 t</label>
        <input type="range" min="0" max="100" value="50" step="1" style="flex:0 1 180px;height:6px;">
        <span class="val" style="font-weight:700;color:#a8553a;min-width:38px;display:inline-block;">0.50</span>
      </span>
      <span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
        <label style="font-weight:600;color:#4a5d3a;">步数 N</label>
        <input type="range" min="2" max="80" value="30" step="1" style="flex:0 1 180px;height:6px;">
        <span class="val val-n" style="font-weight:700;color:#4a5d3a;min-width:38px;display:inline-block;">30</span>
        <span style="color:#9a9484;font-size:13px;">（Δt=1/N）</span>
      </span>
    `;
    cv.parentNode.insertBefore(ctrl, cv.nextSibling);
    const inputs = ctrl.querySelectorAll('input[type="range"]');
    const labels = ctrl.querySelectorAll('.val');
    // 第 1 个：时间 t
    inputs[0].addEventListener('input', () => {
      tVal = parseInt(inputs[0].value) / 100;
      labels[0].textContent = tVal.toFixed(2);
      draw();
    });
    // 第 2 个：步数 N
    inputs[1].addEventListener('input', () => {
      N = parseInt(inputs[1].value);
      labels[1].textContent = N;
      draw();
    });
  }
  draw();
};

// fx-euler: 拖步数 N
window.drawFx_fx_euler = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let N = 30;
  function draw() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const sx = 80, sy = H - 50;
    const ex = W - 80, ey = 50;
    ctx.strokeStyle = '#5b7a8c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#4a5d3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const x = sx + (ex - sx) * f;
      const y = sy + (ey - sy) * f;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#4a5d3a';
    for (let i = 1; i < N; i++) {
      const f = i / N;
      const x = sx + (ex - sx) * f;
      const y = sy + (ey - sy) * f;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '12px Georgia';
    ctx.fillText('真实 (蓝色虚线)', sx, H - 14);
    ctx.fillStyle = '#4a5d3a';
    ctx.fillText(`Euler 折线 (${N} 步)`, sx + 120, H - 14);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI*2); ctx.fill();
  }
  // 防止重复创建 ctrl
  if (!cv.nextSibling || !cv.nextSibling.classList || !cv.nextSibling.classList.contains('fx-euler-ctrl')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl fx-euler-ctrl';
    ctrl.style.margin = '6px 0';
    ctrl.innerHTML = '<label>步数 N</label><input type="range" min="2" max="100" value="30" step="1" style="flex:0 1 220px;"><span class="val">30</span>';
    cv.parentNode.insertBefore(ctrl, cv.nextSibling);
    const rng = ctrl.querySelector('input');
    const lbl = ctrl.querySelector('.val');
    rng.addEventListener('input', () => {
      N = parseInt(rng.value);
    lbl.textContent = N;
    draw();
  });
  }  // 关闭防重复 if
  draw();
};

// fx-sde: 拖 η 看抖动
window.drawFx_fx_sde = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let eta = 0.3;
  function pseudoRand(seed) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  const sx = 110, sy = H - 60;
  const ex = W - 110, ey = 60;

  function drawBgArrows() {
    const gx0 = sx + 30, gx1 = ex - 30;
    const gy0 = sy - 30, gy1 = ey + 30;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 4; j++) {
        const x = gx0 + i * (gx1 - gx0) / 5;
        const y = gy0 + j * (gy1 - gy0) / 3;
        const dx = ex - x, dy = ey - y;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const ex2 = x + ux * 12, ey2 = y + uy * 12;
        ctx.strokeStyle = '#e8e3d4';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex2, ey2); ctx.stroke();
        ctx.fillStyle = '#e8e3d4';
        ctx.beginPath();
        ctx.moveTo(ex2, ey2);
        ctx.lineTo(ex2 - ux*4 + uy*2.4, ey2 - uy*4 - ux*2.4);
        ctx.lineTo(ex2 - ux*4 - uy*2.4, ey2 - uy*4 + ux*2.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function draw() {
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawBgArrows();

    // 标题
    ctx.fillStyle = '#a8553a';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SDE 采样 —— 6 条同起点路径在随机噪声下散开', 16, 20);

    // ODE 参考线
    ctx.strokeStyle = '#5b7a8c';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);

    // 起点 ε / 终点 x
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ε', sx, sy + 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('起点 (同)', sx - 16, sy + 30);

    ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x', ex, ey + 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('终点 (≈ 分布中心)', ex + 16, ey - 6);

    // 6 条 SDE 路径（高对比 6 色）
    const N = 30;
    const trailColors = [
      '#a8553a', // 主橙
      '#5b7a8c', // 蓝
      '#4a5d3a', // 橄榄
      '#8c4a6b', // 紫红
      '#b88240', // 琥珀
      '#6b5a8c'  // 紫蓝
    ];
    for (let trail = 0; trail < 6; trail++) {
      const seed = trail * 1000 + 1;
      const isMain = (trail === 0);
      ctx.strokeStyle = trailColors[trail];
      ctx.lineWidth = isMain ? 2.8 : 1.5;
      ctx.globalAlpha = isMain ? 1 : 0.55;
      ctx.beginPath();
      let x = sx, y = sy;
      ctx.moveTo(x, y);
      for (let i = 1; i <= N; i++) {
        const f = i / N;
        const tx = sx + (ex - sx) * f;
        const ty = sy + (ey - sy) * f;
        const r1 = pseudoRand(seed + i * 2);
        const r2 = pseudoRand(seed + i * 2 + 1);
        const noise = Math.sqrt(2 * eta) * 22;
        x = tx + (r1 - 0.5) * noise;
        y = ty + (r2 - 0.5) * noise;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 终点圆点
      ctx.fillStyle = trailColors[trail];
      ctx.beginPath(); ctx.arc(x, y, isMain ? 5 : 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 图例（右下角）
    const lgW = 280, lgH = 70;
    const lgX = W - lgW - 16, lgY = H - lgH - 12;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#d8d3c2';
    ctx.lineWidth = 1;
    ctx.fillRect(lgX, lgY, lgW, lgH);
    ctx.strokeRect(lgX, lgY, lgW, lgH);
    ctx.textAlign = 'left';
    // 虚线参考
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#5b7a8c';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lgX+10, lgY+16); ctx.lineTo(lgX+34, lgY+16); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#5b7a8c';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText('ODE 直线 (η=0)', lgX+40, lgY+19);
    // 实线 SDE
    ctx.strokeStyle = '#a8553a';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lgX+10, lgY+38); ctx.lineTo(lgX+34, lgY+38); ctx.stroke();
    ctx.fillStyle = '#a8553a';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText(`SDE 6 条路径  η=${eta.toFixed(2)}`, lgX+40, lgY+41);
    // 阴影小线 + 灰字注解
    ctx.strokeStyle = '#a8553a';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(lgX+10, lgY+58); ctx.lineTo(lgX+34, lgY+58); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#7a7568';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('抖动越大 = 终点分布越散 = 多样性越好', lgX+40, lgY+61);
  }

  // 防止重复创建 ctrl
  if (!cv.nextSibling || !cv.nextSibling.classList || !cv.nextSibling.classList.contains('fx-sde-ctrl')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl fx-sde-ctrl';
    ctrl.style.margin = '8px 0 4px';
    ctrl.style.display = 'flex';
    ctrl.style.alignItems = 'center';
    ctrl.style.gap = '10px';
    ctrl.innerHTML = `
      <label style="font-weight:600;color:#a8553a;">噪声强度 η</label>
      <input type="range" min="0" max="100" value="30" step="1" style="flex:0 1 320px;height:6px;">
      <span class="val" style="font-weight:700;color:#a8553a;min-width:48px;display:inline-block;">0.30</span>
      <span style="color:#9a9484;font-size:13px;">(0=纯ODE → 1=强随机)</span>
    `;
    cv.parentNode.insertBefore(ctrl, cv.nextSibling);
    const rng = ctrl.querySelector('input');
    const lbl = ctrl.querySelector('.val');
    rng.addEventListener('input', () => {
      eta = parseInt(rng.value) / 100;
      lbl.textContent = eta.toFixed(2);
      draw();
    });
  }  // 关闭防重复 if
  draw();
};

// fx-interp: 拖 t 看插值
window.drawFx_fx_interp = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let tVal = 0.5;
  function draw() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const ex = 120, ey = H / 2;
    const xx = W - 120, xy = H / 2;
    const zx = ex + (xx - ex) * tVal;
    const zy = ey + (xy - ey) * tVal;
    ctx.strokeStyle = '#5b7a8c';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(xx, xy); ctx.stroke();
    ctx.setLineDash([]);
    const grad = ctx.createLinearGradient(ex, ey, xx, xy);
    grad.addColorStop(0, 'rgba(168, 85, 58, 0.6)');
    grad.addColorStop(1, 'rgba(74, 93, 58, 0.6)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(zx, zy); ctx.stroke();
    ctx.fillStyle = '#a8553a';
    ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('ε (噪声)', ex - 30, ey + 30);
    ctx.fillStyle = '#4a5d3a';
    ctx.beginPath(); ctx.arc(xx, xy, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('x (干净)', xx - 30, xy + 30);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(zx, zy, 9, 0, Math.PI*2); ctx.fill();
    ctx.fillText(`z_t = ${tVal.toFixed(2)}·x + ${(1-tVal).toFixed(2)}·ε`, zx - 80, zy - 16);
  }
  // 防止重复创建 ctrl
  if (!cv.nextSibling || !cv.nextSibling.classList || !cv.nextSibling.classList.contains('fx-interp-ctrl')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl fx-interp-ctrl';
    ctrl.style.margin = '6px 0';
    ctrl.innerHTML = '<label>t</label><input type="range" min="0" max="100" value="50" step="1" style="flex:0 1 220px;"><span class="val">0.50</span>';
    cv.parentNode.insertBefore(ctrl, cv.nextSibling);
    const rng = ctrl.querySelector('input');
    const lbl = ctrl.querySelector('.val');
    rng.addEventListener('input', () => {
      tVal = parseInt(rng.value) / 100;
      lbl.textContent = tVal.toFixed(2);
      draw();
    });
  }  // 关闭防重复 if
  draw();
};

// fx-x2v: 拖 t 看 x̂ → v̂ 的代数推导
window.drawFx_fx_x2v = function(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let tVal = 0.3;
  // 固定场景：真实 x₀、预测 x̂₀
  const xTrue = { x: 1.5, y: 1.0 };      // 真实 x₀ 位置
  const xPred = { x: 1.42, y: 0.92 };     // 预测 x̂₀（略偏离真实）
  function draw() {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    // 标题
    ctx.fillStyle = '#2d2a26';
    ctx.font = 'bold 13.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ 拖 t：看 x̂₀ 如何被代公式转成 v̂', 18, 22);

    // 坐标轴：把 [-2, 2] × [-2, 2] 映射到画布中央
    const cx = W * 0.52, cy = H * 0.5 + 18;
    const scale = 90;  // 每个数据单位 90 像素
    const toPx = (vx, vy) => ({ x: cx + vx * scale, y: cy - vy * scale });
    // 浅灰网格
    ctx.strokeStyle = '#e5e8ef'; ctx.lineWidth = 1;
    for (let v = -2; v <= 2; v++) {
      const h = toPx(v, 0), w = toPx(0, v);
      ctx.beginPath(); ctx.moveTo(h.x - 250, h.y); ctx.lineTo(h.x + 250, h.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w.x, w.y - 150); ctx.lineTo(w.x, w.y + 150); ctx.stroke();
    }
    // 主坐标轴
    ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 250, cy); ctx.lineTo(cx + 250, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy + 150); ctx.stroke();
    // 原点标签
    ctx.fillStyle = '#9a9484'; ctx.font = '11px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText('0', cx - 5, cy + 14);

    // 真实 x₀（黑圆，中心点）
    const xTruePx = toPx(xTrue.x, xTrue.y);
    ctx.fillStyle = 'rgba(26,26,26,0.15)';
    ctx.beginPath(); ctx.arc(xTruePx.x, xTruePx.y, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(xTruePx.x, xTruePx.y, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('x₀', xTruePx.x, xTruePx.y + 4);
    ctx.fillStyle = '#1a1a1a'; ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText('真实 x₀ = (' + xTrue.x + ', ' + xTrue.y + ')', xTruePx.x, xTruePx.y - 24);

    // 预测 x̂₀（橙色，紧挨真实，偏移一点点）
    const xPredPx = toPx(xPred.x, xPred.y);
    ctx.fillStyle = 'rgba(168,85,58,0.18)';
    ctx.beginPath(); ctx.arc(xPredPx.x, xPredPx.y, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#a8553a';
    ctx.beginPath(); ctx.arc(xPredPx.x, xPredPx.y, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('x̂', xPredPx.x, xPredPx.y + 4);
    ctx.fillStyle = '#a8553a'; ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('预测 x̂₀ = (' + xPred.x + ', ' + xPred.y + ')', xPredPx.x + 16, xPredPx.y - 4);
    // x̂₀ 旁边的虚线连接到真实 x₀
    ctx.strokeStyle = 'rgba(168,85,58,0.45)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xPredPx.x, xPredPx.y); ctx.lineTo(xTruePx.x, xTruePx.y); ctx.stroke();
    ctx.setLineDash([]);

    // z_t 当前位置（蓝色，扫描从 ε → x）
    const eps = { x: -1.5, y: -1.0 };  // 起点 ε
    const zt = {
      x: (1 - tVal) * eps.x + tVal * xTrue.x,
      y: (1 - tVal) * eps.y + tVal * xTrue.y
    };
    const ztPx = toPx(zt.x, zt.y);
    // z_t 周围大光晕
    ctx.fillStyle = 'rgba(91,122,140,0.18)';
    ctx.beginPath(); ctx.arc(ztPx.x, ztPx.y, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(91,122,140,0.4)';
    ctx.beginPath(); ctx.arc(ztPx.x, ztPx.y, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5b7a8c';
    ctx.beginPath(); ctx.arc(ztPx.x, ztPx.y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('z', ztPx.x, ztPx.y + 4);
    ctx.fillStyle = '#5b7a8c'; ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText(`z_t = (${zt.x.toFixed(2)}, ${zt.y.toFixed(2)})`, ztPx.x, ztPx.y - 26);
    // z_t 上方画 v̂ 箭头
    // v̂ = (x̂ - z) / (1 - t)，长度按真实 1 单位 ≈ 90px，但用 visual scale 让它可视
    const vx = (xPred.x - zt.x) / (1 - tVal);
    const vy = (xPred.y - zt.y) / (1 - tVal);
    const vLen = Math.hypot(vx, vy);
    // visual scale: 让 v̂ 箭头长度固定在 ~140 像素，便于看
    const vDrawLen = 140;
    const vux = vx / vLen, vuy = vy / vLen;
    const vax = ztPx.x + vux * vDrawLen;
    const vay = ztPx.y - vuy * vDrawLen;
    // 画虚线 "真实长度" 提示
    ctx.strokeStyle = 'rgba(168,85,58,0.25)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(ztPx.x, ztPx.y); ctx.lineTo(vax, vay); ctx.stroke();
    ctx.setLineDash([]);
    // 画实线 v̂
    ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(ztPx.x, ztPx.y); ctx.lineTo(vax, vay); ctx.stroke();
    // 箭头头
    ctx.fillStyle = '#a8553a';
    const ang = Math.atan2(vay - ztPx.y, vax - ztPx.x);
    ctx.save();
    ctx.translate(vax, vay); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // v̂ 标签
    ctx.fillStyle = '#a8553a'; ctx.font = 'bold 12.5px "Microsoft YaHei", sans-serif';
    const lblX = ztPx.x + vux * (vDrawLen + 16) + (vuy < 0 ? -14 : 0);
    const lblY = ztPx.y - vuy * (vDrawLen + 16) + (vuy < 0 ? -8 : 18);
    ctx.textAlign = 'center';
    ctx.fillText(`v̂ = (${vx.toFixed(2)}, ${vy.toFixed(2)})`, lblX, lblY);

    // 公式展示（右下角小卡片）
    const fX = W - 240, fY = 50;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#d4c898'; ctx.lineWidth = 1;
    ctx.fillRect(fX, fY, 224, 78);
    ctx.strokeRect(fX, fY, 224, 78);
    ctx.fillStyle = '#8b6f3a'; ctx.font = 'bold 11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📐 公式代入', fX + 10, fY + 18);
    ctx.fillStyle = '#2d2a26'; ctx.font = '11.5px Consolas, monospace';
    ctx.fillText(`x̂₀ − z_t = (${(xPred.x - zt.x).toFixed(2)}, ${(xPred.y - zt.y).toFixed(2)})`, fX + 10, fY + 36);
    ctx.fillText(`除以 (1 − t) = ${(1 - tVal).toFixed(2)}`, fX + 10, fY + 54);
    ctx.fillStyle = '#a8553a'; ctx.font = 'bold 11.5px Consolas, monospace';
    ctx.fillText(`→ v̂ = (${vx.toFixed(2)}, ${vy.toFixed(2)})`, fX + 10, fY + 70);

    // 提示
    ctx.fillStyle = '#5a6a7a'; ctx.font = '11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💡 t 越接近 1，(1−t) 越小 → v̂ 越长（这就是 ODE 末期"加速冲终点"的视觉效果）', 18, H - 14);
  }
  // 防止重复创建 ctrl
  if (!cv.nextSibling || !cv.nextSibling.classList || !cv.nextSibling.classList.contains('fx-x2v-ctrl')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl fx-x2v-ctrl';
    ctrl.style.margin = '6px 0';
    ctrl.innerHTML = '<label>时间 t</label><input type="range" min="5" max="95" value="30" step="1" style="flex:0 1 280px;"><span class="val">0.30</span><span class="val" style="color:#7a7568; font-size:13px;">（0=噪声 → 1=数据）</span>';
    cv.parentNode.insertBefore(ctrl, cv.nextSibling);
    const rng = ctrl.querySelector('input');
    const lbl = ctrl.querySelector('.val');
    rng.addEventListener('input', () => {
      tVal = parseInt(rng.value) / 100;
      lbl.textContent = tVal.toFixed(2);
      draw();
    });
  }  // 关闭防重复 if
  draw();
};

// ----- 9.1 Self-conditioning：先猜一次再喂回去 -----
(function() {
  const cv = $('cv-selfcond');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const btn = $('btn-selfcond');
  const lbl = $('lbl-selfcond');
  let enabled = false; // 0/1 开关

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function arrow(x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
  }
  function card(x, y, w, h, r, fillTop, fillBot, border) {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBot);
    roundRect(x, y, w, h, r);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = 1.8;
    roundRect(x, y, w, h, r); ctx.stroke();
  }

  function draw() {
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#fbfcfe'; ctx.fillRect(0, 0, W, H);

    // 顶部标题
    ctx.fillStyle = '#2d2a26';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(enabled ? '模式：双前向（self-cond 启用）' : '模式：单前向（self-cond 关闭）', 24, 28);
    // 模式徽章
    const badgeText = enabled ? '50% 走两次' : '50% 走一次';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    const bw = ctx.measureText(badgeText).width + 22;
    roundRect(W - bw - 24, 14, bw, 22, 11);
    ctx.fillStyle = enabled ? '#a8553a' : '#5b7a8c'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(badgeText, W - bw/2 - 24, 29);

    // 左：输入卡片（渐变绿）
    const ix = 40, iy = 100, iw = 140, ih = 68;
    card(ix, iy, iw, ih, 10, '#eaf4e0', '#d4e8c0', '#4a7a3a');
    ctx.fillStyle = '#4a7a3a'; ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INPUT', ix + 12, iy + 16);
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 17px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('z_t, t', ix + iw/2, iy + 40);
    ctx.fillStyle = '#5a7a4a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('噪声输入', ix + iw/2, iy + 58);

    const nx = 240, nw = 220;
    if (!enabled) {
      // 单次前向（渐变蓝）
      const ny = 106, nh = 60;
      card(nx, ny, nw, nh, 10, '#e8eef5', '#c8d8e8', '#5b7a8c');
      ctx.fillStyle = '#5b7a8c'; ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('NETWORK', nx + 12, ny + 16);
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('net(z_t)', nx + nw/2, ny + 38);
      ctx.fillStyle = '#5a6a7a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('直接猜 x̂₀', nx + nw/2, ny + 54);
      arrow(ix + iw, iy + ih/2, nx, ny + nh/2, '#4a7a3a', 2.2);
      // 输出卡片（渐变绿）
      const ox = 540;
      arrow(nx + nw, ny + nh/2, ox - 5, ny + nh/2, '#5b7a8c', 2.2);
      card(ox, ny + nh/2 - 22, 130, 44, 8, '#eaf4e0', '#d4e8c0', '#4a7a3a');
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 15px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('x̂₀', ox + 65, ny + nh/2 + 5);
      ctx.fillStyle = '#5a7a4a'; ctx.font = '10.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('猜的终点', ox + 65, ny + nh/2 + 20);
    } else {
      // 两次前向
      const n1y = 60, nh = 58;
      // 第一次网络（渐变蓝）
      card(nx, n1y, nw, nh, 10, '#e8eef5', '#c8d8e8', '#5b7a8c');
      ctx.fillStyle = '#5b7a8c'; ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('① 1st FORWARD', nx + 12, n1y + 16);
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 14px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('net(z_t, ∅)', nx + nw/2, n1y + 36);
      ctx.fillStyle = '#5a6a7a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('先粗猜', nx + nw/2, n1y + 52);
      arrow(ix + iw, iy + ih/2, nx, n1y + nh/2, '#4a7a3a', 2.2);

      // x̂' 中间结果卡片
      const mx = 540, my = n1y + nh/2 - 16;
      arrow(nx + nw, n1y + nh/2, mx - 5, n1y + nh/2, '#5b7a8c', 2.2);
      card(mx, my, 100, 32, 8, '#f0f5ec', '#dce8d0', '#8a9a7a');
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 14px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText("x̂'", mx + 50, my + 21);

      // 喂回去弧线（醒目橙色）
      ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(mx + 50, my + 32);
      ctx.bezierCurveTo(mx + 50, my + 60, nx + nw/2 + 40, my + 50, nx + nw/2 + 20, n1y + nh + 18);
      ctx.stroke();
      ctx.setLineDash([]);
      // 喂回去标签（橙色圆角徽章）
      const lblX = mx + 18, lblY = my + 50;
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      const lw = ctx.measureText('喂回去').width + 16;
      roundRect(lblX, lblY - 12, lw, 20, 10);
      ctx.fillStyle = '#a8553a'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText('喂回去', lblX + lw/2, lblY + 2);

      // 第二次网络（渐变橙）
      const n2y = 148;
      card(nx, n2y, nw, nh, 10, '#fce8da', '#f0c8b0', '#a8553a');
      ctx.fillStyle = '#a8553a'; ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('② 2nd FORWARD', nx + 12, n2y + 16);
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 14px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('net(z_t, x̂′)', nx + nw/2, n2y + 36);
      ctx.fillStyle = '#8a5a4a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('看到粗猜，再猜', nx + nw/2, n2y + 52);

      // 输出卡片（渐变橙）
      const ox = 540;
      arrow(nx + nw, n2y + nh/2, ox - 5, n2y + nh/2, '#a8553a', 2.2);
      card(ox, n2y + nh/2 - 22, 130, 44, 8, '#fce8da', '#f0c8b0', '#a8553a');
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 15px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('x̂₀', ox + 65, n2y + nh/2 + 5);
      ctx.fillStyle = '#8a5a4a'; ctx.font = '10.5px "Microsoft YaHei", sans-serif';
      ctx.fillText('更准的终点', ox + 65, n2y + nh/2 + 20);
    }

    // 底部说明
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    if (enabled) {
      ctx.fillText('训练时 50% 概率走两次：先粗猜 x̂′ 再喂回去，网络"看到自己的猜测"后猜得更准（关联 §7.2 猜终点）', 40, H - 14);
    } else {
      ctx.fillText('另外 50% 概率只走一次：网络只看 z_t 直接猜 x̂₀（与生成时一致）', 40, H - 14);
    }

    if (btn) {
      btn.textContent = enabled ? '开' : '关';
      btn.style.background = enabled ? '#a8553a' : '#fff';
      btn.style.color = enabled ? '#fff' : '#5b7a8c';
      btn.style.borderColor = enabled ? '#a8553a' : '#5b7a8c';
    }
    if (lbl) lbl.textContent = enabled ? '双前向（50% 概率）' : '单前向';
  }
  if (btn) btn.addEventListener('click', () => { enabled = !enabled; draw(); });
  draw();
})();

// ----- 9.3 条件任务：源文当条件，译文当目标 -----
(function() {
  const cv = $('cv-cond');
  if (!cv) return;
  const ctx = cv.getContext('2d');

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function arrow(x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(ang - 0.4), y2 - 7 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 7 * Math.cos(ang + 0.4), y2 - 7 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    // ===== 左侧：源文（条件，不噪声）=====
    const lx = 40, ly = 50, lw = 300, lh = 170;
    // 背景框
    roundRect(lx, ly, lw, lh, 10); ctx.fillStyle = '#f4f8f0'; ctx.fill();
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 1.5; roundRect(lx, ly, lw, lh, 10); ctx.stroke();
    // 标题
    ctx.fillStyle = '#4a7a3a'; ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('源文（条件）', lx + 16, ly + 24);
    ctx.fillStyle = '#8a8a7a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('不加噪，直接给网络当提示', lx + 16, ly + 42);
    // token
    const srcTokens = ['I', 'love', 'you'];
    const tw = 56, th = 44, gap = 8;
    const srcX0 = lx + (lw - (srcTokens.length * (tw + gap) - gap)) / 2;
    const srcY = ly + 62;
    srcTokens.forEach((t, i) => {
      const x = srcX0 + i * (tw + gap);
      roundRect(x, srcY, tw, th, 6); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 1.5; roundRect(x, srcY, tw, th, 6); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t, x + tw/2, srcY + th/2 + 5);
    });
    // T5 编码标记
    ctx.fillStyle = '#4a7a3a'; ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('→ T5 编码器 → 条件向量 h', lx + lw/2, srcY + th + 22);

    // ===== 右侧：译文（目标，加噪→还原）=====
    const rx = 460, ry = 50, rw = 300, rh = 170;
    roundRect(rx, ry, rw, rh, 10); ctx.fillStyle = '#fcf2ea'; ctx.fill();
    ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 1.5; roundRect(rx, ry, rw, rh, 10); ctx.stroke();
    ctx.fillStyle = '#a8553a'; ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('译文（目标）', rx + 16, ry + 24);
    ctx.fillStyle = '#8a8a7a'; ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('加噪，让网络学着还原', rx + 16, ry + 42);
    // token（带噪声点）
    const tgtTokens = ['我', '爱', '你'];
    const tgtX0 = rx + (rw - (tgtTokens.length * (tw + gap) - gap)) / 2;
    const tgtY = ry + 62;
    tgtTokens.forEach((t, i) => {
      const x = tgtX0 + i * (tw + gap);
      roundRect(x, tgtY, tw, th, 6); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#a8553a'; ctx.lineWidth = 1.5; roundRect(x, tgtY, tw, th, 6); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t, x + tw/2, tgtY + th/2 + 5);
      // 噪声标记
      ctx.fillStyle = '#a8553a';
      ctx.beginPath(); ctx.arc(x + tw - 6, tgtY + 6, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#a8553a'; ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('→ 加噪 z_t → 网络还原 → x̂₀', rx + rw/2, tgtY + th + 22);

    // ===== 中间：网络 =====
    const nx = 372, ny = 110, nw = 56, nh = 56;
    roundRect(nx, ny, nw, nh, 8); ctx.fillStyle = '#5b7a8c'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ELF', nx + nw/2, ny + nh/2 + 5);
    // 网络→下方损失
    ctx.fillStyle = '#5b7a8c'; ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.fillText('net', nx + nw/2, ny - 6);

    // 左→网络（条件输入）
    arrow(lx + lw, ly + lh/2, nx, ny + nh/2, '#4a7a3a', 2);
    ctx.fillStyle = '#4a7a3a'; ctx.font = '10.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('h', (lx + lw + nx) / 2, ly + lh/2 - 6);
    // 右→网络（噪声输入）
    arrow(rx, ry + rh/2, nx + nw, ny + nh/2, '#a8553a', 2);
    ctx.fillStyle = '#a8553a'; ctx.font = '10.5px "Microsoft YaHei", sans-serif';
    ctx.fillText('z_t', (rx + nx + nw) / 2, ry + rh/2 - 6);

    // 底部说明
    ctx.fillStyle = '#5a5a5a';
    ctx.font = '11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('网络看源文当提示，学还原译文（关联 §1 清洁→噪声→还原）', W/2, H - 12);
  }
  draw();
})();

/* ---------- 公式展开讲解卡片 ---------- */
function initFxCards() {
  // 立即绘制所有 canvas
  drawAllFxCanvas();
}

function drawAllFxCanvas() {
  $qa('canvas[data-lazy="1"]').forEach(cvs => {
    // canvas id 是 fx-xxx，drawFx 函数名是 drawFx_fx_xxx（连字符→下划线）
    const fnName = 'drawFx_' + cvs.id.replace(/-/g, '_');
    const fn = window[fnName];
    if (typeof fn === 'function') {
      try { fn(cvs); } catch (err) { console.error(fnName + ' 错误:', err); }
    } else {
      console.warn('未找到绘制函数: ' + fnName);
    }
  });
}
// 用 IntersectionObserver：进入视口时重绘（避免被遮挡或 off-screen 时绘制失败）
if ('IntersectionObserver' in window) {
  const _fxIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const cvs = e.target;
        const fnName = 'drawFx_' + cvs.id.replace(/-/g, '_');
        const fn = window[fnName];
        if (typeof fn === 'function') {
          try { fn(cvs); } catch (err) { console.error(fnName + ' 错误:', err); }
        }
        _fxIO.unobserve(cvs);
      }
    });
  }, { threshold: 0.05 });
  $qa('canvas[data-lazy="1"]').forEach(cvs => _fxIO.observe(cvs));
}
initFxCards();

/* ---------- 9.2 logit-normal 采样分布可视化 ---------- */
(function() {
  const cv = $('cv-logit-normal');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const rng = $('rng-logit-mu');
  const lbl = $('lbl-logit-mu');
  const lblSigma = $('lbl-logit-sigma');

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function sampleLogitNormal(muLogit, stdLogit, n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const t = sigmoid(muLogit + stdLogit * z);
      arr.push(t);
    }
    return arr;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const muLogit = parseFloat(rng.value) / 10;  // -3..3
    const stdLogit = 0.8;
    const N = 4000;

    // 直方图
    const samples = sampleLogitNormal(muLogit, stdLogit, N);
    const bins = new Array(40).fill(0);
    samples.forEach(t => {
      const b = Math.min(39, Math.max(0, Math.floor(t * 40)));
      bins[b]++;
    });
    const maxB = Math.max(...bins);

    // 均匀分布对比（背景浅色）
    const uniformBins = new Array(40).fill(N / 40);
    const baseY = H - 68;   // 给 X 轴标签和底部文字留空间
    const barW = (W - 100) / 40;
    const startX = 60;
    const topY = 60;

    // 高亮 t≈0.3 区域（中等噪声，最难也最该练）
    const hlL = startX + 0.2 * (W - 100);
    const hlR = startX + 0.4 * (W - 100);
    ctx.fillStyle = 'rgba(168, 85, 58, 0.06)';
    ctx.fillRect(hlL, topY, hlR - hlL, baseY - topY);
    ctx.strokeStyle = 'rgba(168, 85, 58, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hlL, topY); ctx.lineTo(hlL, baseY);
    ctx.moveTo(hlR, topY); ctx.lineTo(hlR, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 均匀背景
    ctx.fillStyle = 'rgba(91, 122, 140, 0.15)';
    uniformBins.forEach((v, i) => {
      const h = (v / N) * (H - 110) * 6;
      ctx.fillRect(startX + i * barW, baseY - h, barW - 1, h);
    });

    // logit-normal 前景（带渐变）
    bins.forEach((v, i) => {
      const h = (v / maxB) * (H - 120);
      const x = startX + i * barW;
      const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
      grad.addColorStop(0, 'rgba(168, 85, 58, 0.85)');
      grad.addColorStop(1, 'rgba(168, 85, 58, 0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, baseY - h, barW - 1, h);
    });

    // Y 轴
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, topY);
    ctx.lineTo(startX, baseY);
    ctx.stroke();
    // X 轴
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.lineTo(W - 40, baseY);
    ctx.stroke();
    // Y 轴标签（竖排）
    ctx.save();
    ctx.translate(20, (topY + baseY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#5a5a5a';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('抽中概率（高=多练）', 0, 0);
    ctx.restore();
    // X 轴刻度
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const x = startX + (i / 10) * (W - 100);
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY + 4);
      ctx.stroke();
      ctx.fillText((i / 10).toFixed(1), x, baseY + 16);
    }
    ctx.fillStyle = '#5a5a5a';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.fillText('噪声量 t（0=清晰，1=纯噪声）', (startX + W - 40) / 2, baseY + 33);

    // 中心线（t*）
    const tStar = sigmoid(muLogit);
    const cx = startX + tStar * (W - 100);
    ctx.strokeStyle = '#4a7a3a';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    // t* 标签（带背景）
    const tStarText = 't* = ' + tStar.toFixed(2);
    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
    const tw = ctx.measureText(tStarText).width;
    roundRect(cx + 6, topY + 4, tw + 16, 22, 4);
    ctx.fillStyle = '#4a7a3a'; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(tStarText, cx + 14, topY + 19);

    // 高亮区域标注
    ctx.fillStyle = '#a8553a';
    ctx.font = 'bold 10.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('中等噪声', (hlL + hlR) / 2, topY + 14);
    ctx.fillStyle = '#8a5a4a';
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.fillText('最难猜，多练', (hlL + hlR) / 2, topY + 28);

    // 顶部图示标注
    ctx.fillStyle = '#5b7a8c';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('■ 均匀（ELF 处处等概率）', W - 220, topY + 14);
    ctx.fillStyle = '#a8553a';
    ctx.fillText('■ logit-normal（其他模型常用）', W - 220, topY + 30);

    // 底部说明
    ctx.fillStyle = '#5a5a5a';
    ctx.font = '11.5px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('训练时每个 batch 随机抽一个 t 值来训练', W/2, H - 12);

    if (lbl) lbl.textContent = muLogit.toFixed(1);
    if (lblSigma) lblSigma.textContent = 'logit-normal 峰值 ≈ ' + tStar.toFixed(2) + '（对比）';
  }

  rng.addEventListener('input', draw);
  draw();
})();

/* ---------- 进入视口时重绘所有 data-lazy canvas（兜底） ---------- */
// 上述 drawAllFxCanvas 在 DOMContentLoaded 时跑，但若 §8/§10/§12 等离屏，
// 浏览器可能跳过 paint。IntersectionObserver 兜底，进入视口时强制重绘。
if ('IntersectionObserver' in window) {
  const _fxIO2 = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const cvs = e.target;
      const fnName = 'drawFx_' + cvs.id.replace(/-/g, '_');
      const fn = window[fnName];
      if (typeof fn === 'function') {
        try { fn(cvs); } catch (err) { /* swallow */ }
      }
      _fxIO2.unobserve(cvs);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -10% 0px' });
  $qa('canvas[data-lazy="1"]').forEach(cvs => _fxIO2.observe(cvs));
}

/* ================================================================
   图形化类比动画 (10个canvas)
   ================================================================ */
(function() {
  function startAna(id, drawFn) {
    const cv = $(id);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let rafId = null;
    let phase = 0; // 0-1 global progress (loop)
    let lastT = 0;
    let running = false;

    function loop(ts) {
      if (!running) return;
      if (!lastT) lastT = ts;
      const dt = (ts - lastT) / 1000;
      lastT = ts;
      phase += dt * 0.35; // speed
      if (phase > 1) phase -= 1;
      drawFn(ctx, W, H, phase);
      rafId = requestAnimationFrame(loop);
    }

    function play() {
      running = true;
      lastT = 0;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }
    function reset() {
      phase = 0;
      lastT = 0;
      drawFn(ctx, W, H, 0);
    }

    cv.addEventListener('click', () => { phase = 0; lastT = 0; });

    // IntersectionObserver: play when visible
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { reset(); play(); }
        else { stop(); }
      });
    }, { threshold: 0.2 });
    io.observe(cv);

    reset();
  }

  function drawBrush(ctx, x, y, angle, tipColor, size) {
    size = size || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-2 * size, -18 * size, 5 * size, 12 * size);
    ctx.fillStyle = tipColor || '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-5 * size, -6 * size);
    ctx.lineTo(5 * size, -6 * size);
    ctx.lineTo(0, 12 * size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------- §1 ana-noise: 写"中国山水"→墨汁晕染盖字（加噪）→毛笔扫过还原（去噪） ---------- */
  startAna('ana-noise', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (var y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var chars = '中国山水';
    var cy = H / 2;
    var fSize = 34;
    var gap = 2;
    var charW = fSize + gap;
    var totalW = chars.length * charW;
    var x0 = (W - totalW) / 2 + charW / 2;
    var charPos = [];
    for (var i = 0; i < chars.length; i++) {
      charPos.push({ ch: chars[i], x: x0 + i * charW, y: cy });
    }

    /* 阶段划分 */
    var noiseT, denoiseT, phase;
    if (p < 0.08) { noiseT = 0; denoiseT = 0; phase = 'clean1'; }
    else if (p < 0.40) { noiseT = (p - 0.08) / 0.32; denoiseT = 0; phase = 'add'; }
    else if (p < 0.48) { noiseT = 1; denoiseT = 0; phase = 'noise'; }
    else if (p < 0.90) { noiseT = 1; denoiseT = (p - 0.48) / 0.42; phase = 'denoise'; }
    else { noiseT = 0; denoiseT = 1; phase = 'clean2'; }

    var inkT = noiseT * (1 - denoiseT); /* 墨汁覆盖度 0→1→0 */

    /* 画字：每个字透明度随墨汁覆盖变化 */
    ctx.font = 'bold ' + fSize + 'px "STKaiti","KaiTi","楷体",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    charPos.forEach(function(cp) {
      var charA;
      if (phase === 'noise') charA = 0.05;
      else if (phase === 'denoise') {
        var brushX = x0 - charW / 2 + denoiseT * totalW;
        charA = cp.x < brushX ? 0.05 + Math.min(1, (brushX - cp.x) / charW) * 0.95 : 0.05;
      }
      else if (phase === 'add') charA = 1 - noiseT * 0.95;
      else charA = 1;
      ctx.save();
      ctx.globalAlpha = charA;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(cp.ch, cp.x, cp.y);
      ctx.restore();
    });

    /* 大面积墨汁晕染：多个不规则墨团从各字位置扩散合并 */
    if (inkT > 0.01) {
      ctx.save();
      /* 去噪阶段：毛笔扫过的区域墨汁消退 */
      var brushX = phase === 'denoise' ? (x0 - charW / 2 + denoiseT * totalW) : -999;
      /* 生成墨团中心点 */
      var blobs = [];
      for (var i = 0; i < chars.length; i++) {
        blobs.push({ x: charPos[i].x, y: charPos[i].y });
      }
      blobs.push({ x: x0 + totalW * 0.3, y: cy - 8 });
      blobs.push({ x: x0 + totalW * 0.7, y: cy + 6 });

      blobs.forEach(function(b) {
        /* 墨团半径随inkT增大 */
        var baseR = charW * 0.55;
        var r = baseR * (0.2 + inkT * 0.8);
        /* 去噪阶段：毛笔扫过后墨团缩小 */
        var fade = 1;
        if (phase === 'denoise' && b.x < brushX) {
          fade = Math.max(0, 1 - (brushX - b.x) / (charW * 1.5));
        }
        if (fade < 0.02) return;
        /* 用径向渐变模拟墨汁晕染 */
        var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        grad.addColorStop(0, 'rgba(15,15,20,' + (0.85 * fade) + ')');
        grad.addColorStop(0.5, 'rgba(20,20,28,' + (0.55 * fade) + ')');
        grad.addColorStop(0.8, 'rgba(25,25,35,' + (0.25 * fade) + ')');
        grad.addColorStop(1, 'rgba(25,25,35,0)');
        ctx.fillStyle = grad;
        /* 不规则边缘：画多个偏移圆叠加 */
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
        /* 小偏移墨晕增加不规则感 */
        for (var k = 0; k < 4; k++) {
          var offA = k * 1.57 + b.x * 0.01;
          var offD = r * 0.3;
          var ox = b.x + Math.cos(offA) * offD;
          var oy = b.y + Math.sin(offA) * offD;
          var grad2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 0.6);
          grad2.addColorStop(0, 'rgba(15,15,20,' + (0.4 * fade) + ')');
          grad2.addColorStop(1, 'rgba(25,25,35,0)');
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(ox, oy, r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    /* 去噪阶段：毛笔从左到右扫过 */
    if (phase === 'denoise' && denoiseT > 0.02 && denoiseT < 0.99) {
      var bx = x0 - charW / 2 + denoiseT * totalW;
      var by = cy + Math.sin(denoiseT * Math.PI) * 5;
      ctx.save();
      ctx.strokeStyle = 'rgba(22,163,74,0.18)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - charW / 2, cy);
      for (var t = 0; t <= denoiseT; t += 0.04) {
        ctx.lineTo(x0 - charW / 2 + t * totalW, cy + Math.sin(t * Math.PI) * 5);
      }
      ctx.stroke();
      ctx.restore();
      drawBrush(ctx, bx, by, Math.PI / 2, '#16a34a', 0.8);
    }

    /* 底部标签 */
    ctx.font = '9px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    var label;
    if (phase === 'clean1') label = '✍ 中国山水';
    else if (phase === 'add') label = '💧 墨汁晕染盖字（加噪）';
    else if (phase === 'noise') label = '🌀 满纸墨（纯噪声）';
    else if (phase === 'denoise') label = '🖌 毛笔扫过还原（去噪）';
    else label = '✨ 字迹清晰';
    ctx.fillText(label, 8, H - 5);
  });

  /* ---------- §2 ana-embed: 毛笔蘸墨→送字入格，同类字同色聚集 ---------- */
  startAna('ana-embed', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);

    /* 三类字，每类一个颜色 */
    var cats = [
      { name: '山', color: '#16a34a', light: '#dcfce7', items: ['山', '峰', '岭'] },
      { name: '水', color: '#2563eb', light: '#dbeafe', items: ['水', '江', '河'] },
      { name: '林', color: '#dc2626', light: '#fee2e2', items: ['林', '树', '木'] },
    ];

    var gridSize = 32, gridGap = 6;
    var cols = 3, rows = 3;
    var totalW = cols * gridSize + (cols - 1) * gridGap;
    var totalH = rows * gridSize + (rows - 1) * gridGap;
    var gx0 = (W - totalW) / 2, gy0 = 8;

    /* 3x3 网格，每行一类 */
    var grid = [];
    for (var ci = 0; ci < cats.length; ci++) {
      for (var i = 0; i < cats[ci].items.length; i++) {
        grid.push({ ch: cats[ci].items[i], r: ci, c: i, color: cats[ci].color, light: cats[ci].light });
      }
    }

    /* 画格子 */
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = gx0 + c * (gridSize + gridGap);
        var y = gy0 + r * (gridSize + gridGap);
        ctx.strokeStyle = '#c9b88a'; ctx.lineWidth = 1;
        ctx.strokeRect(x, y, gridSize, gridSize);
        ctx.strokeStyle = '#e4d9b8'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y + gridSize / 2); ctx.lineTo(x + gridSize, y + gridSize / 2);
        ctx.moveTo(x + gridSize / 2, y); ctx.lineTo(x + gridSize / 2, y + gridSize);
        ctx.moveTo(x, y); ctx.lineTo(x + gridSize, y + gridSize);
        ctx.moveTo(x + gridSize, y); ctx.lineTo(x, y + gridSize);
        ctx.stroke();
      }
    }

    /* 行标签（类别名） */
    ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var ci = 0; ci < cats.length; ci++) {
      var ly = gy0 + ci * (gridSize + gridGap) + gridSize / 2;
      ctx.fillStyle = cats[ci].color;
      ctx.fillText(cats[ci].name, gx0 - 5, ly);
    }

    /* 墨池 */
    var inkPool = { x: W / 2, y: H - 16 };
    ctx.fillStyle = 'rgba(25,25,30,0.8)';
    ctx.beginPath();
    ctx.ellipse(inkPool.x, inkPool.y, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b7280'; ctx.font = '7px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('墨池', inkPool.x, inkPool.y - 10);

    /* 逐字送入 */
    var itemDur = 0.10;
    var curItem = Math.floor(p / itemDur);
    var curItemT = (p % itemDur) / itemDur;
    if (curItem >= grid.length) { curItem = grid.length - 1; curItemT = 1; }

    for (var i = 0; i <= curItem; i++) {
      var g = grid[i];
      var tx = gx0 + g.c * (gridSize + gridGap) + gridSize / 2;
      var ty = gy0 + g.r * (gridSize + gridGap) + gridSize / 2;
      var it = i < curItem ? 1 : curItemT;
      var ease = 1 - Math.pow(1 - it, 3);

      /* 毛笔运墨动画 */
      if (i === curItem && it < 0.95) {
        var dipT = Math.min(1, it / 0.3);
        var carryT = Math.max(0, (it - 0.25) / 0.75);
        var bx, by;
        if (dipT < 1) {
          bx = inkPool.x;
          by = inkPool.y - 4 - dipT * 4;
        } else {
          bx = inkPool.x + (tx - inkPool.x) * ease;
          by = inkPool.y - 12 + (ty - (inkPool.y - 12)) * ease;
        }
        var ddx = tx - bx, ddy = ty - by;
        var brAng = Math.atan2(ddy, ddx) + Math.PI / 2;
        drawBrush(ctx, bx, by, brAng, g.color, 0.75);
        if (carryT > 0.1) {
          ctx.fillStyle = g.color;
          ctx.beginPath(); ctx.arc(bx, by + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      /* 字落格 */
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (it >= 0.85) {
        var formT = (it - 0.85) / 0.15;
        ctx.globalAlpha = formT;
        /* 同类底色高亮 */
        ctx.fillStyle = g.light;
        var gx = gx0 + g.c * (gridSize + gridGap);
        var gy = gy0 + g.r * (gridSize + gridGap);
        ctx.fillRect(gx, gy, gridSize, gridSize);
        /* 同类边框 */
        ctx.strokeStyle = g.color; ctx.lineWidth = 1.5;
        ctx.strokeRect(gx, gy, gridSize, gridSize);
        /* 字 */
        ctx.fillStyle = g.color;
        ctx.font = 'bold 17px "STKaiti","KaiTi","楷体",serif';
        ctx.fillText(g.ch, tx, ty);
      } else if (it > 0.1) {
        /* 运输中的墨点用类别色 */
        ctx.fillStyle = g.color;
        var px = inkPool.x + (tx - inkPool.x) * ease;
        var py = inkPool.y - 8 + (ty - (inkPool.y - 8)) * ease;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    /* 底部标签 */
    ctx.font = '8px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    ctx.fillText(p < 0.95 ? '🖌 同类字同色归行...' : '✨ 同类聚拢（嵌入完成）！', 8, H - 5);
  });

  /* ---------- §3 ana-path: 干净字→噪声直线加噪→原路绿笔回程 ---------- */
  startAna('ana-path', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (var y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var rad = 22;
    var sx = 36, sy = H / 2;
    var ex = W - 36, ey = H / 2;

    /* 左：干净字 */
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 20px "STKaiti","KaiTi","楷体",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('字', sx, sy);
    ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.fillStyle = '#166534';
    ctx.fillText('干净', sx, sy + rad + 10);

    /* 右：纯噪声墨团 */
    ctx.fillStyle = '#fecaca';
    ctx.beginPath(); ctx.arc(ex, ey, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2; ctx.stroke();
    for (var i = 0; i < 7; i++) {
      var a = i * Math.PI * 2 / 7 + 0.3;
      ctx.fillStyle = 'rgba(20,20,28,0.6)';
      ctx.beginPath(); ctx.arc(ex + Math.cos(a) * 7, ey + Math.sin(a) * 5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.fillStyle = '#991b1b';
    ctx.fillText('噪声', ex, ey + rad + 10);

    /* 阶段：去程0→0.42，停0.42→0.50，回程0.50→0.92 */
    var t, dir, isReturn;
    if (p < 0.42) { t = p / 0.42; dir = 1; isReturn = false; }
    else if (p < 0.50) { t = 1; dir = 0; isReturn = false; }
    else if (p < 0.92) { t = 1 - (p - 0.50) / 0.42; dir = -1; isReturn = true; }
    else { t = 0; dir = 0; isReturn = false; }

    /* 笔位置：限制在两圆边缘之间 */
    var bx = sx + (ex - sx) * t;
    var by = sy;

    /* 去程：黑色墨痕从干净字边缘到笔位置 */
    if (dir > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(20,20,28,0.65)';
      ctx.lineWidth = 2 + t * 5;
      ctx.beginPath();
      ctx.moveTo(sx + rad, sy);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }

    /* 回程：绿色笔痕从噪声端边缘到笔位置 */
    if (isReturn) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(22,163,74,0.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ex - rad, sy);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }

    /* 毛笔 */
    var tipColor = isReturn ? '#16a34a' : '#1a1a1a';
    var bAng = dir > 0 ? 0 : dir < 0 ? Math.PI : Math.PI / 2;
    drawBrush(ctx, bx, by, bAng, tipColor, 0.85);

    /* 速度箭头 */
    if (dir !== 0) {
      var ax = bx + dir * 20, ay = by - 18;
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + dir * 5, by - 15); ctx.lineTo(ax, ay);
      ctx.moveTo(ax, ay); ctx.lineTo(ax - dir * 4, ay - 3);
      ctx.lineTo(ax - dir * 4, ay + 3); ctx.stroke();
      ctx.fillStyle = '#2563eb'; ctx.font = 'bold 10px Consolas'; ctx.textAlign = 'center';
      ctx.fillText('v', ax, ay - 7);
    }

    /* 底部标签 */
    ctx.font = '8px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    var label;
    if (p < 0.42) label = '→ 去程加噪：直行到噪声端';
    else if (p < 0.50) label = '满纸墨（纯噪声）';
    else if (p < 0.92) label = '← 回程去噪：原路绿笔回干净字';
    else label = '✓ 回到干净字！';
    ctx.fillText(label, 8, H - 5);
  });

  /* ---------- §4 ana-flow: 毛笔波浪路径从右写到左，留绿痕吸墨点 ---------- */
  startAna('ana-flow', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    const cy = H / 2;
    const target = { x: 55, y: cy };
    const noiseArea = { x: W - 55, y: cy };

    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath(); ctx.rect(target.x - 20, target.y - 20, 40, 40); ctx.fill();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5; ctx.strokeRect(target.x - 20, target.y - 20, 40, 40);
    ctx.strokeStyle = '#86efac'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(target.x - 20, target.y); ctx.lineTo(target.x + 20, target.y);
    ctx.moveTo(target.x, target.y - 20); ctx.lineTo(target.x, target.y + 20); ctx.stroke();

    ctx.fillStyle = 'rgba(220,38,38,0.1)';
    ctx.beginPath(); ctx.arc(noiseArea.x, noiseArea.y, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(220,38,38,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#991b1b'; ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('散墨(噪声)', noiseArea.x, noiseArea.y + 38);

    const t = Math.min(1, p / 0.9);

    if (t > 0.05) {
      ctx.save();
      ctx.strokeStyle = 'rgba(22,163,74,0.35)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps * t; i++) {
        const ti = i / steps;
        const x = noiseArea.x + (target.x - noiseArea.x) * ti;
        const y = cy + Math.sin(ti * 12) * 8;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    const bx = noiseArea.x + (target.x - noiseArea.x) * t;
    const by = cy + Math.sin(t * 12) * 8;

    const nDots = 22;
    for (let i = 0; i < nDots; i++) {
      const seed = i * 73.3 + 99;
      const sa = (Math.sin(seed) * 10000) % (Math.PI * 2);
      const sr = 5 + Math.abs(Math.cos(seed * 2.1)) * 22;
      const sx = noiseArea.x + Math.cos(sa) * sr;
      const sy = noiseArea.y + Math.sin(sa) * sr * 0.8;
      const ta = (Math.sin(seed * 3.1) * 10000) % (Math.PI * 2);
      const tr = 4 + Math.abs(Math.cos(seed * 1.3)) * 14;
      const tx = target.x + Math.cos(ta) * tr;
      const ty = target.y + Math.sin(ta) * tr * 0.9;
      const delay = i * 0.012;
      const dt = Math.max(0, Math.min(1, (t - delay) / (1 - delay + 0.05)));
      const de = 1 - Math.pow(1 - dt, 2);
      const dx = sx + (tx - sx) * de;
      const dy = sy + (ty - sy) * de;
      const distToB = Math.sqrt((dx - bx)*(dx - bx) + (dy - by)*(dy - by));
      if (distToB < 22) continue;
      const sz = 2.5 - dt * 0.8;
      ctx.fillStyle = 'rgba(25,25,30,' + (0.5 + dt * 0.3) + ')';
      ctx.beginPath(); ctx.arc(dx, dy, sz, 0, Math.PI * 2); ctx.fill();
    }

    if (t > 0.02 && t < 0.98) {
      const bAng = Math.atan2(Math.cos(t * 12) * 12 * 8 / (target.x - noiseArea.x), -1) + Math.PI / 2;
      drawBrush(ctx, bx, by, bAng, '#16a34a', 1);
    }

    if (t > 0.85) {
      const ca = (t - 0.85) / 0.15;
      ctx.globalAlpha = ca;
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 22px "STKaiti","KaiTi","楷体",serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('字', target.x, target.y);
      ctx.globalAlpha = 1;
    }

    ctx.font = '10px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    ctx.fillText(t < 1 ? '🖌 绿笔走波浪，散墨被吸收归字...' : '✨ 墨点归位成字！', 8, H - 6);
  });

  /* ---------- §5 ana-cfg: ω增大→灰笔乱写被CFG红箭头拉向蓝笔正路 ---------- */
  startAna('ana-cfg', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (let y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var sx = 30, sy = H / 2;
    var tx = W - 38, ty = H / 2;

    /* 字帖（条件） */
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath(); ctx.roundRect(tx - 17, ty - 17, 34, 34, 4); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.strokeRect(tx - 17, ty - 17, 34, 34);
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 20px "STKaiti","KaiTi","楷体",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('永', tx, ty);
    ctx.font = '7px "Microsoft YaHei"'; ctx.fillStyle = '#991b1b';
    ctx.fillText('字帖=条件', tx, ty + 25);

    ctx.fillStyle = '#6b7280'; ctx.font = '7px "Microsoft YaHei"';
    ctx.fillText('噪声起点', sx, sy + 22);

    /* ω 随 p 增长 0→4.5 */
    var omega = p < 0.15 ? 0 : Math.min(4.5, (p - 0.15) * 5.5);
    var w = omega / 4.5;

    /* 幽灵路径：无条件（灰·波浪） */
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (var i = 0; i <= 40; i++) {
      var ti = i / 40;
      var gx = sx + (tx - sx) * ti;
      var gy = sy + Math.sin(ti * 7) * 18;
      i === 0 ? ctx.moveTo(gx, gy) : ctx.lineTo(gx, gy);
    }
    ctx.stroke();

    /* 幽灵路径：有条件（蓝·直线） */
    ctx.strokeStyle = 'rgba(37,99,235,0.35)';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, sy); ctx.stroke();
    ctx.setLineDash([]);

    /* 实际路径：随 ω 从波浪→直线 */
    var prog = Math.min(1, p / 0.88);
    var r = Math.round(148 + (37 - 148) * w);
    var g = Math.round(163 + (99 - 163) * w);
    var b = Math.round(184 + (235 - 184) * w);
    ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 40; i++) {
      var ti = i / 40;
      if (ti > prog) break;
      var ax = sx + (tx - sx) * ti;
      var ay = sy + Math.sin(ti * 7) * 18 * (1 - w);
      i === 0 ? ctx.moveTo(ax, ay) : ctx.lineTo(ax, ay);
    }
    ctx.stroke();

    /* CFG 拉力箭头 */
    if (omega > 0.5 && prog < 1) {
      var ax = sx + (tx - sx) * prog;
      var ay = sy + Math.sin(prog * 7) * 18 * (1 - w);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, sy); ctx.stroke();
      ctx.setLineDash([]);
      var down = ay > sy;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(ax, sy + (down ? -4 : 4));
      ctx.lineTo(ax - 4, sy + (down ? -10 : 10));
      ctx.lineTo(ax + 4, sy + (down ? -10 : 10));
      ctx.closePath(); ctx.fill();
      ctx.font = 'bold 7px "Microsoft YaHei"'; ctx.textAlign = 'left';
      ctx.fillText('CFG', ax + 4, (ay + sy) / 2);
    }

    /* 当前笔位置 */
    if (prog < 1) {
      var bx = sx + (tx - sx) * prog;
      var by = sy + Math.sin(prog * 7) * 18 * (1 - w);
      drawBrush(ctx, bx, by, Math.PI / 2, 'rgb(' + r + ',' + g + ',' + b + ')', 0.7);
    }

    /* ω 标签 */
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 9px Consolas'; ctx.textAlign = 'left';
    ctx.fillText('ω=' + omega.toFixed(1), 8, 13);

    /* 成功标记 */
    if (prog >= 1) {
      ctx.fillStyle = '#16a34a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✓', tx, ty - 23);
    }

    ctx.font = '8px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#6b7280';
    var label;
    if (p < 0.15) label = 'ω=0：不看帖，乱写';
    else if (p < 0.6) label = 'ω增大→CFG拉向正路';
    else label = '✓ ω够大：笔直到达字帖！';
    ctx.fillText(label, 8, H - 4);
  });

  /* ---------- §6 ana-sample: 两支真毛笔同时写，楷书蓝直线，草书橙波浪 ---------- */
  startAna('ana-sample', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    const start = { x: 25, y: 38 }, end = { x: W - 25, y: 95 };

    ctx.fillStyle = '#dbeafe'; ctx.fillRect(15, 18, W - 30, 25);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(15, 70, W - 30, 25);

    ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.textAlign = 'left';
    ctx.fillStyle = '#1d4ed8'; ctx.fillText('楷书 ODE（工整）', 20, 14);
    ctx.fillStyle = '#c2410c'; ctx.fillText('草书 SDE（随性）', 20, 66);

    const tO = Math.min(1, p * 1.4);
    const ox = start.x + (end.x - start.x) * tO;
    const oy = 31;

    const tS = Math.min(1, p * 1.05);
    const sx = start.x + (end.x - start.x) * tS;
    const sy = 83 + Math.sin(tS * 16) * 7;

    ctx.save();
    ctx.strokeStyle = 'rgba(37,99,235,0.5)';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40 * tO; i++) {
      const ti = i / 40;
      const x = start.x + (end.x - start.x) * ti;
      i === 0 ? ctx.moveTo(x, 31) : ctx.lineTo(x, 31);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(234,88,12,0.5)';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40 * tS; i++) {
      const ti = i / 40;
      const x = start.x + (end.x - start.x) * ti;
      const y = 83 + Math.sin(ti * 16) * 7;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    if (tO < 1) {
      drawBrush(ctx, ox, oy, 0, '#2563eb', 0.85);
    }
    if (tS < 1) {
      const sAng = Math.atan2(Math.cos(tS * 16) * 16 * 7 / (end.x - start.x), 1) - Math.PI / 2;
      drawBrush(ctx, sx, sy, sAng, '#ea580c', 0.85);
    }

    if (tO >= 1 && tS >= 1) {
      ctx.fillStyle = '#16a34a'; ctx.font = 'bold 20px "STKaiti","KaiTi","楷体",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('成', end.x, end.y - 15);
    }

    ctx.font = '10px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    if (tO >= 1 && tS >= 1) ctx.fillText('都写完！楷书工整 草书挥洒', 8, H - 5);
    else if (tO >= 1) ctx.fillText('楷书已成，草书还在挥洒...', 8, H - 5);
    else ctx.fillText('两支毛笔同时落笔...', 8, H - 5);
  });

  /* ---------- §7 ana-train: 练字——模糊散影逐渐收敛成清晰"永"字 ---------- */
  startAna('ana-train', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (var y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var cx = W / 2, cy = H / 2 + 6;
    var fs = 42;
    var trainT = Math.min(1, p / 0.88);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* 米字格 */
    var gs = 58;
    ctx.fillStyle = 'rgba(255,254,248,0.6)';
    ctx.fillRect(cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.strokeStyle = 'rgba(220,38,38,0.2)'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - gs / 2, cy - gs / 2); ctx.lineTo(cx + gs / 2, cy + gs / 2);
    ctx.moveTo(cx + gs / 2, cy - gs / 2); ctx.lineTo(cx - gs / 2, cy + gs / 2);
    ctx.moveTo(cx, cy - gs / 2); ctx.lineTo(cx, cy + gs / 2);
    ctx.moveTo(cx - gs / 2, cy); ctx.lineTo(cx + gs / 2, cy);
    ctx.stroke();

    /* 目标"永"字（浅灰底字） */
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold ' + fs + 'px "STKaiti","KaiTi","楷体",serif';
    ctx.fillText('永', cx, cy);
    ctx.restore();

    /* 练习效果：多个ghost副本散开→收敛 */
    /* 散布半径从大→0，副本数从多→1 */
    var spread = (1 - trainT) * 18;
    var ghosts = Math.max(1, Math.round((1 - trainT) * 7) + 1);
    var cr = Math.round(30 + (22 - 30) * trainT);
    var cg = Math.round(30 + (163 - 30) * trainT);
    var cb = Math.round(30 + (74 - 30) * trainT);
    var alpha = 0.2 + trainT * 0.7;

    ctx.save();
    ctx.font = 'bold ' + fs + 'px "STKaiti","KaiTi","楷体",serif';
    /* 先画ghost副本（散开的） */
    if (trainT < 0.9) {
      for (var g = 0; g < ghosts; g++) {
        var seed = g * 23.7 + 11;
        var gx = cx + Math.sin(seed) * spread;
        var gy = cy + Math.cos(seed * 1.3) * spread * 0.7;
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (alpha / ghosts * 0.6) + ')';
        ctx.fillText('永', gx, gy);
      }
    }
    /* 主字：逐渐清晰 */
    ctx.globalAlpha = 0.3 + trainT * 0.6;
    ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')';
    ctx.fillText('永', cx, cy);
    ctx.restore();

    /* 损失曲线（右上角） */
    var lx = W - 54, ly = 6, lw = 48, lh = 30;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.5;
    ctx.strokeRect(lx, ly, lw, lh);
    /* 曲线 */
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 24; i++) {
      var tt = i / 24;
      var loss = Math.exp(-tt * 3.2) * (1 - trainT * 0.95) + 0.04;
      var px2 = lx + 2 + tt * (lw - 4);
      var py2 = ly + lh - 2 - loss * (lh - 4) * 0.85;
      i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    /* 当前点 */
    var curX = lx + 2 + trainT * (lw - 4);
    var curLoss = Math.exp(-trainT * 3.2) * (1 - trainT * 0.95) + 0.04;
    var curY = ly + lh - 2 - curLoss * (lh - 4) * 0.85;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(curX, curY, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 7px "Microsoft YaHei"'; ctx.textAlign = 'left';
    ctx.fillText('loss', lx + 3, ly + 9);

    /* iter 计数 */
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 9px Consolas'; ctx.textAlign = 'left';
    ctx.fillText('iter ' + Math.floor(trainT * 100), 8, 13);

    /* 底部标签 */
    ctx.font = '8px "Microsoft YaHei"'; ctx.fillStyle = '#92400e';
    var label;
    if (trainT < 0.3) label = '下笔散、字形糊（黑=不准）';
    else if (trainT < 0.65) label = '越练越准，散影收敛变绿...';
    else label = '✓ 笔笔到位，"永"字清晰！';
    ctx.fillText(label, 8, H - 4);
  });

  /* ---------- §8 ana-share: 一支毛笔两个用途——去噪+选词共享权重 ---------- */
  startAna('ana-share', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (var y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var cx = W / 2, cy = H / 2;
    var ix = 28, iy = cy;
    var ox1 = W - 34, oy1 = cy - 26;
    var ox2 = W - 34, oy2 = cy + 26;

    /* 左：噪声输入 */
    ctx.fillStyle = '#fecaca';
    ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.stroke();
    for (var i = 0; i < 5; i++) {
      var a = i * Math.PI * 2 / 5 + 0.4;
      ctx.fillStyle = 'rgba(20,20,28,0.5)';
      ctx.beginPath(); ctx.arc(ix + Math.cos(a) * 5, iy + Math.sin(a) * 4, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#991b1b'; ctx.font = 'bold 8px "Microsoft YaHei"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('噪声 x_t', ix, iy + 24);

    /* 中：共享网络 */
    var pulse = 1 + Math.sin(p * Math.PI * 5) * 0.05;
    var nr = 30 * pulse;
    /* 外圈光晕 */
    var grad = ctx.createRadialGradient(cx, cy, nr * 0.6, cx, cy, nr * 1.4);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, nr * 1.4, 0, Math.PI * 2); ctx.fill();
    /* 主圆 */
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath(); ctx.arc(cx, cy, nr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();
    /* 内圈装饰 */
    ctx.strokeStyle = 'rgba(99,102,241,0.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(cx, cy, nr - 6, 0, Math.PI * 2); ctx.stroke();

    /* 中心毛笔 */
    drawBrush(ctx, cx, cy - 4, Math.PI / 2, '#1a1a1a', 0.9);

    ctx.fillStyle = '#4338ca'; ctx.font = 'bold 8px "Microsoft YaHei"'; ctx.textAlign = 'center';
    ctx.fillText('共享网络 θ', cx, cy + 40);

    /* 输入箭头 + 流动数据点 */
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ix + 14, iy); ctx.lineTo(cx - nr, iy); ctx.stroke();
    /* 箭头头 */
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(cx - nr, iy); ctx.lineTo(cx - nr - 5, iy - 3); ctx.lineTo(cx - nr - 5, iy + 3);
    ctx.fill();
    if (p > 0.05) {
      var dotP = (p * 1.6) % 1;
      var dx = ix + 14 + (cx - nr - ix - 14) * dotP;
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(dx, iy, 3, 0, Math.PI * 2); ctx.fill();
    }

    /* 右上：修笔画 MSE（t<1 去噪） */
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath(); ctx.roundRect(ox1 - 26, oy1 - 12, 52, 24, 6); ctx.fill();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#166534'; ctx.font = 'bold 9px "Microsoft YaHei"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('修笔画', ox1, oy1 - 3);
    ctx.font = '7px Consolas'; ctx.fillStyle = '#15803d';
    ctx.fillText('MSE  t<1', ox1, oy1 + 8);

    /* 右下：写正字 CE（t=1 选词） */
    ctx.fillStyle = '#f3e8ff';
    ctx.beginPath(); ctx.roundRect(ox2 - 26, oy2 - 12, 52, 24, 6); ctx.fill();
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#6b21a8'; ctx.font = 'bold 9px "Microsoft YaHei"';
    ctx.fillText('写正字', ox2, oy2 - 3);
    ctx.font = '7px Consolas'; ctx.fillStyle = '#7e22ce';
    ctx.fillText('CE  t=1', ox2, oy2 + 8);

    /* 输出箭头 + 流动点 */
    if (p > 0.25) {
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + nr * 0.8, cy - nr * 0.5);
      ctx.lineTo(ox1 - 26, oy1);
      ctx.stroke();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(ox1 - 26, oy1); ctx.lineTo(ox1 - 21, oy1 - 3); ctx.lineTo(ox1 - 21, oy1 + 3);
      ctx.fill();
      var dp1 = ((p - 0.25) * 1.8) % 1;
      var sx1 = cx + nr * 0.8, sy1 = cy - nr * 0.5;
      var dx1 = sx1 + (ox1 - 26 - sx1) * dp1;
      var dy1 = sy1 + (oy1 - sy1) * dp1;
      ctx.beginPath(); ctx.arc(dx1, dy1, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (p > 0.45) {
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + nr * 0.8, cy + nr * 0.5);
      ctx.lineTo(ox2 - 26, oy2);
      ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(ox2 - 26, oy2); ctx.lineTo(ox2 - 21, oy2 - 3); ctx.lineTo(ox2 - 21, oy2 + 3);
      ctx.fill();
      var dp2 = ((p - 0.45) * 1.8) % 1;
      var sx2 = cx + nr * 0.8, sy2 = cy + nr * 0.5;
      var dx2 = sx2 + (ox2 - 26 - sx2) * dp2;
      var dy2 = sy2 + (oy2 - sy2) * dp2;
      ctx.beginPath(); ctx.arc(dx2, dy2, 3, 0, Math.PI * 2); ctx.fill();
    }

    /* θ 共享标注 */
    ctx.fillStyle = '#4338ca'; ctx.font = 'bold 10px Consolas'; ctx.textAlign = 'center';
    ctx.fillText('θ', cx, cy - 20);

    /* 底部标签 */
    ctx.font = '8px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#4338ca';
    var label;
    if (p < 0.25) label = '噪声 x_t 送入共享网络...';
    else if (p < 0.6) label = '同一组权重 θ：去噪 + 选词';
    else label = '权重共享，一笔两用！';
    ctx.fillText(label, 8, H - 4);
  });

  /* ---------- §9 ana-cook: 自条件——写每笔前先看上一笔 ---------- */
  startAna('ana-cook', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ece2c8'; ctx.lineWidth = 0.6;
    for (var y = 14; y < H - 14; y += 13) {
      ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke();
    }

    var cx = W / 2, cy = H / 2 + 4;
    var fs = 44;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* 米字格 */
    var gs = 62;
    ctx.fillStyle = 'rgba(255,254,248,0.6)';
    ctx.fillRect(cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.strokeStyle = 'rgba(220,38,38,0.2)'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - gs / 2, cy - gs / 2); ctx.lineTo(cx + gs / 2, cy + gs / 2);
    ctx.moveTo(cx + gs / 2, cy - gs / 2); ctx.lineTo(cx - gs / 2, cy + gs / 2);
    ctx.moveTo(cx, cy - gs / 2); ctx.lineTo(cx, cy + gs / 2);
    ctx.moveTo(cx - gs / 2, cy); ctx.lineTo(cx + gs / 2, cy);
    ctx.stroke();

    /* 目标"永"字底字 */
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold ' + fs + 'px "STKaiti","KaiTi","楷体",serif';
    ctx.fillText('永', cx, cy);
    ctx.restore();

    /* 6阶段：准备→写上1/3→回看→写中1/3→回看→写下1/3 */
    var phase;
    if (p < 0.06) phase = 0;
    else if (p < 0.24) phase = 1;
    else if (p < 0.34) phase = 2;
    else if (p < 0.52) phase = 3;
    else if (p < 0.62) phase = 4;
    else if (p < 0.82) phase = 5;
    else phase = 6;

    /* 三段的y范围（从上到下） */
    var topY = cy - gs / 2;
    var botY = cy + gs / 2;
    var h3 = (botY - topY) / 3;
    var bands = [
      { y0: topY,           y1: topY + h3 },         /* 上 */
      { y0: topY + h3,      y1: topY + h3 * 2 },     /* 中 */
      { y0: topY + h3 * 2,  y1: botY },              /* 下 */
    ];

    /* 各段进度 */
    var bP = [0, 0, 0];
    if (phase >= 2) bP[0] = 1;
    else if (phase === 1) bP[0] = (p - 0.06) / 0.18;
    if (phase >= 4) bP[1] = 1;
    else if (phase === 3) bP[1] = (p - 0.34) / 0.18;
    if (phase >= 6) bP[2] = 1;
    else if (phase === 5) bP[2] = (p - 0.62) / 0.20;

    var lookBack = (phase === 2 || phase === 4);

    /* 回看高亮：蓝色闪烁覆盖已写区域 */
    if (lookBack) {
      var flashAlpha = 0.12 + 0.10 * Math.sin(p * 35);
      ctx.save();
      ctx.fillStyle = 'rgba(59,130,246,' + flashAlpha + ')';
      if (phase === 2) {
        ctx.fillRect(cx - gs / 2, bands[0].y0, gs, bands[0].y1 - bands[0].y0);
      } else {
        ctx.fillRect(cx - gs / 2, bands[0].y0, gs, bands[1].y1 - bands[0].y0);
      }
      ctx.restore();

      /* 👀 眼睛 */
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var eyeY = phase === 2 ? (bands[0].y0 + bands[0].y1) / 2 : (bands[1].y0 + bands[1].y1) / 2;
      ctx.fillText('👀', cx + gs / 2 + 12, eyeY);

      /* 回看虚线弧 */
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(cx + gs / 2 + 2, eyeY, 10, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* 画已写部分（用clip裁剪显示"永"字的对应区域） */
    ctx.save();
    ctx.font = 'bold ' + fs + 'px "STKaiti","KaiTi","楷体",serif';
    ctx.fillStyle = '#1a1a1a';
    for (var bi = 0; bi < 3; bi++) {
      if (bP[bi] <= 0) continue;
      var band = bands[bi];
      var revealH = (band.y1 - band.y0) * bP[bi];
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - gs / 2 - 2, band.y0, gs + 4, revealH);
      ctx.clip();
      ctx.fillText('永', cx, cy);
      ctx.restore();
    }
    ctx.restore();

    /* 当前书写位置的毛笔 */
    if (phase !== 0 && phase !== 6 && !lookBack) {
      var curBand = phase === 1 ? 0 : phase === 3 ? 1 : 2;
      var band = bands[curBand];
      var brushY = band.y0 + (band.y1 - band.y0) * bP[curBand];
      drawBrush(ctx, cx, brushY, Math.PI / 2, '#1a1a1a', 0.7);
    }

    /* 完成后绿色"永"字浮现 */
    if (phase === 6) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold ' + fs + 'px "STKaiti","KaiTi","楷体",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('永', cx, cy);
      ctx.restore();
    }

    /* 底部标签 */
    ctx.font = '8px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#6b7280';
    var label;
    if (phase === 0) label = '准备落笔...';
    else if (phase === 1) label = '写上半部分（点+横折）';
    else if (phase === 2) label = '👀 回看已写 → 条件输入';
    else if (phase === 3) label = '写中间部分（撇+横撇）';
    else if (phase === 4) label = '👀 回看前两段 → 条件输入';
    else if (phase === 5) label = '写下半部分（竖钩+捺）';
    else label = '✓ 看一笔写一笔，自条件成字！';
    ctx.fillText(label, 8, H - 4);
  });

  /* ---------- §10 ana-result: 书法比赛——柱状图评比，ELF最高拿🏆 ---------- */
  startAna('ana-result', function(ctx, W, H, p) {
    ctx.fillStyle = '#faf6ed'; ctx.fillRect(0, 0, W, H);
    const bars = [
      { label: 'AR',    h: 0.55, c: '#94a3b8' },
      { label: 'NAR',   h: 0.62, c: '#94a3b8' },
      { label: 'Diff-LM', h: 0.70, c: '#60a5fa' },
      { label: 'ELF',   h: 0.88, c: '#22c55e' },
    ];
    const barW = 32, gap = 10;
    const baseY = H - 25;
    const maxH = H - 48;
    const startX = (W - (bars.length * barW + (bars.length - 1) * gap)) / 2;
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, baseY); ctx.lineTo(W - 8, baseY); ctx.stroke();
    bars.forEach((b, i) => {
      const delay = i * 0.1;
      const bp = Math.max(0, Math.min(1, (p - delay) / 0.5));
      const bh = b.h * maxH * bp;
      const bx = startX + i * (barW + gap);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(bx - 2, baseY - bh - 2, barW + 4, bh + 4);
      ctx.strokeStyle = b.c; ctx.lineWidth = 2;
      ctx.strokeRect(bx, baseY - bh, barW, bh);
      ctx.fillStyle = b.c;
      ctx.fillRect(bx + 2, baseY - bh + 2, barW - 4, bh - 4);
      ctx.font = 'bold 12px "STKaiti","KaiTi","楷体",serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
      ctx.fillText('字', bx + barW / 2, baseY - bh / 2);
      ctx.font = '9px "Microsoft YaHei"'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(b.label, bx + barW / 2, baseY + 12);
      if (bp > 0.9) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = b.c === '#22c55e' ? '#166534' : '#475569';
        ctx.fillText(Math.round(b.h * 100), bx + barW / 2, baseY - bh - 6);
        if (b.label === 'ELF') {
          ctx.font = '14px serif';
          ctx.fillText('🏆', bx + barW / 2, baseY - bh - 22);
        }
      }
    });
    ctx.font = '10px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.fillStyle = '#92400e';
    ctx.fillText(p < 0.7 ? '书法评比中...' : 'ELF 拔得头筹！🏆', 8, H - 5);
  });
})();

/* ================================================================
   章节按需加载：首屏只有标题+“去学习”按钮，点按钮展开第 1 章，
   每章末尾“继续下一章”按钮逐章展开
   ================================================================ */
(function() {
  const chaps = $qa('section.chap');
  if (!chaps.length) return;

  // 隐藏所有章节（含第 1 章）
  chaps.forEach(chap => chap.classList.add('chap-hidden'));

  // B 站视频区域一开始也隐藏，等所有章节展开后才显示
  const videosSection = document.getElementById('elf-videos');
  if (videosSection) videosSection.classList.add('chap-hidden');

  // hero 区域追加“开始学习”按钮（若尚未存在）
  const hero = document.querySelector('.hero');
  let startBtn = document.getElementById('hero-start-btn');
  if (hero && !startBtn) {
    startBtn = document.createElement('div');
    startBtn.className = 'chap-loader';
    startBtn.id = 'hero-start-btn';
    startBtn.innerHTML =
      '<span class="chap-loader-hint">准备好了解 ELF 的奥秘了吗？</span>' +
      '<button class="chap-loader-btn">' +
        '<span>开始学习 §1</span>' +
        '<span class="chap-loader-arrow">→</span>' +
      '</button>';
    hero.appendChild(startBtn);
    startBtn.querySelector('.chap-loader-btn').addEventListener('click', () => {
      chaps[0].classList.remove('chap-hidden');
      startBtn.remove();
      // 显示第 1 章末尾的 loader
      const nextLoader = chaps[0].nextElementSibling;
      if (nextLoader && nextLoader.classList.contains('chap-loader')) {
        nextLoader.classList.remove('chap-hidden');
      }
      chaps[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // 为每章（最后一章除外）在末尾插入“继续下一章”按钮，默认隐藏
  chaps.forEach((chap, i) => {
    if (i >= chaps.length - 1) return;
    const nextChap = chaps[i + 1];
    const nextTitleEl = nextChap.querySelector('.chap-title');
    const nextNumEl = nextTitleEl ? nextTitleEl.querySelector('.num') : null;
    const nextNum = nextNumEl ? nextNumEl.textContent.trim() : '';
    let nextName = '下一章';
    if (nextTitleEl) {
      const clone = nextTitleEl.cloneNode(true);
      clone.querySelectorAll('.num, .badge-tag').forEach(el => el.remove());
      nextName = clone.textContent.trim();
    }

    const loader = document.createElement('div');
    loader.className = 'chap-loader chap-hidden';
    loader.innerHTML =
      '<span class="chap-loader-hint">本章结束 · 继续探索 '  + '</span>' +
      '<button class="chap-loader-btn">' +
        '<span>' + nextNum + ' ' + nextName + '</span>' +
        '<span class="chap-loader-arrow">→</span>' +
      '</button>';
    chap.parentNode.insertBefore(loader, nextChap);

    loader.querySelector('.chap-loader-btn').addEventListener('click', () => {
      nextChap.classList.remove('chap-hidden');
      loader.remove();
      // 显示下一章末尾的 loader（如果有）
      const nextLoader = nextChap.nextElementSibling;
      if (nextLoader && nextLoader.classList.contains('chap-loader')) {
        nextLoader.classList.remove('chap-hidden');
      }
      // 展开最后一章时，显示 B 站视频推荐区域
      if (i === chaps.length - 2 && videosSection) {
        videosSection.classList.remove('chap-hidden');
      }
      nextChap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ================================================================
   B 站视频封面：通过 JSONP 获取视频信息（封面、标题、UP 主、播放量、时长）
   ================================================================ */
(function() {
  const cards = $qa('[data-bvid]');
  if (!cards.length) return;

  let cbCounter = 0;

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function formatViews(v) {
    if (v >= 10000) return (v / 10000).toFixed(1) + '万播放';
    return v + '播放';
  }

  function fetchBiliVideo(bvid, callback) {
    const cbName = '__bili_cb_' + (++cbCounter);
    window[cbName] = function(res) {
      callback(res);
      try { delete window[cbName]; } catch(e) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    const script = document.createElement('script');
    script.src = 'https://api.bilibili.com/x/web-interface/view?bvid=' + bvid + '&jsonp=jsonp&callback=' + cbName;
    script.onerror = function() {
      callback(null);
      try { delete window[cbName]; } catch(e) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    document.body.appendChild(script);
  }

  cards.forEach(card => {
    const bvid = card.getAttribute('data-bvid');
    const cover = card.querySelector('.dl-video-link-cover');
    if (!cover) return;

    // 已烘焙静态封面/元信息（生成时写入）时跳过 is-loading 动画
    const baked = cover.querySelector('.dl-video-cover-img');
    if (!baked) cover.classList.add('is-loading');

    fetchBiliVideo(bvid, function(res) {
      cover.classList.remove('is-loading');
      if (!res || res.code !== 0 || !res.data) return;

      const d = res.data;

      // 封面图（幂等：已烘焙则不再插入，避免重复 img）
      if (d.pic && !cover.querySelector('.dl-video-cover-img')) {
        const img = document.createElement('img');
        img.className = 'dl-video-cover-img';
        img.src = d.pic.replace(/^http:/, 'https:');
        img.alt = d.title || '';
        img.loading = 'lazy';
        img.onload = () => cover.classList.add('is-loaded');
        cover.insertBefore(img, cover.firstChild);
      }

      // 标题（仅当仍是占位文案时才更新，烘焙的真实标题保持不变）
      if (d.title) {
        const titleEl = card.querySelector('strong');
        if (titleEl && titleEl.textContent.trim() === 'B 站讲解视频') {
          titleEl.textContent = d.title;
        }
      }

      // 时长角标（幂等）
      if (d.duration && !cover.querySelector('.dl-video-duration')) {
        const dur = document.createElement('span');
        dur.className = 'dl-video-duration';
        dur.textContent = formatDuration(d.duration);
        cover.appendChild(dur);
      }

      // 元信息：仅展示播放量（幂等）
      if (!card.querySelector('.dl-video-meta')) {
        const meta = document.createElement('div');
        meta.className = 'dl-video-meta';
        const viewsSpan = document.createElement('span');
        viewsSpan.className = 'views';
        viewsSpan.textContent = d.stat ? formatViews(d.stat.view) : '';
        meta.appendChild(viewsSpan);
        card.appendChild(meta);
      }
    });
  });
})();

}
