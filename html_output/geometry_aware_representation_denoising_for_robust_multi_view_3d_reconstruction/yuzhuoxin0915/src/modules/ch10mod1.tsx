import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 10 章 Module 10.1：结果竞赛（技术视图，P8）
// 重做说明：去掉"相框柱"，改为标准柱状图——基线+网格刻度、错峰升起动画、
// 数字滚动、落定后弹出"领先幅度"标注（虚线+箭头+标签），差距小也一眼可读。
const W = 1080;
const H = 300;

// 图表布局
const ML = 90;          // 左边距（放刻度）
const MR = 60;          // 右边距
const BASE_Y = 246;     // 基线
const PLOT_TOP = 56;    // 绘图区顶部
const BAR_MAX_H = BASE_Y - PLOT_TOP;
const BAR_W = 120;

// 动画时间参数（ms）
const BAR_DUR = 900;    // 单柱升起
const STAGGER = 180;    // 错峰间隔
const TOTAL = BAR_DUR + STAGGER * 2;
const BRACK_DUR = 450;  // 领先标注淡入
const ALL = TOTAL + BRACK_DUR + 80;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// 三种指标的数据（ETH3D 基准，来自 Table 1/2/3）
const METRICS = [
  { name: '位姿 AUC30', unit: '', values: { GARD: 74.68, VAE_MVD: 35.20, Restormer: 57.68 } },
  { name: '重建 F-score', unit: '', values: { GARD: 45.79, VAE_MVD: 25.64, Restormer: 33.97 } },
  { name: '图像 PSNR', unit: 'dB', values: { GARD: 21.88, VAE_MVD: 21.37, Restormer: 20.97 } },
];

const COMPETITORS = [
  { name: 'GARD', color: '#228d5c' },
  { name: 'VAE_MVD', color: '#c43f52' },
  { name: 'Restormer', color: '#f07e47' },
];

// 刻度上限取整：让网格线落在整数上
const niceMax = (v: number) => {
  for (const s of [2, 5, 10, 20, 25]) {
    if (Math.ceil(v / s) <= 5) return Math.ceil(v / s) * s;
  }
  return Math.ceil(v / 25) * 25;
};

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 0, t0: null as number | null, played: false });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState(0);
  const [feedback, setFeedback] = useState({ text: 'GARD 在三个指标上全面领先。切换指标或点「重新对比」，观看柱状升起动画。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { metric: number; t0: number | null }) => {
      const m = METRICS[s.metric];
      const settled = s.t0 === null;
      const el = s.t0 === null ? ALL : performance.now() - s.t0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const maxVal = Math.max(...Object.values(m.values));
      const nMax = niceMax(maxVal);
      const vals = COMPETITORS.map((c) => m.values[c.name as keyof typeof m.values]);
      const cxs = [0.2, 0.5, 0.8].map((f) => ML + (W - ML - MR) * f);
      const yOf = (v: number) => BASE_Y - (v / nMax) * BAR_MAX_H;

      // —— 网格与刻度 ——
      ctx.textAlign = 'right';
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const v = (nMax / steps) * i;
        const y = yOf(v);
        if (i > 0) {
          ctx.strokeStyle = '#dfe5ee';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ML, y);
          ctx.lineTo(W - MR, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = '#8a94a6';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(String(+v.toFixed(1)), ML - 10, y + 4);
      }

      // —— 标题 ——
      ctx.textAlign = 'left';
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 19px "Segoe UI", sans-serif';
      ctx.fillText('ETH3D · ' + m.name, 20, 30);
      const tw = ctx.measureText('ETH3D · ' + m.name).width;
      ctx.fillStyle = '#8a94a6';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('（越高越好）', 20 + tw + 8, 30);

      // —— 基线 ——
      ctx.strokeStyle = '#b9c2d0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ML, BASE_Y);
      ctx.lineTo(W - MR, BASE_Y);
      ctx.stroke();

      // —— 柱：错峰升起 + 数字滚动 ——
      COMPETITORS.forEach((c, i) => {
        const barT = settled ? 1 : Math.min(1, Math.max(0, (el - i * STAGGER) / BAR_DUR));
        const e = easeOut(barT);
        const h = (vals[i] / nMax) * BAR_MAX_H * e;
        const x = cxs[i] - BAR_W / 2;
        const y = BASE_Y - h;
        if (h > 0.5) {
          const r = Math.min(8, h / 2);
          ctx.beginPath();
          ctx.moveTo(x, BASE_Y);
          ctx.lineTo(x, y + r);
          ctx.arcTo(x, y, x + r, y, r);
          ctx.arcTo(x + BAR_W, y, x + BAR_W, y + r, r);
          ctx.lineTo(x + BAR_W, BASE_Y);
          ctx.closePath();
          ctx.globalAlpha = i === 0 ? 1 : 0.85;
          ctx.fillStyle = c.color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        // 数值（滚动中）
        if (e > 0.02) {
          ctx.fillStyle = c.color;
          ctx.font = 'bold 21px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((vals[i] * e).toFixed(2), cxs[i], y - 10);
        }
        // 名称
        ctx.fillStyle = i === 0 ? '#21324a' : '#68778f';
        ctx.font = (i === 0 ? '600 15px' : '15px') + ' "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name, cxs[i], BASE_Y + 26);
        ctx.textAlign = 'left';
      });

      // —— 领先幅度标注（柱子落定后弹出） ——
      const bt = settled ? 1 : easeOut(Math.min(1, Math.max(0, (el - TOTAL) / BRACK_DUR)));
      if (bt > 0 && el >= TOTAL) {
        const secondIdx = vals.indexOf(Math.max(vals[1], vals[2]));
        const delta = vals[0] - vals[secondIdx];
        const pct = (delta / vals[secondIdx]) * 100;
        const yComp = yOf(vals[secondIdx]);
        const yGard = yOf(vals[0]);
        ctx.globalAlpha = bt;
        // 虚线：从第二名柱顶拉到 GARD 柱顶
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(cxs[secondIdx], yComp);
        ctx.lineTo(cxs[0], yComp);
        ctx.stroke();
        ctx.setLineDash([]);
        // 垂直箭头指向 GARD 柱顶
        ctx.beginPath();
        ctx.moveTo(cxs[0], yComp);
        ctx.lineTo(cxs[0], yGard + 6);
        ctx.stroke();
        ctx.fillStyle = '#228d5c';
        ctx.beginPath();
        ctx.moveTo(cxs[0], yGard);
        ctx.lineTo(cxs[0] - 5, yGard + 9);
        ctx.lineTo(cxs[0] + 5, yGard + 9);
        ctx.closePath();
        ctx.fill();
        // 标签胶囊
        const label = '领先 +' + delta.toFixed(2) + m.unit + '（+' + pct.toFixed(1) + '%）';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        const lw = ctx.measureText(label).width + 22;
        const lx = (cxs[0] + cxs[secondIdx]) / 2;
        const ly = yComp - 16 - (1 - bt) * 10;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 1.5;
        const rr = (px: number, py: number, pw: number, ph: number, rad: number) => {
          ctx.beginPath();
          ctx.moveTo(px + rad, py);
          ctx.arcTo(px + pw, py, px + pw, py + ph, rad);
          ctx.arcTo(px + pw, py + ph, px, py + ph, rad);
          ctx.arcTo(px, py + ph, px, py, rad);
          ctx.arcTo(px, py, px + pw, py, rad);
          ctx.closePath();
        };
        rr(lx - lw / 2, ly - 11, lw, 22, 11);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1b6e48';
        ctx.textAlign = 'center';
        ctx.fillText(label, lx, ly + 4);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    };

    const finalFeedback = (mi: number) => {
      const m = METRICS[mi];
      const vals = COMPETITORS.map((c) => m.values[c.name as keyof typeof m.values]);
      const secondIdx = vals.indexOf(Math.max(vals[1], vals[2]));
      const delta = vals[0] - vals[secondIdx];
      const pct = (delta / vals[secondIdx]) * 100;
      return `GARD 领先第二名 +${delta.toFixed(2)}${m.unit}（+${pct.toFixed(1)}%）——优势来自几何感知的特征空间。`;
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.t0 !== null && performance.now() - s.t0 >= ALL) {
        s.t0 = null;
        setFeedback({ text: finalFeedback(s.metric), cls: 'good' });
      }
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => {
      // 第一次滚入视野时自动播放一次
      if (!stateRef.current.played) {
        stateRef.current.played = true;
        stateRef.current.t0 = performance.now();
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const play = (mi: number) => {
    stateRef.current.metric = mi;
    stateRef.current.t0 = performance.now();
    setMetric(mi);
    setFeedback({ text: `对比进行中：${METRICS[mi].name}……`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {METRICS.map((m, i) => (
          <button key={m.name} className={`chip ${metric === i ? 'selected' : ''}`} onClick={() => play(i)}>
            {m.name}
          </button>
        ))}
        <button className="chip selected" onClick={() => play(metric)}>重新对比</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
