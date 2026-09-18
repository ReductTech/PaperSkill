import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawBrush, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：提按——同一波浪轨迹写两遍：上带重按（粗笔）、下带轻提（细笔），
// 仅笔锋开合（力度）不同。循环 2.6 s。

const W = 560;
const H = 140;
const DUR = 2600;

const WAVE_CTRL = [
  { x: 180, y: -22 },
  { x: 320, y: 18 },
  { x: 460, y: -16 },
];

function sampleWave(x0: number, y0: number, x1: number, u: number): { x: number; y: number }[] {
  // 三段二次贝塞尔近似波浪，返回 0..u 的折线
  const pts: { x: number; y: number }[] = [];
  const total = 40;
  const n = Math.max(2, Math.round(total * u));
  for (let i = 0; i <= n; i++) {
    const t = (i / total) * u;
    const x = x0 + t * (x1 - x0);
    // 波浪 y：两个半波叠加
    const rel = (x - x0) / (x1 - x0);
    const y =
      y0 +
      Math.sin(rel * Math.PI * 2) * 18 * (rel < 0.5 ? 1 : 0.9) +
      Math.sin(rel * Math.PI * 4) * 4;
    pts.push({ x, y });
  }
  return pts;
}

export const AnaCh5Pressure: React.FC<WidgetProps> = () => {
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

    const X0 = 96;
    const X1 = 500;
    const Y_HEAVY = 52;
    const Y_LIGHT = 104;

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1;
      // A 0–0.44 重按；B 0.5–0.9 轻提
      const heavyU = clamp(cyc / 0.44, 0, 1);
      const lightU = clamp((cyc - 0.5) / 0.4, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawSceneLabel(ctx, 60, Y_HEAVY, '按', { color: PALETTE.guide, size: 14, align: 'center' });
      drawSceneLabel(ctx, 60, Y_LIGHT, '提', { color: PALETTE.guide, size: 14, align: 'center' });

      // A：重按（粗）
      if (heavyU > 0) {
        const pts = sampleWave(X0, Y_HEAVY, X1, heavyU);
        drawInkPath(ctx, pts, { color: PALETTE.blue, width: 8 });
        if (heavyU < 1) {
          const tip = pts[pts.length - 1];
          drawBrush(ctx, tip.x, tip.y, 0.14, 26);
        }
      }
      // B：轻提（细）——同一轨迹
      if (lightU > 0) {
        const pts = sampleWave(X0, Y_LIGHT, X1, lightU);
        drawInkPath(ctx, pts, { color: PALETTE.blue, width: 2.5 });
        if (lightU < 1 && lightU > 0) {
          const tip = pts[pts.length - 1];
          drawBrush(ctx, tip.x, tip.y, 0.14, 26);
        }
      }

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

  return <canvas id="cv-ana-ch5" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh5Pressure;
