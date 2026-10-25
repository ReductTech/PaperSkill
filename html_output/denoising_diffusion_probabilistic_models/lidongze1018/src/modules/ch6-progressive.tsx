import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const LANDMARKS = [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100];

const RD: Record<number, { rate: number; dist: number }> = {
  1000: { rate: 1.77581, dist: 0.95136 },
  900: { rate: 0.11994, dist: 12.02277 },
  800: { rate: 0.05415, dist: 18.47482 },
  700: { rate: 0.02866, dist: 24.43656 },
  600: { rate: 0.01507, dist: 30.80948 },
  500: { rate: 0.00716, dist: 38.03236 },
  400: { rate: 0.00282, dist: 46.12765 },
  300: { rate: 0.00081, dist: 54.18826 },
  200: { rate: 0.00013, dist: 60.9717 },
  100: { rate: 0.0, dist: 67.60125 },
};

const PLOT = { x: 470, y: 44, w: 552, h: 182 };
const RATE_MAX = 2.0;
const DIST_MAX = 70;
const DIST_MIN = 0.95136;
const DIST_RANGE_MAX = 67.60125;

function pointXY(lm: number): { x: number; y: number } {
  const d = RD[lm];
  return {
    x: map(d.rate, 0, RATE_MAX, PLOT.x, PLOT.x + PLOT.w),
    y: map(d.dist, 0, DIST_MAX, PLOT.y + PLOT.h, PLOT.y),
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
): void {
  ctx.fillStyle = '#21324a';
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
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
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = clamp(clarity, 0, 1);
  ctx.fillStyle = '#6fa96b';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.78);
  ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.48, x + w * 0.6, y + h * 0.82);
  ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.96, x + w, y + h * 0.7);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(x + w * 0.76, y + h * 0.28, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.74);
  ctx.lineTo(x + w * 0.27, y + h * 0.4);
  ctx.lineTo(x + w * 0.34, y + h * 0.74);
  ctx.closePath();
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
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = d * 0.82;
  ctx.fillStyle = '#c4d2b6';
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = d * 0.5;
  ctx.fillStyle = '#b8c9a7';
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = 0; i < 26; i++) {
    s = (s * 16807) % 2147483647;
    const px = x + ((s - 1) / 2147483646) * w;
    s = (s * 16807) % 2147483647;
    const py = y + ((s - 1) / 2147483646) * h;
    s = (s * 16807) % 2147483647;
    const r = 10 + ((s - 1) / 2147483646) * 28;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const Ch6Progressive: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ lm: number }>({ lm: 1000 });
  const rafRef = useRef<number | null>(null);
  const [lm, setLm] = useState<number>(1000);
  const [feedback, setFeedback] = useState({
    text: '论文 Table 4：接收步数 T−t+1 = 1000 时，率 = 1.77581 bits/dim、失真 = 0.95136 RMSE（CIFAR10 测试集终态）。大部分码长用于描述难以察觉的细节。',
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

    const render = (s: { lm: number }): void => {
      clearScene(ctx, W, H);
      const d = RD[s.lm];
      const clarity = clamp(
        map(d.dist, DIST_RANGE_MAX, DIST_MIN, 0.12, 0.95),
        0.12,
        0.95
      );

      const hx = 40;
      const hy = 44;
      const hw = 380;
      const hh = 182;
      ctx.fillStyle = '#92400e';
      roundRect(ctx, hx - 6, hy - 6, hw + 12, hh + 12, 8);
      ctx.fill();
      ctx.fillStyle = '#eaf1fb';
      ctx.fillRect(hx, hy, hw, hh);
      drawOutside(ctx, hx, hy, hw, hh, clarity);
      drawFog(ctx, hx, hy, hw, hh, 1 - clarity, 31 + s.lm);

      const block = lerp(52, 9, clarity);
      ctx.save();
      ctx.beginPath();
      ctx.rect(hx, hy, hw, hh);
      ctx.clip();
      ctx.strokeStyle = 'rgba(39,68,110,' + (0.32 * (1 - clarity)).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let gx = hx; gx <= hx + hw; gx += block) {
        ctx.beginPath();
        ctx.moveTo(gx, hy);
        ctx.lineTo(gx, hy + hh);
        ctx.stroke();
      }
      for (let gy = hy; gy <= hy + hh; gy += block) {
        ctx.beginPath();
        ctx.moveTo(hx, gy);
        ctx.lineTo(hx + hw, gy);
        ctx.stroke();
      }
      ctx.restore();
      drawSceneLabel(ctx, 'x̂₀ 由粗到细', hx, hy + hh + 26);

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.x, PLOT.y);
      ctx.lineTo(PLOT.x, PLOT.y + PLOT.h);
      ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h);
      ctx.stroke();
      drawSceneLabel(ctx, '率 (bits/dim) →', PLOT.x + PLOT.w - 150, PLOT.y + PLOT.h + 30);
      ctx.save();
      ctx.translate(PLOT.x - 30, PLOT.y + 130);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 15px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('失真 (RMSE) →', 0, 0);
      ctx.restore();

      const ordered = [...LANDMARKS].reverse();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ordered.forEach((key, i) => {
        const p = pointXY(key);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ordered.forEach((key) => {
        const p = pointXY(key);
        const selected = key === s.lm;
        ctx.fillStyle = selected ? '#d97706' : '#27446e';
        ctx.beginPath();
        ctx.arc(p.x, p.y, selected ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
        if (selected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };

    const tick = (): void => {
      render(stateRef.current);
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

  const select = (value: number): void => {
    stateRef.current.lm = value;
    setLm(value);
    const d = RD[value];
    setFeedback({
      text: `论文 Table 4：T−t+1 = ${value} 时，率 ${d.rate.toFixed(5)} bits/dim、失真 ${d.dist.toFixed(5)} RMSE。大部分码长用于描述难以察觉的细节。`,
      cls: '',
    });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    let best = -1;
    let bestD = 28;
    LANDMARKS.forEach((key) => {
      const p = pointXY(key);
      const dd = Math.hypot(p.x - sx, p.y - sy);
      if (dd < bestD) {
        bestD = dd;
        best = key;
      }
    });
    if (best >= 0) select(best);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {LANDMARKS.map((key) => (
          <button
            key={key}
            className={`chip ${lm === key ? 'selected' : ''}`}
            onClick={() => select(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="source-note">
        按键 = T−t+1（接收步数，越大表示接收到的信息越多）；数据逐值转写自论文 Table 4 / Figure 5（CIFAR10 测试集率失真），未做改动。
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Progressive;
