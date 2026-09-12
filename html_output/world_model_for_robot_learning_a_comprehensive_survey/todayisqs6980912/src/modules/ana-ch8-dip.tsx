import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkStone } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：理笔蘸墨——毛笔在砚台中顺一个方向梳理笔锋（散→聚）、
// 蘸墨（笔尖染墨）、提起（聚成一尖峰）。循环 3.0 s。

const W = 560;
const H = 140;
const DUR = 3000;

const STONE = { x: 190, y: 106 };

/** 可变开合的毛笔：spread 大=散锋，小=聚峰；ink 0→1 笔尖染墨。 */
function drawGroomBrush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spread: number,
  ink: number
): void {
  const lean = 0.34;
  const dx = Math.sin(lean);
  const dy = -Math.cos(lean);
  ctx.save();
  ctx.lineCap = 'round';
  // 笔杆
  ctx.strokeStyle = PALETTE.guide;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(x + dx * 9, y + dy * 9);
  ctx.lineTo(x + dx * 34, y + dy * 34);
  ctx.stroke();
  // 笔毫：从散到聚
  const hairColor = ink > 0.5 ? '#2f3e2e' : PALETTE.muted;
  const hairLen = 11 + (1 - spread) * 2;
  for (let k = -3; k <= 3; k++) {
    const a = lean + k * spread * 0.32;
    const hx = Math.sin(a);
    const hy = -Math.cos(a);
    ctx.strokeStyle = hairColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + dx * 2, y + dy * 2);
    ctx.lineTo(x + hx * hairLen, y + hy * hairLen);
    ctx.stroke();
  }
  // 笔尖墨点
  ctx.fillStyle = ink > 0.5 ? '#2f3e2e' : PALETTE.muted;
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const AnaCh8Dip: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.92 ? 1 - (cyc - 0.92) / 0.08 : 1;

      // A 0–0.2 下探；B 0.2–0.6 沿砚梳理；C 0.6–0.72 蘸墨；D 0.72–1.0 提起
      const downU = clamp(cyc / 0.2, 0, 1);
      const combU = clamp((cyc - 0.2) / 0.4, 0, 1);
      const dipU = clamp((cyc - 0.6) / 0.12, 0, 1);
      const liftU = clamp((cyc - 0.72) / 0.28, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawInkStone(ctx, STONE.x, STONE.y, { w: 96, h: 34 });

      // 毛笔位置：下探→沿砚面右移梳理→提起
      let bx: number;
      let by: number;
      if (cyc < 0.2) {
        bx = lerp(STONE.x - 30, STONE.x - 30, downU);
        by = lerp(38, STONE.y - 16, downU);
      } else if (cyc < 0.72) {
        bx = lerp(STONE.x - 30, STONE.x + 30, combU);
        by = STONE.y - 16 - Math.sin(combU * Math.PI) * 2;
      } else {
        bx = STONE.x + 30;
        by = lerp(STONE.y - 16, 40, liftU);
      }

      // 开合：梳理进度 0→1，散→聚；蘸墨后保持聚
      const spread = lerp(1, 0.18, combU);
      const ink = dipU;

      drawGroomBrush(ctx, bx, by, spread, ink);

      // 状态小字
      const label =
        cyc < 0.2 ? '理笔' : cyc < 0.6 ? '梳理笔锋' : cyc < 0.72 ? '蘸墨' : '聚锋提起';
      ctx.globalAlpha = fade;
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 350, 34);

      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let raf: number | null = null;
    const tick = (ms: number) => {
      render(ms);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ana-ch8" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh8Dip;
