import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawBrush, drawInkStroke, COLORS, drawSubText } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02; clearScene(ctx, W, H);
      // Arrow from pretraining to downstream
      ctx.fillStyle = COLORS.blue; ctx.font = '12px sans-serif';
      ctx.fillText('预训练编码器', 40, 40);
      // Encoder box
      ctx.fillStyle = '#e0e8f0'; ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2;
      ctx.fillRect(30, 50, 100, 50); ctx.strokeRect(30, 50, 100, 50);
      ctx.fillStyle = COLORS.ink; ctx.font = '11px sans-serif';
      drawSubText(ctx, 'E_v (视觉编码器)', 38, 80, 11, COLORS.ink, 'sans-serif');
      // Arrow
      const p = (t % 2) / 2;
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 75); ctx.lineTo(140 + p * 80, 75); ctx.stroke();
      ctx.fillStyle = COLORS.green; ctx.beginPath();
      ctx.moveTo(220 + p * 80, 75); ctx.lineTo(210 + p * 80, 68); ctx.lineTo(210 + p * 80, 82); ctx.fill();
      // Downstream tasks
      const tasks = ['识别', '检测', '解析'];
      tasks.forEach((s, i) => {
        const x = 280 + i * 85;
        ctx.fillStyle = COLORS.paper; ctx.strokeStyle = COLORS.border;
        ctx.fillRect(x, 50, 70, 50); ctx.strokeRect(x, 50, 70, 50);
        ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
        ctx.fillText(s, x + 20, 80);
      });
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('丢弃解码器，直接迁移', 150, 120);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana6;
