import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, album, lamp, label, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Hero new-method side: two separated preset boards (answer board with four
// routed windows, image board with one always-on preset) plus the factory
// reference album anchoring the image board. The wall print stays green.
const W = 480;
const H = 260;

export const HeroNew: React.FC<WidgetProps> = () => {
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
    let raf = 0;

    const render = (now: number) => {
      clearStudio(ctx, W, H, 0.86);
      // answer board with 4 routed windows
      board(ctx, 20, 58, 190, 132, '答题预设板');
      const t = (now / 1800) % (Math.PI * 2);
      const ws = [0, 1, 2, 3].map((i) => 0.5 + 0.5 * Math.sin(t + i * 1.6));
      const wsum = ws.reduce((a, b) => a + b, 0);
      for (let i = 0; i < 4; i++) {
        const wx = 36 + (i % 2) * 88;
        const wy = 82 + Math.floor(i / 2) * 52;
        const p = ws[i] / wsum;
        ctx.fillStyle = mix(SC.purple, SC.bg, 0.78 - p * 0.55);
        ctx.fillRect(wx, wy, 74, 38);
        ctx.strokeStyle = p > 0.3 ? SC.purple : SC.shade;
        ctx.lineWidth = p > 0.3 ? 2 : 1;
        ctx.strokeRect(wx, wy, 74, 38);
      }
      lamp(ctx, 115, 66, 7, true, SC.blue);
      // image board with a single always-on preset
      board(ctx, 232, 58, 104, 132, '出图板');
      ctx.fillStyle = SC.green;
      ctx.fillRect(248, 92, 72, 72);
      ctx.strokeStyle = SC.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(248, 92, 72, 72);
      lamp(ctx, 284, 74, 7, true, SC.green);
      // factory reference album + breathing KD line
      album(ctx, 368, 58, 92, 132, 0.55);
      const breathe = 0.35 + 0.3 * Math.sin((now / 900) % (Math.PI * 2));
      ctx.strokeStyle = mix(SC.orange, SC.bg, 1 - breathe);
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(320, 128);
      ctx.lineTo(368, 128);
      ctx.stroke();
      ctx.setLineDash([]);
      // stable result strip
      ctx.fillStyle = SC.green;
      ctx.fillRect(60, 206, 360, 8);
      label(ctx, '一阶冲突恒为 0 · 参数解耦 · 蒸馏锚定', 240, 232, SC.muted, 11, 'center');
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
export default HeroNew;
