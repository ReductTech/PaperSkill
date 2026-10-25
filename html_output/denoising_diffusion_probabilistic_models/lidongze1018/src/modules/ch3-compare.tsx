import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const DURATION = 2400;

const COL = {
  field: '#f5f8f0',
  glass: '#eaf1fb',
  glassLine: '#d7deea',
  fog: '#c4d2b6',
  frame: '#92400e',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#d97706',
  purple: '#7c3aed',
  outdoor: '#6fa96b',
  sun: '#f07e47',
  tree: '#76906a',
  ink: '#21324a',
  slate: '#68778f',
};

interface Pt {
  x: number;
  y: number;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = COL.field;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#dbe4d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.lineTo(w, h - 22);
  ctx.stroke();
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = COL.glass;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.frame;
  ctx.lineWidth = 8;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.strokeStyle = COL.glassLine;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
}

function drawOutside(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clarity: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 10, y + 10, w - 20, h - 20);
  ctx.clip();
  ctx.globalAlpha = clamp(clarity, 0, 1);
  ctx.fillStyle = COL.sun;
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.3, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.outdoor;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x + w * 0.55, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.9, x + w, y + h * 0.68);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.tree;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.25, y + h * 0.6, 16, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  density: number,
  seed: number
): void {
  const d = clamp(density, 0, 1);
  if (d <= 0.001) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 10, y + 10, w - 20, h - 20);
  ctx.clip();
  ctx.globalAlpha = 0.32 + 0.4 * d;
  ctx.fillStyle = COL.fog;
  const n = Math.round(6 + d * 22);
  let s = seed || 1;
  const rnd = (): number => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 1000) / 1000;
  };
  for (let i = 0; i < n; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    const prad = 18 + rnd() * 44 * (0.5 + d);
    ctx.beginPath();
    ctx.arc(px, py, prad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWipePath(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  progress: number,
  color: string,
  width = 8
): void {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const total = points.length - 1;
  const upto = clamp(progress, 0, 1) * total;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i <= Math.floor(upto); i++) ctx.lineTo(points[i].x, points[i].y);
  const frac = upto - Math.floor(upto);
  if (frac > 0 && Math.floor(upto) + 1 < points.length) {
    const a = points[Math.floor(upto)];
    const b = points[Math.floor(upto) + 1];
    ctx.lineTo(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
  }
  ctx.stroke();
  ctx.restore();
}

function drawStreaks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amount: number
): void {
  const n = Math.round(clamp(amount, 0, 1) * 5);
  if (n <= 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(196,63,82,0.45)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yy = y + h * (0.26 + (i % 5) * 0.13);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, yy);
    ctx.bezierCurveTo(x + w * 0.35, yy - 8, x + w * 0.6, yy + 8, x + w * 0.86, yy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillStyle = COL.red;
  ctx.fillRect(x, y - 11, 14, 14);
  ctx.fillStyle = COL.ink;
  ctx.fillText('旧法残雾', x + 20, y);
  ctx.fillStyle = COL.green;
  ctx.fillRect(x + 108, y - 11, 14, 14);
  ctx.fillStyle = COL.ink;
  ctx.fillText('新法残雾', x + 128, y);
  ctx.restore();
}

function drawPane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  smoke: number,
  accent: string,
  label: string,
  streaks: number,
  p: number,
  kind: 'old' | 'new'
): void {
  ctx.save();
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillStyle = accent;
  ctx.fillText(label, x, y - 10);
  drawWindow(ctx, x, y, w, h);
  const clarity = clamp(1 - smoke, 0, 1);
  drawOutside(ctx, x, y, w, h, clarity);
  drawFog(ctx, x, y, w, h, smoke, kind === 'old' ? 7 : 13);
  if (streaks > 0) drawStreaks(ctx, x, y, w, h, streaks);
  let cx: number;
  let cy: number;
  if (kind === 'old') {
    cx = lerp(x + 50, x + w - 50, clamp(p, 0, 1));
    cy = y + h * 0.55;
  } else {
    const local = p * 3;
    const idx = clamp(Math.floor(local), 0, 2);
    const frac = clamp(local - idx, 0, 1);
    cx = lerp(x + 50, x + w - 50, frac);
    cy = y + h * 0.3 + idx * (h * 0.2);
  }
  drawCloth(ctx, cx, cy, 16, kind === 'old' ? COL.red : COL.green);
  ctx.restore();
}

export const Ch3Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef({ p: 0, running: false, start: 0, done: false });
  const rafRef = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '按下「开始对比」：教学示意动画，演示两种擦法（一步回归 vs 逐步去噪）的差异。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const s = animRef.current;
      clearScene(ctx, W, H);
      const oldSmoke = clamp(0.85 * (1 - 0.35 * s.p) + 0.35, 0, 1);
      const newSmoke = clamp(0.85 * (1 - s.p), 0, 1);
      drawPane(ctx, 30, 34, 500, 220, oldSmoke, COL.red, '旧：一步回归', oldSmoke, s.p, 'old');
      drawPane(ctx, 550, 34, 500, 220, newSmoke, COL.green, '新：逐步去噪', 0, s.p, 'new');
      drawLegend(ctx, 410, 272);
      ctx.save();
      ctx.fillStyle = '#8b97ab';
      ctx.font = '600 13px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('教学示意（非论文实验结果）', 1050, 24);
      ctx.restore();
    };

    const tick = (): void => {
      const s = animRef.current;
      if (s.running) {
        s.p = clamp((performance.now() - s.start) / DURATION, 0, 1);
        if (s.p >= 1 && !s.done) {
          s.done = true;
          s.running = false;
          setFeedback({
            text: '教学示意：逐步修正能持续压低残差（“水痕”）。论文依据：直接预测 x₀ 在实验早期得到更差的样本质量（Section 3.2）；完整对比见第 5 章消融。',
            cls: 'good',
          });
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = (): void => {
    animRef.current = { p: 0, running: true, start: performance.now(), done: false };
    setStarted(true);
    setFeedback({ text: '同一起点，同时开始。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={onStart}>
          {started ? '重播对比' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Compare;
