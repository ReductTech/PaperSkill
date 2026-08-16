import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const BG = '#fffaf1', MUTED = '#666666', BLUE = '#33ccff', ORANGE = '#ffcc00';

// 类比：颁奖台（3 个台阶，中间最高）+ 中间上方的奖杯，橙色高亮。
export const Sec5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    // 奖杯形状
    const trophy = (cx: number, cy: number, scale: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = ORANGE;
      // 杯身
      ctx.beginPath();
      ctx.moveTo(-9, -14);
      ctx.lineTo(9, -14);
      ctx.lineTo(6, -2);
      ctx.arc(0, -2, 6, 0, Math.PI, false);
      ctx.lineTo(-6, -2);
      ctx.closePath();
      ctx.fill();
      // 左右把手
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-9, -10, 4, Math.PI * 0.4, Math.PI * 1.6, false); ctx.stroke();
      ctx.beginPath(); ctx.arc(9, -10, 4, -Math.PI * 0.6, Math.PI * 0.6, false); ctx.stroke();
      // 杯脚
      ctx.fillRect(-2, 4, 4, 5);
      ctx.fillRect(-6, 9, 12, 3);
      ctx.restore();
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      const baseY = 108;
      const bw = 44;
      const bars = [
        { x: W / 2 - bw - 6, h: 30, c: BLUE, n: '2' },
        { x: W / 2, h: 52, c: ORANGE, n: '1' },
        { x: W / 2 + bw + 6, h: 20, c: BLUE, n: '3' },
      ];
      ctx.textAlign = 'center';
      for (const b of bars) {
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x - bw / 2, baseY - b.h, bw, b.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.n, b.x, baseY - b.h / 2);
      }

      // 奖杯（轻微浮动）
      const bob = Math.sin(t / 500) * 2;
      trophy(W / 2, baseY - 52 - 16 + bob, 1);

      ctx.fillStyle = MUTED; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('性能领先 · 登顶', W / 2, H - 8);
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

export default Sec5Ana;
