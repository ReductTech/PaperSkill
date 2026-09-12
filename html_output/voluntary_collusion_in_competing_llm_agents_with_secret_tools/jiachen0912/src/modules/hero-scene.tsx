import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero two-panel contrast. moduleId "old" -> refuse (card pushed away);
// moduleId "new" -> accept (card slid under the table). Card-table metaphor.

const W = 520;
const H = 200;
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const RED = '#c43f52';
const BLUE = '#27446e';
const GREEN = '#228d5c';

function drawTable(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = FELT;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
  ctx.strokeStyle = FELT_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  ctx.lineTo(W, H * 0.62);
  ctx.stroke();
}

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, label: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = FELT_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 6, y + h * 0.55, w - 12, h * 0.34, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(label, x + 12, y + h * 0.79);
  }
}

export const HeroScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = moduleId === 'new' ? 'new' : 'old';

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
      drawTable(ctx);
      const t = (time / 1000) % 3.2;
      const k = Math.min(1, t / 3.2);
      const ease = 1 - Math.pow(1 - k, 3);
      const cx = W / 2 - 30;
      const cy = H * 0.38;
      if (mode === 'old') {
        // refuse: card with a red label is pushed to the left, away.
        const x = cx - ease * 90;
        drawCard(ctx, x, cy, 76, 100, RED, '拒绝');
        ctx.fillStyle = RED;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('标记为不公平 → 推开', 16, H - 12);
      } else {
        // accept: card slides down under the table edge (hidden).
        const x = cx;
        const y = cy + ease * (H - cy - 8);
        drawCard(ctx, x, y, 76, 100, GREEN, '接受');
        ctx.fillStyle = GREEN;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('认账之后 → 悄悄收下', 16, H - 12);
      }
    };
    let rafId = 0;
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, [mode]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroScene;
