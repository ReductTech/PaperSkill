import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 3：靶上依次浮现靶心、绿带、空隙、红带。
const W = 560, H = 140;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f' };

export const Ana3: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const cx = 140, cy = 76, R = 60;
    let raf = 0; let t0 = performance.now();
    const tick = (now: number) => {
      const t = ((now - t0) / 3600) % 1;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.86, W, H * 0.14);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      for (const f of [1, 0.66, 0.33]) { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.stroke(); }
      const p1 = Math.min(1, Math.max(0, (t - 0.15) * 4));
      const p2 = Math.min(1, Math.max(0, (t - 0.45) * 4));
      ctx.globalAlpha = 0.35 * p1;
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.arc(cx, cy, 24, 0, Math.PI * 2, true); ctx.fill();
      ctx.globalAlpha = 0.35 * p2;
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.arc(cx, cy, 50, 0, Math.PI * 2, true); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(cx, cy, 4 + 3 * p1, 0, Math.PI * 2); ctx.fill();
      // 右侧说明刻度
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(280, 30); ctx.lineTo(280, 104); ctx.stroke();
      const rows: Array<[string, string, number]> = [
        ['绿带', C.green, 40], ['空隙 = 边际', C.border, 66], ['红带', C.red, 92],
      ];
      rows.forEach(([label, color, y], i) => {
        const reveal = i === 0 ? p1 : i === 2 ? p2 : Math.min(p1, p2);
        ctx.globalAlpha = reveal;
        ctx.fillStyle = color === C.border ? C.muted : color;
        ctx.fillRect(296, y - 5, 14 * reveal, 10);
        ctx.font = '15px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = C.text;
        ctx.fillText(label, 320, y + 5);
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana3;
