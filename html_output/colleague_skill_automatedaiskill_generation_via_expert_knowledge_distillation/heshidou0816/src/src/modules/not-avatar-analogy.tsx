import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearDesk, label } from './handbook-kit';

const W = 244;
const H = 130;

export const NotAvatarAnalogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return undefined; }
    let raf = 0;
    let active = false;
    let started = performance.now();

    const draw = (now: number) => {
      const cycle = ((now - started) % 3600) / 3600;
      const move = Math.min(1, cycle / .5);
      const reject = Math.max(0, Math.min(1, (cycle - .56) / .18));
      clearDesk(ctx, W, H);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '38px system-ui, sans-serif';
      ctx.fillText('🧑‍💻', 52, 59);
      label(ctx, 'Person', 52, 94, C.blue, 'center');

      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(82, 58);
      ctx.lineTo(118, 58);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(112, 53);
      ctx.lineTo(119, 58);
      ctx.lineTo(112, 63);
      ctx.stroke();

      const avatarX = 112 + move * 61;
      ctx.save();
      ctx.globalAlpha = .28 + .62 * move;
      ctx.fillStyle = '#75839a';
      ctx.font = '38px system-ui, sans-serif';
      ctx.fillText('👤', avatarX, 55);
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.fillText('AI Avatar', avatarX, 91);
      ctx.restore();

      if (reject > 0) {
        ctx.save();
        ctx.globalAlpha = reject;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        const size = 18 * reject;
        ctx.beginPath();
        ctx.moveTo(avatarX - size, 38);
        ctx.lineTo(avatarX + size, 74);
        ctx.moveTo(avatarX + size, 38);
        ctx.lineTo(avatarX - size, 74);
        ctx.stroke();
        ctx.restore();
      }

      label(ctx, '不是复制一个人', 122, 116, reject > .4 ? C.red : C.blue, 'center');
      if (active) raf = requestAnimationFrame(draw);
      canvas.classList.add('is-ready');
    };

    const start = () => { if (!active) { active = true; started = performance.now(); raf = requestAnimationFrame(draw); } };
    const stop = () => { active = false; if (raf) cancelAnimationFrame(raf); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={ref} width={W} height={H} aria-label="一个人被复制成虚幻 AI Avatar 后被打叉的动画" />;
};

export default NotAvatarAnalogy;
