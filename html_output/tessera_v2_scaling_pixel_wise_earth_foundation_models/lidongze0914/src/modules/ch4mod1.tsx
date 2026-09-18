import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const BUDGETS = [
  '1.3×10¹⁵',
  '3.8×10¹⁵',
  '1.1×10¹⁶',
  '3.3×10¹⁶',
  '9.7×10¹⁶',
  '2.9×10¹⁷',
  '8.4×10¹⁷',
  '2.5×10¹⁸',
  '7.3×10¹⁸',
];

const INITIAL_FB = '拖动算力预算，注意每个预算都有它自己的最清晰点。';
const MISS_FB = '焦距偏离顶点，星点发虚——这个尺寸不是该预算下的算力最优选择。';
const HIT_FB = '星点最清晰：顶点就是该预算的算力最优尺寸。';
const HIGH_FB = '预算增大，编码器顶点持续右移；投影器顶点几乎原地不动（指数 0.011，区间跨零）。';

const vertexNorm = (i: number) => 0.2 + 0.08125 * i;
const focusNorm = (i: number) => 0.42 + 0.006 * i;
const projNorm = (i: number) => 0.52 + 0.002 * i;

function feedbackFor(idx: number, touched: boolean): { text: string; cls: string } {
  if (!touched) return { text: INITIAL_FB, cls: '' };
  if (idx === 8) return { text: HIGH_FB, cls: 'good' };
  if (Math.abs(focusNorm(idx) - vertexNorm(idx)) <= 0.035) return { text: HIT_FB, cls: 'good' };
  return { text: MISS_FB, cls: 'bad' };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 24);
  ctx.lineTo(W, H - 24);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const stars: Array<[number, number]> = [
    [24, 22],
    [120, 14],
    [420, 30],
    [470, 16],
    [560, 38],
    [620, 20],
    [700, 44],
    [1058, 60],
  ];
  ctx.fillStyle = 'rgba(104, 119, 143, 0.5)';
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScope(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#27446e';
  roundRect(ctx, 48, 160, 190, 36, 14);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 196);
  ctx.lineTo(150, 254);
  ctx.moveTo(110, 254);
  ctx.lineTo(190, 254);
  ctx.stroke();
}

function drawKnob(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -11);
  ctx.stroke();
  ctx.restore();
  ctx.lineCap = 'butt';
}

function drawEyepiece(ctx: CanvasRenderingContext2D, blur: number, sharp: boolean, t: number) {
  const cx = 300;
  const cy = 116;
  const r = 88;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(184, 201, 167, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();

  const fieldStars: Array<[number, number]> = [
    [248, 84],
    [354, 96],
    [272, 158],
    [338, 150],
    [300, 70],
  ];
  for (let i = 0; i < fieldStars.length; i++) {
    const [x, y] = fieldStars[i];
    const alpha = 0.22 + 0.18 * Math.sin(t * 1.6 + i * 2.1);
    ctx.fillStyle = `rgba(104, 119, 143, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const col = sharp ? '#228d5c' : '#c43f52';
  if (sharp) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const len = 26 - blur * 10;
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.globalAlpha = sharp ? 1 : 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - len, cy);
  ctx.lineTo(cx + len, cy);
  ctx.moveTo(cx, cy - len);
  ctx.lineTo(cx, cy + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3 + blur * 5, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

interface LegendItem {
  color: string;
  label: string;
}

function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number) {
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 11, 14, 11);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 18;
  }
}

interface WidgetState {
  idx: number;
  touched: boolean;
  visited: number[];
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WidgetState>({ idx: 0, touched: false, visited: [0] });
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [feedback, setFeedback] = useState({ text: INITIAL_FB, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx);
      drawSky(ctx);
      drawScope(ctx);

      const vNorm = vertexNorm(s.idx);
      const fNorm = focusNorm(s.idx);
      const diff = Math.abs(fNorm - vNorm);
      const sharp = diff <= 0.035;
      const blur = clamp(diff / 0.32, 0, 1);
      drawKnob(ctx, 80, 178, lerp(-0.9, 0.9, fNorm));
      drawEyepiece(ctx, blur, sharp, t);

      drawSceneLabel(ctx, '口径', 52, 148, '#68778f');
      drawSceneLabel(ctx, '焦点', 106, 218, '#68778f');

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      roundRect(ctx, 800, 24, 250, 216, 8);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      roundRect(ctx, 800, 24, 250, 216, 8);
      ctx.clip();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(824, 196);
      ctx.lineTo(1026, 196);
      ctx.moveTo(824, 56);
      ctx.lineTo(824, 196);
      ctx.stroke();

      const apexX = map(vNorm, 0, 1, 856, 1000);
      const apexY = 76;
      const k = 0.012;
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 824; x <= 1026; x += 4) {
        const y = apexY + k * (x - apexX) * (x - apexX);
        if (x === 824) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const fx = map(fNorm, 0, 1, 856, 1000);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(39, 68, 110, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, 196);
      ctx.lineTo(fx, 60);
      ctx.stroke();
      ctx.setLineDash([]);
      const fy = apexY + k * (fx - apexX) * (fx - apexX);
      if (fy <= 196) {
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(apexX, apexY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();

      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.moveTo(apexX, 194);
      ctx.lineTo(apexX - 6, 204);
      ctx.lineTo(apexX + 6, 204);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const visited = [...s.visited].sort((a, b) => a - b);
      const trailX = (i: number) => map(i, 0, 8, 460, 1020);
      const encY = (i: number) => map(vertexNorm(i), 0.1, 0.9, 274, 250);
      const pjY = (i: number) => map(projNorm(i), 0.1, 0.9, 274, 250);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      visited.forEach((i, n) => {
        const x = trailX(i);
        const y = encY(i);
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      visited.forEach((i, n) => {
        const x = trailX(i);
        const y = pjY(i);
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      for (const i of visited) {
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(trailX(i), encY(i), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(trailX(i), pjY(i), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLegend(
        ctx,
        [
          { color: '#f07e47', label: '编码器' },
          { color: '#27446e', label: '投影器' },
        ],
        440,
        246
      );
    };

    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    const s = stateRef.current;
    s.idx = idx;
    s.touched = true;
    if (!s.visited.includes(idx)) s.visited.push(idx);
    setBudgetIdx(idx);
    setFeedback(feedbackFor(idx, true));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          算力预算 <span className="val">{BUDGETS[budgetIdx]} FLOPs</span>
        </label>
        <input type="range" min={0} max={8} step={1} value={budgetIdx} onChange={onBudget} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
