import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const BG = '#fffaf1', MUTED = '#666666', INK = '#222222';

// 类比：对焦环旋转；内部样本从模糊（散点）到清晰（实心方块）循环。
export const Sec4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    // 固定散点抖动种子
    const seeds = Array.from({ length: 16 }, (_, i) => ({
      ox: Math.cos(i * 2.3) * 18,
      oy: Math.sin(i * 1.7) * 18,
    }));

    const cx = W / 2, cy = 56, R = 40;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      // 对焦环（带刻度），旋转
      const rot = t / 1600;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = MUTED; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r0 = R, r1 = R + (i % 4 === 0 ? 6 : 3);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.restore();

      // 内部样本：模糊 -> 清晰的循环
      const focus = easeInOutQuad((Math.sin(t / 1400) + 1) / 2); // 0..1
      const half = 15;
      // 清晰实心方块（随 focus 淡入）
      ctx.fillStyle = `rgba(34,141,92,${focus})`;
      ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
      // 散点（随 1-focus 淡出）
      ctx.fillStyle = `rgba(104,119,143,${1 - focus})`;
      for (const s of seeds) {
        const x = cx + s.ox * (1 - focus);
        const y = cy + s.oy * (1 - focus);
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = MUTED; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('对焦 · 模糊到清晰', W / 2, H - 8);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Sec4Ana;
