import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero（旧方法）—— VGGT 单一全局注意力：路越长“地图纸”越撑越裂（红），标注“序列一长就 OOM”。
const W = 520;
const H = 200;

interface HeroState {
  t: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.66, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.86, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<HeroState>({ t: 0 });
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

    const render = (s: HeroState) => {
      const phase = s.t * 0.1;
      // 共享的“路变长”驱动（0..1 循环）
      const grow = (s.t % 220) / 220;
      const over = grow > 0.55;
      const tear = over ? (grow - 0.55) / 0.45 : 0; // 0..1 撕裂程度
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const x0 = 30;
      const yBase = 132;
      const len = 60 + grow * 220;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        pts.push({ x: x0 + f * len, y: yBase + Math.sin(f * Math.PI * 3 + phase) * 8 });
      }
      drawTrail(ctx, pts);

      // 中央的大“地图纸”：随 grow 拉伸，over 后开裂并抖动
      const shake = over ? Math.sin(s.t * 0.8) * 3 * tear : 0;
      const mw = 120 + grow * 90;
      const mh = 74;
      const mx = W / 2 - mw / 2 + shake;
      const my = 26 + (over ? Math.cos(s.t * 0.7) * 2 * tear : 0);
      ctx.fillStyle = '#fffef8';
      ctx.strokeStyle = over ? '#c43f52' : '#9aa7b8';
      ctx.lineWidth = 2;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
      if (over) {
        // 从上到下的红色裂纹
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const cx = mx + mw / 2;
        ctx.moveTo(cx, my);
        let yy = my;
        let xx = cx;
        while (yy < my + mh) {
          yy += 10;
          xx += (Math.sin(yy * 0.5) * 8 + 6) * tear;
          ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#9aa7b8';
        ctx.lineWidth = 1;
        for (let r = 0; r < 4; r++) {
          const ry = my + 14 + r * 14;
          ctx.beginPath();
          ctx.moveTo(mx + 10, ry);
          ctx.lineTo(mx + mw - 10, ry);
          ctx.stroke();
        }
      }

      // 标注
      ctx.fillStyle = over ? '#c43f52' : '#68778f';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(over ? '序列一长就 OOM' : 'VGGT：一次全局注意力', 20, 22);
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

export default HeroOld;
