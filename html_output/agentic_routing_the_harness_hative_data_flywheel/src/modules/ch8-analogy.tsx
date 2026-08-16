import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearStudio, drawConsole, drawLegend, drawScoreTrack, drawStudioLabel } from './studio-kit';

const W = 244;
const H = 130;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';

export const Ch8Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 244px)';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    let origin = performance.now();
    const sockets = [{ x: 171, y: 42 }, { x: 171, y: 68 }, { x: 171, y: 94 }];

    const render = (phase: number) => {
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 8, 228, 114);
      drawScoreTrack(ctx, 18, 24, 112, 1, BLUE);
      sockets.forEach((socket, index) => {
        ctx.beginPath();
        ctx.arc(socket.x, socket.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = index === 1 ? BLUE : RED;
        ctx.lineWidth = index === 1 ? 4 : 2.5;
        ctx.stroke();
      });
      const p = Math.min(1, phase / 0.78);
      const startX = 73;
      const startY = 101;
      const endX = 161;
      const endY = 68;
      const x = startX + (endX - startX) * p;
      const y = startY + (endY - startY) * p - Math.sin(p * Math.PI) * 18;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(27, 108);
      ctx.quadraticCurveTo(95, 80, x, y);
      ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.fillRect(x - 8, y - 5, 16, 10);
      if (phase > 0.8) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(171, 68, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawStudioLabel(ctx, '当前小节', 18, 18, 'left');
      drawStudioLabel(ctx, '正确通道', 184, 69, 'left');
      drawLegend(ctx, [{ label: '当前路径', color: BLUE }, { label: '已接通', color: GREEN }], 12, 116);
    };

    const tick = (now: number) => {
      render(reduced ? 0.9 : ((now - origin) % 3000) / 3000);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      origin = performance.now();
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    if (reduced) {
      render(0.9);
      canvas.classList.add('is-ready');
    }
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="插线头把当前小节接入蓝色高亮的正确通道" />;
};
