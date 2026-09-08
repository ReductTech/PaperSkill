import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* §6.1 递推 ≡ 卷积 · 计算演示视频（播放式）。
   用具体数字（Ā=0.9、B̄=0.5、C̄=1、x=[0.2,0.8,0.3]）把两种算法各算一遍：
   递推逐步更新 h，卷积用核 K 一次展开——两条路径得到完全相同的输出。 */

const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const F = '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
const MONO = '"Cascadia Mono","Consolas",monospace';

const W = 800, H = 420;
const TOTAL_MS = 32000;
const SCENES = [
  { start: 0, end: 6000, badge: '01', title: '设定：一组具体数字', name: '设定' },
  { start: 6000, end: 17000, badge: '02', title: '递推视角：逐步算 hₜ = Āhₜ₋₁ + B̄xₜ', name: '递推' },
  { start: 17000, end: 27000, badge: '03', title: '卷积视角：核 K 一次展开', name: '卷积' },
  { start: 27000, end: 32000, badge: '04', title: '对比：两种算法，同一个答案', name: '对比' },
];
const FOOTERS = [
  '参数 Ā=0.9、B̄=0.5、C̄=1，输入 x = [0.2, 0.8, 0.3]。',
  '递推逐步更新隐状态：每步 h 由上一刻 h 与当前输入决定。',
  '参数固定后，递推可展开成对输入的卷积 y = K * x。',
  '递推与卷积得到完全相同的输出——同一套计算，两种视角。',
];

/* 具体数字 */
const A = 0.9, B = 0.5, CB = 1.0;
const X = [0.2, 0.8, 0.3];
const REC = (() => {
  const out: { h: number; prev: number; term1: number; term2: number }[] = [];
  let h = 0;
  for (const x of X) {
    const prev = h;
    const term1 = A * prev;
    const term2 = B * x;
    h = term1 + term2;
    out.push({ h, prev, term1, term2 });
  }
  return out;
})();
const K = [CB * B, CB * A * B, CB * A * A * B]; // 0.5, 0.45, 0.405
const CONV = X.map((_, i) => {
  const terms: { k: number; x: number; prod: number }[] = [];
  let y = 0;
  for (let j = 0; j <= i; j++) {
    const k = K[i - j];
    const xv = X[j];
    terms.push({ k, x: xv, prod: k * xv });
    y += k * xv;
  }
  return { terms, y };
});

const f3 = (v: number) => v.toFixed(3).replace(/\.?0+$/, '');
const MAXH = 0.6; // 记忆条刻度上限

/* ---------- 基础绘制 ---------- */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, W, H);
}
function box(ctx: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, label: string, fill: string, border: string, bold = true) {
  ctx.fillStyle = fill;
  rr(ctx, r.x, r.y, r.w, r.h, 9);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `${bold ? 'bold ' : ''}13px ${F}`;
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 5);
  ctx.textAlign = 'left';
}
function drawHeader(ctx: CanvasRenderingContext2D, idx: number) {
  const sc = SCENES[idx];
  ctx.font = `bold 12px ${F}`;
  const bw = ctx.measureText(sc.badge).width + 18;
  rr(ctx, 16, 14, bw, 24, 12);
  ctx.fillStyle = C.blue;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(sc.badge, 16 + bw / 2, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 16px ${F}`;
  ctx.fillText(sc.title, 16 + bw + 12, 31);
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lineH: number, center: boolean) {
  ctx.textAlign = center ? 'center' : 'left';
  const chars = Array.from(text);
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      yy += lineH;
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
function sceneAlpha(localT: number, dur: number): number {
  return Math.min(easeOutCubic(clamp(localT / 400, 0, 1)), clamp((dur - localT) / 350, 0, 1));
}
function drawFooter(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = `15px ${F}`;
  ctx.fillStyle = C.ink;
  wrapText(ctx, text, W / 2, 352, W - 90, 20, true);
}
function drawBottomStrip(ctx: CanvasRenderingContext2D, elapsed: number, idx: number, paused: boolean) {
  const y = H - 40;
  rr(ctx, 12, y, W - 24, 26, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = `12px ${F}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(paused ? '⏸ 已暂停' : '⏵ 播放中', 26, y + 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.fillText(`第 ${idx + 1}/${SCENES.length} 幕`, W / 2, y + 18);
  ctx.textAlign = 'right';
  const s = Math.max(0, Math.floor(elapsed / 1000));
  ctx.fillStyle = C.muted;
  ctx.fillText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} / 0:32`, W - 26, y + 18);
}
function drawProgress(ctx: CanvasRenderingContext2D, elapsed: number) {
  const prog = clamp(elapsed / TOTAL_MS, 0, 1);
  ctx.fillStyle = 'rgba(33,50,74,0.08)';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = C.orange;
  ctx.fillRect(0, 0, W * prog, 6);
}

/* ---------- 幕 1：设定 ---------- */
function drawScene1(ctx: CanvasRenderingContext2D, localT: number) {
  const params = [
    { t: 'Ā = 0.9', sub: '每步保留多少旧记忆', d: 400 },
    { t: 'B̄ = 0.5', sub: '新输入融入多少', d: 1600 },
    { t: 'C̄ = 1.0', sub: '从隐状态读出输出', d: 2800 },
  ];
  params.forEach((p, i) => {
    const a = easeOutCubic(clamp((localT - p.d) / 500, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    box(ctx, { x: 90 + i * 210, y: 110, w: 170, h: 84 }, p.t, '#ffffff', C.blue);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `12px ${F}`;
    ctx.fillText(p.sub, 90 + i * 210 + 85, 122);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });
  // 输入 x
  X.forEach((x, i) => {
    const a = easeOutCubic(clamp((localT - (4200 + i * 500)) / 450, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    box(ctx, { x: 150 + i * 170, y: 260, w: 120, h: 60 }, `x${i + 1} = ${f3(x)}`, '#ffffff', C.orange);
    ctx.globalAlpha = 1;
  });
  const a = easeOutCubic(clamp((localT - 5600) / 400, 0, 1));
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 15px ${F}`;
    ctx.fillText('输入 x = [0.2, 0.8, 0.3]，共 3 个 token', W / 2, 232);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

/* ---------- 幕 2：递推视角 ---------- */
const STEP2_MS = (SCENES[1].end - SCENES[1].start) / 3;
function drawScene2(ctx: CanvasRenderingContext2D, localT: number) {
  const step = Math.min(2, Math.floor(localT / STEP2_MS));
  const st = REC[step];
  const sm = localT - step * STEP2_MS;

  // token 行
  X.forEach((x, i) => {
    const tx = 60 + i * 110;
    ctx.fillStyle = '#ffffff';
    rr(ctx, tx, 80, 90, 52, 9);
    ctx.fill();
    ctx.strokeStyle = i === step ? C.orange : C.line;
    ctx.lineWidth = i === step ? 2 : 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `11px ${F}`;
    ctx.fillText(`x${i + 1}`, tx + 45, 96);
    ctx.fillStyle = C.ink;
    ctx.font = `bold 15px ${MONO}`;
    ctx.fillText(f3(x), tx + 45, 112);
    ctx.textAlign = 'left';
  });

  // 记忆单元
  const hPrevShown = step === 0 ? 0 : REC[step - 1].h;
  const hCur = lerp(hPrevShown, st.h, easeOutCubic(clamp((sm - 500) / 900, 0, 1)));
  box(ctx, { x: 470, y: 84, w: 280, h: 96 }, `隐状态 h${step + 1} = ${f3(hCur)}`, 'rgba(39,68,110,0.06)', C.blue);
  // 记忆条
  const bx = 490, by = 150, bw = 240;
  ctx.fillStyle = 'rgba(39,68,110,0.1)';
  rr(ctx, bx, by, bw, 12, 6);
  ctx.fill();
  ctx.fillStyle = C.blue;
  rr(ctx, bx, by, Math.max(4, (hCur / MAXH) * bw), 12, 6);
  ctx.fill();
  // 上一步的刻度
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + (hPrevShown / MAXH) * bw, by - 3);
  ctx.lineTo(bx + (hPrevShown / MAXH) * bw, by + 15);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = `11px ${F}`;
  ctx.fillText('上一刻', bx + 4, by + 28);

  // 算式（分阶段浮现）
  const mono = `13px ${MONO}`;
  const lines: Array<[string, string, number]> = [];
  const substP = easeOutCubic(clamp((sm - 300) / 500, 0, 1));
  const prodP = easeOutCubic(clamp((sm - 1300) / 500, 0, 1));
  const sumP = easeOutCubic(clamp((sm - 2000) / 400, 0, 1));
  const yP = easeOutCubic(clamp((sm - 2500) / 400, 0, 1));
  lines.push([`h${step + 1} = Ā·h${step} + B̄·x${step + 1}`, C.blue, 1]);
  if (substP > 0) lines.push([`    = ${f3(A)}·${f3(st.prev)} + ${f3(B)}·${f3(X[step])}`, C.blue, substP]);
  if (prodP > 0) lines.push([`    = ${f3(st.term1)} + ${f3(st.term2)}`, C.blue, prodP]);
  if (sumP > 0) lines.push([`    = ${f3(st.h)}`, C.green, sumP]);
  if (yP > 0) lines.push([`y${step + 1} = C̄·h${step + 1} = ${f3(st.h)}`, C.orange, yP]);
  ctx.textAlign = 'left';
  lines.forEach(([txt, color, a], i) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.font = `bold ${mono}`;
    ctx.fillText(txt, 60, 232 + i * 24);
    ctx.globalAlpha = 1;
  });
}

/* ---------- 幕 3：卷积视角 ---------- */
const STEP3_MS = (SCENES[2].end - SCENES[2].start - 1500) / 3;
function drawScene3(ctx: CanvasRenderingContext2D, localT: number) {
  // 核
  const kp = easeOutCubic(clamp((localT - 300) / 800, 0, 1));
  if (kp > 0) {
    ctx.globalAlpha = kp;
    ctx.fillStyle = C.ink;
    ctx.font = `bold 14px ${F}`;
    ctx.fillText('卷积核 K = (C̄B̄, C̄ĀB̄, C̄Ā²B̄) =', 60, 72);
    K.forEach((k, i) => {
      box(ctx, { x: 300 + i * 110, y: 92, w: 90, h: 40 }, f3(k), 'rgba(39,68,110,0.08)', C.blue);
    });
    ctx.globalAlpha = 1;
  }
  if (localT < 1500) return;

  const step = Math.min(2, Math.floor((localT - 1500) / STEP3_MS));
  const sm = (localT - 1500) - step * STEP3_MS;
  const terms = CONV[step].terms;

  // y 展开
  const mono = `13px ${MONO}`;
  ctx.fillStyle = C.blue;
  ctx.font = `bold ${mono}`;
  ctx.fillText(`y${step + 1} = ${terms.map((_, j) => `K${j + 1}x${step + 1 - j}`).join(' + ')}`, 60, 170);
  ctx.font = `${mono}`;
  terms.forEach((term, j) => {
    const a = easeOutCubic(clamp((sm - 350 - j * 450) / 400, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = C.blue;
    ctx.fillText(`    = ${f3(term.k)}·${f3(term.x)}${j < terms.length - 1 ? ' +' : ''}`, 60, 198 + j * 24);
    ctx.globalAlpha = 1;
  });
  // 乘积
  const prodP = easeOutCubic(clamp((sm - 350 - (terms.length - 1) * 450 - 500) / 400, 0, 1));
  if (prodP > 0) {
    ctx.fillStyle = C.blue;
    ctx.fillText(`    = ${terms.map((t) => f3(t.prod)).join(' + ')}`, 60, 198 + terms.length * 24);
  }
  const sumP = easeOutCubic(clamp((sm - 350 - (terms.length - 1) * 450 - 1000) / 400, 0, 1));
  if (sumP > 0) {
    ctx.fillStyle = C.green;
    ctx.font = `bold ${mono}`;
    ctx.fillText(`    = ${f3(CONV[step].y)}`, 60, 198 + terms.length * 24 + 26);
  }
  // 与递推一致
  const matchP = easeOutCubic(clamp((sm - 350 - (terms.length - 1) * 450 - 1500) / 400, 0, 1));
  if (matchP > 0) {
    ctx.globalAlpha = matchP;
    ctx.fillStyle = C.green;
    ctx.font = `bold 13px ${F}`;
    ctx.fillText(`✓ 与递推视角的 y${step + 1} = ${f3(REC[step].h)} 一致`, 60, 198 + terms.length * 24 + 52);
    ctx.globalAlpha = 1;
  }
}

/* ---------- 幕 4：对比 ---------- */
function drawScene4(ctx: CanvasRenderingContext2D, localT: number) {
  const rows = [
    ['步', 'xₜ', '递推 yₜ', '卷积 yₜ', '一致'],
    ['1', '0.2', '0.10', '0.10', '✓'],
    ['2', '0.8', '0.49', '0.49', '✓'],
    ['3', '0.3', '0.591', '0.591', '✓'],
  ];
  const x0 = 120, y0 = 90, cw = 110, ch = 44;
  rows.forEach((row, r) => {
    const a = easeOutCubic(clamp((localT - (400 + r * 550)) / 450, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    row.forEach((cell, c) => {
      const isHead = r === 0;
      ctx.fillStyle = isHead ? 'rgba(39,68,110,0.08)' : '#ffffff';
      rr(ctx, x0 + c * cw, y0 + r * ch, cw - 6, ch - 6, 6);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = c === 4 && !isHead ? C.green : C.ink;
      ctx.font = `bold 14px ${F}`;
      ctx.fillText(cell, x0 + c * cw + (cw - 6) / 2, y0 + r * ch + (ch - 6) / 2 + 5);
    });
    ctx.globalAlpha = 1;
  });
  const c = easeOutCubic(clamp((localT - 2200) / 600, 0, 1));
  if (c > 0) {
    ctx.globalAlpha = c;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.green;
    ctx.font = `bold 17px ${F}`;
    ctx.fillText('递推 ≡ 卷积：同一套计算，训练用卷积并行、推理用递推省内存', W / 2, 330);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, localT: number) {
  switch (idx) {
    case 0: drawScene1(ctx, localT); break;
    case 1: drawScene2(ctx, localT); break;
    case 2: drawScene3(ctx, localT); break;
    default: drawScene4(ctx, localT); break;
  }
}

/* ---------- 组件 ---------- */
export const SsmConvVideo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ started: false, paused: false, t0: 0, pausedAt: 0 });
  const lastUiRef = useRef(0);
  const [ui, setUi] = useState({ elapsed: 0, paused: true, idx: 0, ended: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (elapsed: number) => {
      clearScene(ctx);
      drawProgress(ctx, elapsed);
      const idx = findSceneIdx(elapsed);
      const sc = SCENES[idx];
      const localT = clamp(elapsed - sc.start, 0, sc.end - sc.start);
      drawHeader(ctx, idx);
      const a = sceneAlpha(localT, sc.end - sc.start);
      ctx.save();
      ctx.globalAlpha = a;
      drawScene(ctx, idx, localT);
      drawFooter(ctx, FOOTERS[idx]);
      ctx.restore();
      drawBottomStrip(ctx, elapsed, idx, stateRef.current.paused || !stateRef.current.started);
    };
    const tick = (t: number) => {
      const s = stateRef.current;
      const elapsed = !s.started ? 0 : s.paused ? s.pausedAt : t - s.t0;
      render(elapsed);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (t - lastUiRef.current > 150) {
        lastUiRef.current = t;
        setUi({ elapsed: Math.round(elapsed), paused: s.paused || !s.started, idx: findSceneIdx(elapsed), ended: elapsed >= TOTAL_MS - 40 });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const startLoop = () => {
      if (!stateRef.current.started) {
        stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const disconnect = observeCanvas(canvas, startLoop, stopLoop);
    return () => {
      stopLoop();
      disconnect();
    };
  }, []);

  const toggle = () => {
    const s = stateRef.current;
    const el = s.started && !s.paused ? performance.now() - s.t0 : s.pausedAt;
    if (s.started && !s.paused && el < TOTAL_MS - 40) {
      stateRef.current = { ...s, paused: true, pausedAt: el };
      setUi((u) => ({ ...u, paused: true }));
    } else if (s.started && !s.paused) {
      stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
      setUi((u) => ({ ...u, paused: false, ended: false }));
    } else {
      const base = s.pausedAt || 0;
      stateRef.current = { started: true, paused: false, t0: performance.now() - base, pausedAt: base };
      setUi((u) => ({ ...u, paused: false, ended: false }));
    }
  };
  const restart = () => {
    stateRef.current = { started: true, paused: false, t0: performance.now(), pausedAt: 0 };
    setUi((u) => ({ ...u, paused: false, ended: false }));
  };
  const seek = (i: number) => {
    const ms = SCENES[i].start + 60;
    stateRef.current = { started: true, paused: false, t0: performance.now() - ms, pausedAt: ms };
    setUi((u) => ({ ...u, paused: false, ended: false, idx: i }));
  };

  const isPaused = ui.paused || ui.ended;
  const scene = SCENES[ui.idx];
  const playLabel = ui.ended ? '↺ 重播' : isPaused ? '▶ 播放' : '⏸ 暂停';
  const feedbackText = ui.ended
    ? '已播完 4 幕：递推与卷积算出一模一样的答案。'
    : isPaused
      ? `已暂停 · 第 ${ui.idx + 1}/4 幕「${scene.title}」。`
      : `第 ${ui.idx + 1}/4 幕「${scene.title}」。`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={toggle}>{playLabel}</button>
        <button className="tiny ghost" onClick={restart}>↺ 从头</button>
      </div>
      <div className="chip-row">
        {SCENES.map((s, i) => (
          <button key={i} className={`chip ${ui.idx === i ? 'selected' : ''}`} onClick={() => seek(i)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="feedback">{feedbackText}</div>
    </div>
  );
};

function findSceneIdx(elapsed: number): number {
  if (elapsed >= TOTAL_MS) return SCENES.length - 1;
  for (let i = 0; i < SCENES.length; i++) {
    if (elapsed < SCENES[i].end) return i;
  }
  return SCENES.length - 1;
}
