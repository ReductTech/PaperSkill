import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* §7.1 选择性递推 · 计算演示视频（播放式）。
   用具体数字（x = [0.2, 0.9, 0.1, 0.7]）把选择性递推逐步算一遍：
   Δₜ = xₜ、Āₜ = e^(−Δₜ)、B̄ₜ = Δₜ；强 token 大幅改写记忆、弱 token 几乎不动。 */

const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const F = '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
const MONO = '"Cascadia Mono","Consolas",monospace';

const W = 800, H = 420;
const TOTAL_MS = 30000;
const SCENES = [
  { start: 0, end: 6000, badge: '01', title: '设定：选择性递推的规则', name: '设定' },
  { start: 6000, end: 24000, badge: '02', title: '逐步计算：Δₜ 决定记忆怎么改写', name: '逐步' },
  { start: 24000, end: 30000, badge: '03', title: '结论：只记该记的', name: '结论' },
];
const FOOTERS = [
  '规则：Δₜ = xₜ，Āₜ = e^(−Δₜ)，B̄ₜ = Δₜ，yₜ = hₜ（C̄ = 1）。',
  '每步按输入 xₜ 选择「记住多少」：强 token 更新多，弱 token 几乎不动。',
  '整条轨迹：记忆在关键处跃升、在普通处回落——只记该记的。',
];

interface Step {
  x: number;
  d: number;
  a: number;
  b: number;
  h: number;
  strong: boolean;
}
const RAW = [0.2, 0.9, 0.1, 0.7];
const STEPS: Step[] = (() => {
  let h = 0;
  return RAW.map((x) => {
    const d = x;
    const a = Math.exp(-d);
    const b = d;
    h = a * h + b * x;
    return { x, d, a, b, h, strong: x >= 0.5 };
  });
})();
const f1 = (v: number) => v.toFixed(1);
const f3 = (v: number) => v.toFixed(3).replace(/\.?0+$/, '');
const f2 = (v: number) => v.toFixed(2);
const MAXH = 1;

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
function box(ctx: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, label: string, fill: string, border: string) {
  ctx.fillStyle = fill;
  rr(ctx, r.x, r.y, r.w, r.h, 9);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 13px ${F}`;
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
  ctx.fillText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} / 0:30`, W - 26, y + 18);
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
  const rules = [
    { t: 'Δₜ = xₜ', sub: '输入决定门控', d: 400 },
    { t: 'Āₜ = e^(−Δₜ)', sub: '保留多少旧记忆', d: 1500 },
    { t: 'B̄ₜ = Δₜ', sub: '融入多少新信息', d: 2600 },
  ];
  rules.forEach((p, i) => {
    const a = easeOutCubic(clamp((localT - p.d) / 500, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    box(ctx, { x: 70 + i * 230, y: 96, w: 200, h: 84 }, p.t, '#ffffff', C.blue);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `12px ${F}`;
    ctx.fillText(p.sub, 70 + i * 230 + 100, 108);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });
  // 输入 x
  STEPS.forEach((st, i) => {
    const a = easeOutCubic(clamp((localT - (4300 + i * 380)) / 420, 0, 1));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    box(ctx, { x: 90 + i * 165, y: 260, w: 130, h: 64 }, `x${i + 1} = ${f1(st.x)}`, '#ffffff', st.strong ? C.orange : C.line);
    ctx.textAlign = 'center';
    ctx.fillStyle = st.strong ? C.orange : C.muted;
    ctx.font = `bold 12px ${F}`;
    ctx.fillText(st.strong ? '强 token' : '弱 token', 90 + i * 165 + 65, 246);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });
  const a = easeOutCubic(clamp((localT - 5850) / 300, 0, 1));
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.font = `bold 14px ${F}`;
    ctx.fillText('输入 x = [0.2, 0.9, 0.1, 0.7]（弱 · 强 · 弱 · 强）', W / 2, 334);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

/* ---------- 幕 2：逐步计算 ---------- */
const STEP2_MS = (SCENES[1].end - SCENES[1].start) / 4;
function drawScene2(ctx: CanvasRenderingContext2D, localT: number) {
  const step = Math.min(3, Math.floor(localT / STEP2_MS));
  const st = STEPS[step];
  const sm = localT - step * STEP2_MS;
  const prevH = step === 0 ? 0 : STEPS[step - 1].h;

  // token 行（含强弱）
  STEPS.forEach((s2, i) => {
    const tx = 50 + i * 130;
    ctx.fillStyle = '#ffffff';
    rr(ctx, tx, 78, 110, 58, 9);
    ctx.fill();
    const active = i === step;
    ctx.strokeStyle = active ? (s2.strong ? C.orange : C.red) : C.line;
    ctx.lineWidth = active ? 2 : 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.muted;
    ctx.font = `11px ${F}`;
    ctx.fillText(`x${i + 1}`, tx + 55, 94);
    ctx.fillStyle = C.ink;
    ctx.font = `bold 15px ${MONO}`;
    ctx.fillText(f1(s2.x), tx + 55, 112);
    ctx.fillStyle = active ? (s2.strong ? C.orange : C.red) : C.muted;
    ctx.font = `bold 11px ${F}`;
    ctx.fillText(s2.strong ? '强' : '弱', tx + 55, 130);
    ctx.textAlign = 'left';
  });

  // 门控量
  const gp = easeOutCubic(clamp((sm - 350) / 500, 0, 1));
  if (gp > 0) {
    ctx.globalAlpha = gp;
    const gates: Array<[string, string, string]> = [
      [`Δ${step + 1}`, `= x = ${f1(st.d)}`, C.blue],
      [`Ā${step + 1}`, `= e^(−${f1(st.d)}) = ${f3(st.a)}`, C.blue],
      [`B̄${step + 1}`, `= ${f1(st.b)}`, C.blue],
    ];
    ctx.font = `bold 14px ${F}`;
    gates.forEach(([sym, val, color], i) => {
      ctx.fillStyle = color;
      ctx.fillText(`${sym} ${val}`, 50 + i * 220, 176);
    });
    ctx.globalAlpha = 1;
  }

  // 记忆条（h 平滑动画）
  const hCur = lerp(prevH, st.h, easeOutCubic(clamp((sm - 700) / 900, 0, 1)));
  const bx = 600, by = 82, bw = 170;
  ctx.fillStyle = 'rgba(39,68,110,0.1)';
  rr(ctx, bx, by, bw, 12, 6);
  ctx.fill();
  ctx.fillStyle = C.blue;
  rr(ctx, bx, by, Math.max(4, (hCur / MAXH) * bw), 12, 6);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + (prevH / MAXH) * bw, by - 3);
  ctx.lineTo(bx + (prevH / MAXH) * bw, by + 15);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = `bold 15px ${F}`;
  ctx.fillText(`记忆 h = ${f2(hCur)}`, bx, by - 10);
  ctx.fillStyle = C.muted;
  ctx.font = `11px ${F}`;
  ctx.fillText(`上一步 h = ${f2(prevH)}`, bx, by + 30);
  ctx.textAlign = 'left';

  // 算式
  const mono = `13px ${MONO}`;
  const lines: Array<[string, string, number]> = [];
  lines.push([`h${step + 1} = Ā${step + 1}·h${step} + B̄${step + 1}·x${step + 1}`, C.blue, 1]);
  const substP = easeOutCubic(clamp((sm - 600) / 500, 0, 1));
  const prodP = easeOutCubic(clamp((sm - 1500) / 500, 0, 1));
  const sumP = easeOutCubic(clamp((sm - 2200) / 400, 0, 1));
  const yP = easeOutCubic(clamp((sm - 2800) / 400, 0, 1));
  if (substP > 0) lines.push([`    = e^(−${f1(st.d)})·${f2(prevH)} + ${f1(st.b)}·${f1(st.x)}`, C.blue, substP]);
  if (prodP > 0) lines.push([`    = ${f3(st.a)}·${f2(prevH)} + ${f1(st.b)}·${f1(st.x)}`, C.blue, prodP]);
  if (sumP > 0) lines.push([`    = ${f2(st.a * prevH)} + ${f2(st.b * st.x)}`, C.blue, sumP]);
  if (sumP > 0) lines.push([`    = ${f2(st.h)}`, C.green, sumP]);
  if (yP > 0) lines.push([`y${step + 1} = h${step + 1} = ${f2(st.h)}`, C.orange, yP]);
  lines.forEach(([txt, color, a], i) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.font = `bold ${mono}`;
    ctx.fillText(txt, 50, 224 + i * 22);
    ctx.globalAlpha = 1;
  });
}

/* ---------- 幕 3：结论 ---------- */
function drawScene3(ctx: CanvasRenderingContext2D, localT: number) {
  // h 轨迹：t=0..4
  const x0 = 90, x1 = 690, y0 = 250, y1 = 70;
  const X = (i: number) => x0 + (i / 4) * (x1 - x0);
  const Y = (h: number) => y0 - (h / MAXH) * (y0 - y1);
  const hs = [0, ...STEPS.map((s) => s.h)];

  // 轴
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = `12px ${F}`;
  ctx.fillText('记忆 h', x0 + 4, y1 - 6);
  ctx.fillText('步数 t →', x1 - 60, y0 + 18);

  // 轨迹线逐段画
  for (let i = 0; i < hs.length - 1; i++) {
    const p = easeOutCubic(clamp((localT - (400 + i * 900)) / 800, 0, 1));
    if (p <= 0) continue;
    const a = hs[i], b = hs[i + 1];
    const xa = X(i), ya = Y(a), xb = X(i + 1), yb = Y(b);
    const strong = STEPS[i].strong;
    ctx.strokeStyle = strong ? C.orange : C.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xa, ya);
    ctx.lineTo(xa + (xb - xa) * p, ya + (yb - ya) * p);
    ctx.stroke();
    if (p >= 1) {
      ctx.fillStyle = strong ? C.orange : C.blue;
      ctx.beginPath();
      ctx.arc(xb, yb, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = `bold 13px ${F}`;
      ctx.fillText(f2(b), xb, yb - 10);
    }
  }
  // 起点
  ctx.fillStyle = C.muted;
  ctx.beginPath();
  ctx.arc(X(0), Y(0), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('0', X(0) - 6, Y(0) + 16);

  // 图例
  const legP = easeOutCubic(clamp((localT - 600) / 400, 0, 1));
  if (legP > 0) {
    ctx.globalAlpha = legP;
    ctx.fillStyle = C.orange;
    ctx.fillRect(x0, y0 + 30, 14, 3);
    ctx.fillStyle = C.muted;
    ctx.font = `12px ${F}`;
    ctx.fillText('强 token：记忆跃升', x0 + 20, y0 + 34);
    ctx.fillStyle = C.blue;
    ctx.fillRect(x0 + 160, y0 + 30, 14, 3);
    ctx.fillText('弱 token：记忆回落', x0 + 180, y0 + 34);
    ctx.globalAlpha = 1;
  }

  // 结论
  const cP = easeOutCubic(clamp((localT - 3300) / 600, 0, 1));
  if (cP > 0) {
    ctx.globalAlpha = cP;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.green;
    ctx.font = `bold 17px ${F}`;
    ctx.fillText('只记该记的：Δ 大的内容改写记忆，Δ 小的几乎不动——选择性扫描。', W / 2, 332);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, localT: number) {
  switch (idx) {
    case 0: drawScene1(ctx, localT); break;
    case 1: drawScene2(ctx, localT); break;
    default: drawScene3(ctx, localT); break;
  }
}

/* ---------- 组件 ---------- */
export const SsmWorkedVideo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    ? '已播完 3 幕：选择性递推只记该记的。'
    : isPaused
      ? `已暂停 · 第 ${ui.idx + 1}/3 幕「${scene.title}」。`
      : `第 ${ui.idx + 1}/3 幕「${scene.title}」。`;

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
