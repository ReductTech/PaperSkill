import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearDesk, label } from './handbook-kit';

const W = 244;
const H = 130;

export const S6ClosingAnalogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return undefined; }
    let raf = 0;
    let active = false;
    let started = performance.now();

    const roundRect = (x: number, y: number, w: number, h: number, fill: string, stroke: string) => {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 7);
      ctx.fill();
      ctx.stroke();
    };

    const draw = (now: number) => {
      const cycle = ((now - started) % 4300) / 4300;
      const close = cycle < .18 ? 0 : cycle < .66 ? easeInOutQuad((cycle - .18) / .48) : 1;
      clearDesk(ctx, W, H);

      roundRect(36, 26, 172, 68, '#ffffff', C.blue);
      ctx.strokeStyle = '#d3dae4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(122, 30);
      ctx.lineTo(122, 90);
      ctx.stroke();
      label(ctx, '贡献', 76, 57, C.green, 'center');
      label(ctx, '局限', 122, 76, C.red, 'center');
      label(ctx, '未来', 168, 57, C.purple, 'center');

      const tabs = [
        { x: 62, color: C.green, text: '贡献' },
        { x: 104, color: C.red, text: '局限' },
        { x: 146, color: C.purple, text: '未来' },
      ];
      tabs.forEach(tab => {
        ctx.fillStyle = tab.color;
        ctx.beginPath();
        ctx.roundRect(tab.x, 18, 34, 15, 4);
        ctx.fill();
        label(ctx, tab.text, tab.x + 17, 28, '#ffffff', 'center');
      });

      if (close > 0) {
        const coverWidth = 172 * close;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(36, 26, coverWidth, 68, 7);
        ctx.fill();
        if (close > .72) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (close - .72) / .28);
          label(ctx, '结论', 122, 58, '#ffffff', 'center');
          label(ctx, 'Contribution · Limits · Future', 122, 75, '#dce5f3', 'center');
          ctx.restore();
        }
      }

      label(ctx, close > .94 ? '合上正文，保留三张检查页' : '先把结论分成三页', 122, 116, close > .94 ? C.green : C.orange, 'center');
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

  return <canvas ref={ref} width={W} height={H} aria-label="论文合上后仍保留贡献、局限与未来三张页签的循环动画" />;
};

export default S6ClosingAnalogy;
