import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 观察点：一根手指把观察点一颗颗按进时间格，蓝色格子从左向右铺开，扫不到的格子留空。
const W = 560;
const H = 140;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const BORDER = '#d7deea';

export const ObservationAna: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const render = (time: number) => {
      const t = (time % 3200) / 3200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 112, W, 18);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 112);
      ctx.lineTo(W, 112);
      ctx.stroke();

      // the time grid
      const cols = 9;
      const rows = 3;
      const gx = 120;
      const gy = 26;
      const cw = 36;
      const ch = 24;
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(gx, gy + r * ch);
        ctx.lineTo(gx + cols * cw, gy + r * ch);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(gx + c * cw, gy);
        ctx.lineTo(gx + c * cw, gy + rows * ch);
        ctx.stroke();
      }

      // finger presses observed cells from left to right
      const sweep = Math.min(cols, t * cols * 1.25);
      ctx.fillStyle = BLUE;
      for (let c = 0; c < cols; c++) {
        if (c + 0.5 > sweep) continue;
        for (let r = 0; r < rows; r++) {
          if ((c + r) % 4 === 3) continue; // this cell has no observation
          ctx.fillRect(gx + c * cw + 4, gy + r * ch + 4, cw - 8, ch - 8);
        }
      }

      // finger
      const fx = gx + Math.min(sweep, cols) * cw;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx - 26, gy - 16);
      ctx.lineTo(fx, gy + 8);
      ctx.lineTo(fx + 8, gy + 34);
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('哪些格子有值', 20, 24);
    };

    const tick = () => {
      render(performance.now());
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

  return <canvas id="cv-observation-ana" ref={canvasRef} width={W} height={H} />;
};

export default ObservationAna;
