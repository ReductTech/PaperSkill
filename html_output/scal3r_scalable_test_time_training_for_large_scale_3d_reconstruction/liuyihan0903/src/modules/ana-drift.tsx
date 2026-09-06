import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 类比卡 —— 左右两段小地图各自独立绘出，接缝处逐渐错开、出现红缝隙，循环。
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
  ctx.quadraticCurveTo(w * 0.3, h * 0.72, w * 0.6, h * 0.84);
  ctx.quadraticCurveTo(w * 0.85, h * 0.9, w, h * 0.8);
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

export const AnaDrift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 漂移量在 0..1 间循环增长后复位，表现“越拼越歪”
      const cyc = (s.t % 200) / 200;
      const drift = cyc * 14;
      const seamX = W / 2;
      const yBase = 72;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // 左段（固定）
      const leftPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        leftPts.push({ x: 22 + f * (seamX - 34), y: yBase + Math.sin(f * Math.PI * 2) * 5 });
      }
      drawTrail(ctx, leftPts);

      // 右段（随时间旋转 + 上移）
      const rightPts: { x: number; y: number }[] = [];
      const ox = seamX + 12;
      const oy = yBase - drift;
      const ang = -0.02 * drift;
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        const lx = f * (W - 22 - ox);
        const ly = Math.sin(f * Math.PI * 2) * 5;
        const rx = ox + lx * Math.cos(ang) - ly * Math.sin(ang);
        const ry = oy + lx * Math.sin(ang) + ly * Math.cos(ang);
        rightPts.push({ x: rx, y: ry });
      }
      drawTrail(ctx, rightPts);

      // 接缝红缝隙
      const le = leftPts[leftPts.length - 1];
      const rs = rightPts[0];
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(le.x, le.y);
      ctx.lineTo(rs.x, rs.y);
      ctx.stroke();
      const gap = Math.hypot(rs.x - le.x, rs.y - le.y);
      if (gap > 5) {
        ctx.fillStyle = '#c43f52';
        ctx.beginPath();
        ctx.arc((le.x + rs.x) / 2, (le.y + rs.y) / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#c43f52';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('接缝越拼越歪', 16, 20);
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

export default AnaDrift;
