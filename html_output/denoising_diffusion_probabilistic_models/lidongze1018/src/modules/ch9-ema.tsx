import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const AXIS = '#d7deea';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, h - 18);
  ctx.lineTo(w - 20, h - 18);
  ctx.stroke();
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 7, y - 7, w + 14, h + 14);
  ctx.fillStyle = '#eaf1fb';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawOutside(ctx: CanvasRenderingContext2D, clip: Rect, clarity: number): void {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  ctx.globalAlpha = 0.2 + 0.8 * c;
  ctx.fillStyle = '#6fa96b';
  ctx.beginPath();
  ctx.moveTo(clip.x, clip.y + clip.h);
  ctx.lineTo(clip.x + clip.w * 0.28, clip.y + clip.h * 0.5);
  ctx.lineTo(clip.x + clip.w * 0.58, clip.y + clip.h * 0.78);
  ctx.lineTo(clip.x + clip.w, clip.y + clip.h * 0.42);
  ctx.lineTo(clip.x + clip.w, clip.y + clip.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(clip.x + clip.w * 0.76, clip.y + clip.h * 0.26, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFog(ctx: CanvasRenderingContext2D, clip: Rect, density: number, seed: number): void {
  const d = clamp(density, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  ctx.fillStyle = '#c4d2b6';
  const cells = 46;
  for (let i = 0; i < cells; i++) {
    const fx = ((i * 137 + seed * 41) % 997) / 997;
    const fy = ((i * 71 + seed * 23) % 991) / 991;
    const r = 10 + ((i * 13) % 18);
    if (i / cells < d) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(clip.x + fx * clip.w, clip.y + fy * clip.h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCloth(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MUTED;
  ctx.fillRect(x - 2, y + r - 2, 4, 12);
}

function drawWipePath(ctx: CanvasRenderingContext2D, points: Pt[], progress: number, color: string): void {
  if (points.length < 2) return;
  const n = Math.max(1, Math.floor(clamp(progress, 0, 1) * (points.length - 1)) + 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, label: string): void {
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  drawSceneLabel(ctx, label, x + 20, y + 6);
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = TEXT;
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; text: string }>,
  x: number,
  y: number
): void {
  let cx = x;
  ctx.font = '15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 14, 14);
    ctx.fillStyle = MUTED;
    ctx.fillText(it.text, cx + 20, y + 1);
    cx += 20 + ctx.measureText(it.text).width + 26;
  });
}

function feedbackFor(d: number): { text: string; cls: string } {
  if (d >= 0.999) {
    return { text: '论文设置（0.9999）：EMA 大幅平滑参数轨迹；论文未对 EMA 做消融，此处为经验性解释。', cls: 'good' };
  }
  if (d < 0.99) {
    return { text: '衰减太低：EMA 几乎不起作用（教学示意）。', cls: '' };
  }
  return { text: '中等衰减：轨迹有一定平滑，但仍能看到抖动（教学示意）。', cls: '' };
}

export const Ch9Ema: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ decay: number; t: number }>({ decay: 0.9999, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [decay, setDecay] = useState(0.9999);
  const [feedback, setFeedback] = useState(feedbackFor(0.9999));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { decay: number; t: number }) => {
      clearScene(ctx, W, H);

      const x0 = 90;
      const x1 = 1000;
      const yTop = 62;
      const yBase = 218;
      const N = 150;

      const raw: number[] = [];
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1);
        const base = 0.5 + 0.2 * Math.sin(x * Math.PI * 1.4);
        const noise =
          0.14 * Math.sin(i * 2.7) + 0.09 * Math.sin(i * 5.3 + 1.1) + 0.05 * Math.sin(i * 9.1 + 2.2);
        raw.push(base + noise);
      }

      const u = map(s.decay, 0.9, 0.9999, 0, 1);
      const alpha = lerp(0.85, 0.05, u);
      const ema: number[] = [];
      let e = raw[0];
      for (let i = 0; i < N; i++) {
        e = alpha * e + (1 - alpha) * raw[i];
        ema.push(e);
      }

      const toX = (i: number) => lerp(x0, x1, i / (N - 1));
      const toY = (v: number) => clamp(map(v, 0.05, 0.95, yBase, yTop), yTop, yBase);

      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, yTop - 12);
      ctx.lineTo(x0, yBase);
      ctx.lineTo(x1, yBase);
      ctx.stroke();

      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 2;
      ctx.beginPath();
      raw.forEach((v, i) => {
        const X = toX(i);
        const Y = toY(v);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.stroke();

      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ema.forEach((v, i) => {
        const X = toX(i);
        const Y = toY(v);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.stroke();

      ctx.fillStyle = TEXT;
      ctx.font = '700 20px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('EMA 衰减 = ' + s.decay.toFixed(4), 90, 36);
      ctx.font = '700 17px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText('参数轨迹（教学示意）', 90, H - 20);
      drawLegend(
        ctx,
        [
          { color: AXIS, text: '原始参数轨迹' },
          { color: GREEN, text: 'EMA 平滑轨迹' },
        ],
        280,
        H - 20
      );
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(ev.target.value) / 10000, 0.9, 0.9999);
    stateRef.current.decay = v;
    setDecay(v);
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          EMA 衰减 <span className="val">{decay.toFixed(4)}</span>
        </label>
        <input
          type="range"
          min={9000}
          max={9999}
          step={1}
          value={Math.round(decay * 10000)}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Ema;
