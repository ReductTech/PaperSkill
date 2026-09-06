import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 类比卡 —— 测量员眼看不断变长的路线；超过限度时小地图纸出现红裂纹并抖动，循环。
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

export const AnaOverview: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (s: AnaState) => {
      const phase = s.t * 0.1;
      // 路线长度在 0..1 间循环增长
      const cycle = (s.t % 200) / 200;
      const grow = cycle;
      const limit = 0.62;
      const over = grow > limit;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const x0 = 24;
      const yBase = 86;
      const maxLen = 150;
      const len = 30 + grow * maxLen;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 30; i++) {
        const f = i / 30;
        pts.push({ x: x0 + f * len, y: yBase + Math.sin(f * Math.PI * 3 + phase) * 6 });
      }
      drawTrail(ctx, pts);
      drawSurveyor(ctx, x0, yBase, phase);

      // 右上角小地图纸
      const shake = over ? Math.sin(s.t * 0.8) * 2 : 0;
      const mpX = W - 58 + shake;
      const mpY = 16 + (over ? Math.cos(s.t * 0.7) * 1.3 : 0);
      ctx.fillStyle = '#fffef8';
      ctx.strokeStyle = over ? '#c43f52' : '#9aa7b8';
      ctx.lineWidth = 2;
      ctx.fillRect(mpX, mpY, 40, 30);
      ctx.strokeRect(mpX, mpY, 40, 30);
      if (over) {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mpX + 22, mpY);
        ctx.lineTo(mpX + 14, mpY + 14);
        ctx.lineTo(mpX + 26, mpY + 20);
        ctx.lineTo(mpX + 18, mpY + 30);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#9aa7b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mpX + 6, mpY + 11);
        ctx.lineTo(mpX + 34, mpY + 11);
        ctx.moveTo(mpX + 6, mpY + 21);
        ctx.lineTo(mpX + 34, mpY + 21);
        ctx.stroke();
      }

      ctx.fillStyle = over ? '#c43f52' : '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(over ? '记不下，要崩' : '还记得住', 18, 20);
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

export default AnaOverview;
