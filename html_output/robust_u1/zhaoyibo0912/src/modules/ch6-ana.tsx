import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第六章类比动画（560×140，3.6 s 自动循环）。
// 一张照片浸在显影盘里，影像一点点浮现直至完全清晰（一次连续显影）；
// 盘里的液面只有极轻微的波纹起伏。唯一运动主体＝照片上浮现的影像。

const W = 560;
const H = 140;
const LOOP_MS = 3600;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

/** 固定种子的伪随机数：保证斑点在每帧重绘时位置稳定。 */
function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = h - 26;
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, top, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3);
  ctx.lineTo(w, top + 3);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor = '#d7deea'
) {
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const d = clamp(damage, 0, 1);
  ctx.save();
  roundRectPath(ctx, x + 3, y + 3, w - 6, h - 6, 4);
  ctx.clip();

  const rndSp = prng(2029);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + rndSp() * (w - 10);
    const sy = y + 4 + rndSp() * (h - 10);
    const s = 1 + rndSp() * 2;
    ctx.fillStyle = rndSp() > 0.5 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }

  const rndCr = prng(613);
  const cracks = Math.round(4 * d);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < cracks; c++) {
    let cx = x + 8 + rndCr() * (w - 16);
    let cy = y + 8 + rndCr() * (h - 16);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 0; k < 3; k++) {
      cx = clamp(cx + (rndCr() - 0.5) * 22, x + 5, x + w - 5);
      cy = clamp(cy + (rndCr() - 0.5) * 22, y + 5, y + h - 5);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  clarity: number
) {
  const a = 0.15 + 0.85 * clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.15, r * 0.55, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();

  if (clarity >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 8, r * 0.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTray(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  roundRectPath(ctx, x, y, w, 58, 12);
  ctx.fillStyle = '#76906a';
  ctx.fill();
  roundRectPath(ctx, x + 5, y + 5, w - 10, 44, 9);
  ctx.fillStyle = '#f5f8f0';
  ctx.fill();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y - 32);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 32);
  ctx.lineTo(x + 16, y - 32);
  ctx.lineTo(x + 9, y - 48);
  ctx.lineTo(x - 9, y - 48);
  ctx.closePath();
  ctx.fill();
}

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      // 静态道具：台灯
      drawLamp(ctx, 62, 132);

      // 显影盘
      drawTray(ctx, 232, 78, 186);

      // 唯一运动主体：照片在显影盘里一点点浮现
      const u = easeInOutQuad(t);
      drawPhoto(ctx, 250, 55, 100, 75, 1 - u);
      drawFace(ctx, 300, 88, 20, u);

      // 液面：一条极轻微的波纹线（环境动效，幅度很小）
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const p = i / 48;
        const wx = lerp(246, 404, p);
        const wy = 112 + Math.sin(p * Math.PI * 4 + t * Math.PI * 2) * 1.4;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    };

    let last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      const dt = Math.min(now - last, 64);
      last = now;
      tRef.current = (tRef.current + dt / LOOP_MS) % 1;
      render(tRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch6Ana;
