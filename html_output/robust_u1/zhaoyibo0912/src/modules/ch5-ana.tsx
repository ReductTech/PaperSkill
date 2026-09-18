import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第五章类比动画（560×140，3.2 s 自动循环）。
// 一只手举着修复好的照片，靠到完好的原片旁边对照（先对纹理、再对内容），
// 靠得最近时两片照片上方浮现一个绿色对勾。唯一运动主体＝手与它举着的照片。

const W = 560;
const H = 140;
const LOOP_MS = 3200;

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

  const rndSp = prng(1337);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + rndSp() * (w - 10);
    const sy = y + 4 + rndSp() * (h - 10);
    const s = 1 + rndSp() * 2;
    ctx.fillStyle = rndSp() > 0.5 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }

  const rndCr = prng(907);
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

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#76906a';
  roundRectPath(ctx, -14, -12, 28, 24, 8);
  ctx.fill();
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 8, -11);
    ctx.lineTo(-8 + i * 8, -28);
    ctx.stroke();
  }
  ctx.restore();
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

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 静态道具：台灯 + 立在桌上的完好原片
      drawLamp(ctx, 62, 132);
      drawPhoto(ctx, 150, 30, 100, 75, 0.06);
      drawFace(ctx, 200, 64, 20, 0.92);

      // 唯一运动主体：手举着修复好的照片，靠近原片再退回
      const back = 1 - Math.abs(2 * t - 1);
      const u = easeInOutQuad(back);
      const holdX = lerp(420, 262, u);
      drawPhoto(ctx, holdX, 30, 100, 75, lerp(0.5, 0.12, u), '#228d5c');
      drawFace(ctx, holdX + 50, 64, 20, lerp(0.6, 0.96, u));
      drawHand(ctx, holdX + 94, 102, -0.4);

      // 靠到最近时，两片照片上方浮现绿色对勾
      const ca = clamp((u - 0.8) / 0.2, 0, 1);
      if (ca > 0.01) {
        ctx.save();
        ctx.globalAlpha = ca;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(238, 16);
        ctx.lineTo(246, 24);
        ctx.lineTo(262, 8);
        ctx.stroke();
        ctx.restore();
      }
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

export default Ch5Ana;
