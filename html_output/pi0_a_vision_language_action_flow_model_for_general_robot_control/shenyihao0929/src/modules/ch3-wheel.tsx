import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawClay,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch3 module: a τ slider (0 -> 1). Left 55% — the spinning wheel with the
// clay morphing via drawClay(τ) plus a small velocity-arrow layer that fades
// out as τ -> 1. Right 45% — a trajectory interpolation strip: jittered dots
// whose jitter amplitude is proportional to (1 - τ) settle onto the smooth
// mean curve. This interpolated state is exactly what the network sees in
// training.
const W = 1080;
const H = 280;

// Mean trajectory on the right panel (pick-and-place arc).
const CURVE: [number, number][] = [
  [640, 236],
  [770, 108],
  [920, 108],
  [1040, 196],
];

function curveAt(t: number): [number, number] {
  const mt = 1 - t;
  const x =
    mt ** 3 * CURVE[0][0] +
    3 * mt * mt * t * CURVE[1][0] +
    3 * mt * t * t * CURVE[2][0] +
    t ** 3 * CURVE[3][0];
  const y =
    mt ** 3 * CURVE[0][1] +
    3 * mt * mt * t * CURVE[1][1] +
    3 * mt * t * t * CURVE[2][1] +
    t ** 3 * CURVE[3][1];
  return [x, y];
}

// Deterministic per-dot jitter offsets in [-0.5, 0.5]^2.
const JITTER: [number, number][] = Array.from({ length: 16 }, (_, i) => {
  const r1 = Math.sin(i * 127.1 + 1.7) * 43758.5453;
  const r2 = Math.sin(i * 269.5 + 3.2) * 23421.631;
  return [r1 - Math.floor(r1) - 0.5, r2 - Math.floor(r2) - 0.5] as [number, number];
});

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(a - 0.45), y2 - 7 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 7 * Math.cos(a + 0.45), y2 - 7 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export const Ch3Wheel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ tau: number }>({ tau: 0.3 });
  const rafRef = useRef<number | null>(null);
  const [tau, setTau] = useState(0.3);
  const [feedback, setFeedback] = useState({
    text: 'τ=0.30：七分噪声三分真迹——网络此刻学的是『往哪儿推』。',
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

    const render = (ms: number) => {
      const tau = stateRef.current.tau;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(596, 16);
      ctx.lineTo(596, 264);
      ctx.stroke();

      // ---- Left 55%: wheel + clay morphing with τ ----
      drawWheel(ctx, 250, 187, 62, { spin: ms / 520 });
      drawClay(ctx, 250, 160, tau, { size: 1.4, t: ms / 600 });

      // Velocity-arrow layer: fades as τ -> 1.
      const va = (1 - tau) * 0.9;
      if (va > 0.04) {
        drawArrow(ctx, 196, 158, 218, 136, C.orange, 2.5, va);
        drawArrow(ctx, 304, 158, 282, 136, C.orange, 2.5, va);
        drawArrow(ctx, 218, 122, 234, 108, C.orange, 2.5, va);
        drawArrow(ctx, 282, 122, 266, 108, C.orange, 2.5, va);
      }

      // ---- Right 45%: jittered dots settling onto the smooth curve ----
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const [sx, sy] = curveAt(0);
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= 40; i++) {
        const [x, y] = curveAt(i / 40);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      const amp = (1 - tau) * 46;
      const dotCol = lerpColor(C.orange, C.green, tau);
      JITTER.forEach((j, i) => {
        const [mx, my] = curveAt((i + 0.5) / JITTER.length);
        ctx.beginPath();
        ctx.arc(mx + j[0] * amp * 1.6, my + j[1] * amp, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = dotCol;
        ctx.fill();
      });

      drawSceneLabel(ctx, '噪声→成形', 16, 24, { color: C.orange });
      drawSceneLabel(ctx, '轨迹插值', 614, 24, { color: C.muted });
      drawLegend(ctx, [['噪声抖动', C.orange], ['平滑轨迹', C.green]], 614, 266);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const tick = (ms: number) => {
      render(ms);
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

  const onTau = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 1);
    stateRef.current.tau = v;
    setTau(v);
    if (v > 0.85) {
      setFeedback({ text: '接近成形：再推几步就是可执行的动作段。', cls: 'good' });
    } else {
      const sig = Math.round(v * 10);
      const noise = 10 - sig;
      setFeedback({
        text: `τ=${v.toFixed(2)}：${ZH[noise]}分噪声${ZH[sig]}分真迹——网络此刻学的是『往哪儿推』。`,
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          流时间 τ <span className="val">τ={tau.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={1} step={0.01} value={tau} onChange={onTau} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Wheel;
