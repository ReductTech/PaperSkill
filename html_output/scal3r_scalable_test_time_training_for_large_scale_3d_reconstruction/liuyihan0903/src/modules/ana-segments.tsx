import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 类比卡 —— 长路切成 4 段（相邻段有重叠带），测量员从左到右走过每段，循环。
const W = 244;
const H = 130;

interface AnaState {
  t: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.6, h * 0.82);
  ctx.quadraticCurveTo(w * 0.85, h * 0.9, w, h * 0.78);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color = '#92400e', width = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

function drawSurveyor(ctx: CanvasRenderingContext2D, x: number, y: number, phase = 0, color = '#27446e') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 13, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y - 1);
  ctx.stroke();
  const s = Math.sin(phase) * 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.lineTo(x - 3 - s, y + 6);
  ctx.moveTo(x, y - 1);
  ctx.lineTo(x + 3 + s, y + 6);
  ctx.stroke();
}

export const AnaSegments: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AnaState>({ t: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const x0 = 18;
    const x1 = W - 18;
    const span = x1 - x0;
    const CHUNKS = 4;
    const cellW = span / CHUNKS;

    const render = (s: AnaState) => {
      const phase = s.t * 0.1;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const yBase = 74;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        pts.push({ x: x0 + f * span, y: yBase + Math.sin(f * Math.PI * 4 + phase) * 5 });
      }
      drawTrail(ctx, pts);

      // 重叠带（相邻段之间的阴影）
      for (let k = 0; k < CHUNKS - 1; k++) {
        const bx = x0 + (k + 1) * cellW - 10;
        ctx.fillStyle = 'rgba(39,68,110,0.16)';
        ctx.fillRect(bx, yBase - 18, 20, 36);
      }
      // 分段竖线
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      for (let k = 1; k < CHUNKS; k++) {
        const xx = x0 + k * cellW;
        ctx.beginPath();
        ctx.moveTo(xx, yBase - 20);
        ctx.lineTo(xx, yBase + 20);
        ctx.stroke();
      }

      // 测量员沿全程往复行走
      const cyc = (s.t % 240) / 240;
      const sx = x0 + cyc * span;
      drawSurveyor(ctx, sx, yBase + 2, phase);
      // 当前所在段高亮
      const curK = Math.min(CHUNKS - 1, Math.floor(cyc * CHUNKS));
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 + curK * cellW + 1, yBase - 20, cellW - 2, 40);

      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('有重叠的 4 段', 16, 20);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default AnaSegments;
