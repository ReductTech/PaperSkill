import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { C, clear, label, legend, paper, swatch, dot, bars, axis, track, arrow } from './wcKit';
import type { Ctx } from './wcKit';
import type { WidgetProps } from './registry';

function useCanvas(W: number, H: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    cv.classList.add('is-ready');
  }, [W, H]);
  return ref;
}

function begin(cv: HTMLCanvasElement, W: number, H: number): Ctx | null {
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clear(ctx, W, H);
  return ctx;
}

// ===========================================================================
// 10.1  历史知识保持的对比（P8 结果赛跑）
// ===========================================================================
const W1 = 1080;
const H1 = 320;
// 数值取自论文 Table 1 的 MTIL “Last” 一列（%）
const RACE: Array<{ name: string; v: number; color: string }> = [
  { name: 'LwF', v: 74.6, color: C.muted },
  { name: 'ZSCL', v: 83.6, color: C.purple },
  { name: '本文 (1k)', v: 85.0, color: C.green },
  { name: '本文† (3k)', v: 87.4, color: C.dark },
];

export const Mod101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W1, H1);
  const [prog, setProg] = useState(0);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 2400);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else setRun(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W1, H1);
    if (!ctx) return;
    const x0 = 240;
    const x1 = 940;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, 60);
    ctx.lineTo(x1, 288);
    ctx.stroke();
    ctx.setLineDash([]);
    RACE.forEach((r, i) => {
      const y = 84 + i * 54;
      const local = clamp((prog - i * 0.06) / 0.82, 0, 1);
      const target = (r.v / 90) * (x1 - x0);
      label(ctx, r.name, 40, y + 10, i >= 2 ? C.ink : C.muted, 16);
      track(ctx, x0, y, x1 - x0, 20, (target * local) / (x1 - x0), r.color);
      if (prog > 0) {
        label(ctx, (r.v * local).toFixed(1), x1 + 8, y + 10, r.color, 16);
      }
    });
    if (prog >= 1) dot(ctx, 1010, 138, 8, C.orange);
    legend(
      ctx,
      [
        { color: C.muted, text: 'LwF 74.6' },
        { color: C.purple, text: 'ZSCL 83.6' },
        { color: C.green, text: '本文 85.0' },
      ],
      40,
      302
    );
    ctx.restore();
  }, [prog, ref]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W1} height={H1} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => (prog >= 1 ? (setProg(0), setRun(true)) : setRun(true))} disabled={run}>
          {run ? '推进中…' : prog >= 1 ? '重播' : '开始对比'}
        </button>
        <span className="step-label">MTIL · Last 分数</span>
        <button
          className="tiny"
          onClick={() => {
            setRun(false);
            setProg(0);
          }}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${prog >= 1 ? 'good' : ''}`}>
        {prog >= 1
          ? '本文（1k 迭代）Last 85.0，已超过 ZSCL 的 83.6；把迭代加到 3k 进一步达到 87.4。'
          : '四条进度条从同一基线出发，按 MTIL 的 Last 分数推进：分数越高，历史任务被记住得越多。'}
      </div>
    </div>
  );
};

// ===========================================================================
// 10.2  任务数量增长下的单阈值局限（P2 分步可视化）
// ===========================================================================
const W2 = 1080;
const H2 = 300;
const STEPS = [1, 2, 3, 5, 7, 9, 11];

export const Mod102: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W2, H2);
  const [si, setSi] = useState(0);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W2, H2);
    if (!ctx) return;
    const n = STEPS[si];
    const x0 = 60;
    const x1 = 700;
    const yb = 226;
    const maxD = 0.16;
    const px = (d: number) => x0 + (d / maxD) * (x1 - x0);
    ctx.fillStyle = 'rgba(196,63,82,0.10)';
    ctx.fillRect(px(0.065), 52, x1 - px(0.065), yb - 52);
    // 每个任务一条分布，任务越多越挤
    const span = n === 1 ? 0 : 0.05;
    for (let i = 0; i < n; i += 1) {
      const d = n === 1 ? 0.03 : 0.008 + (i / (n - 1)) * span;
      const near = d > 0.045;
      hump(ctx, px(d), yb, 22, 78, near ? C.orange : C.green, near ? 0.5 : 0.28);
    }
    axis(ctx, x0, yb, x1 - x0, 160);
    // 阈值线
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px(0.065), 44);
    ctx.lineTo(px(0.065), yb);
    ctx.stroke();
    label(ctx, 'Thres', px(0.065), 34, C.orange, 14, 'center');
    paper(ctx, 750, 52, 290, 190);
    label(ctx, '判别压力', 774, 84, C.ink, 15);
    track(ctx, 774, 104, 180, 16, clamp(n / 11, 0, 1), n > 5 ? C.red : C.green);
    label(ctx, String(n), 1026, 112, n > 5 ? C.red : C.green, 18, 'right');
    legend(
      ctx,
      [
        { color: C.green, text: '可区分' },
        { color: C.orange, text: '逼近阈值' },
        { color: C.red, text: '误判风险区' },
      ],
      60,
      288
    );
    ctx.restore();
  }, [si, ref]);

  const n = STEPS[si];
  const fb =
    n === 1
      ? '只有 1 个任务时，单一阈值就足以把已见数据和未见过数据分开。'
      : n >= 9
      ? '论文指出的局限：随着任务数量增长，用同一个阈值同时适配所有任务会带来判别错误。'
      : `已学习 ${n} 个任务：任务分布开始挤向阈值，判别余量变小。`;
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W2} height={H2} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => setSi((s) => Math.max(0, s - 1))} disabled={si === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          任务数 <b>{n}</b>
        </span>
        <button className="tiny" onClick={() => setSi((s) => Math.min(STEPS.length - 1, s + 1))} disabled={si === STEPS.length - 1}>
          下一步 →
        </button>
        <button className="tiny" onClick={() => setSi(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${n >= 9 ? 'bad' : ''}`}>{fb}</div>
    </div>
  );
};

function hump(ctx: Ctx, cx: number, base: number, w: number, h: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w, base);
  ctx.quadraticCurveTo(cx, base - h * 2, cx + w, base);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}