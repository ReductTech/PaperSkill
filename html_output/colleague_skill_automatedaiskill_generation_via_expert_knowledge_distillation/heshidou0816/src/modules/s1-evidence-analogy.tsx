import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearDesk, label, notebook } from './handbook-kit';

const W = 244;
const H = 130;

export const S1EvidenceAnalogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return undefined; }
    let raf = 0;
    let active = false;
    let started = performance.now();

    const drawTrace = (x: number, y: number, settled: boolean) => {
      ctx.save();
      ctx.shadowColor = 'rgba(33,50,74,.12)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = settled ? C.green : C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, 76, 39, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      label(ctx, '先检查 auth', x + 38, y + 15, C.blue, 'center');
      label(ctx, 'Review #12', x + 38, y + 29, settled ? C.green : C.orange, 'center');
    };

    const draw = (now: number) => {
      const cycle = ((now - started) % 4200) / 4200;
      const move = cycle < .18 ? 0 : cycle < .62 ? easeInOutQuad((cycle - .18) / .44) : 1;
      clearDesk(ctx, W, H);
      notebook(ctx, 134, 18, 92, 84, C.blue);
      label(ctx, '规则', 180, 36, C.blue, 'center');
      ctx.strokeStyle = '#c8d1dc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 48);
      ctx.lineTo(210, 48);
      ctx.stroke();
      if (move > .78) {
        label(ctx, '内容 ✓', 180, 62, C.green, 'center');
        label(ctx, '来源 ✓', 180, 78, C.green, 'center');
      }
      const x = 18 + move * 126;
      const y = 48 - Math.sin(move * Math.PI) * 16;
      drawTrace(x, y, move > .94);
      label(ctx, move > .94 ? '判断 + 来源一起留下' : '一条 Trace 正在归档', 122, 117, move > .94 ? C.green : C.orange, 'center');
      canvas.classList.add('is-ready');
      if (active) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (active) return;
      active = true;
      started = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={ref} width={W} height={H} aria-label="一条 Review Trace 连同来源编号被收入可追溯手册的循环动画" />;
};

export default S1EvidenceAnalogy;
