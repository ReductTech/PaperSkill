import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 10：三支箭依次飞向靶，记分牌滚动到 80.0 / 81.8 / 83.0。
const W = 560, H = 140;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', wood: '#92400e' };

export const Ana10: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0; let t0 = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const t = ((now - t0) / 3600) % 1;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.86, W, H * 0.14);
      const cx = 430, cy = 74;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      for (const f of [1, 0.66, 0.33]) { ctx.beginPath(); ctx.arc(cx, cy, 56 * f, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      const flights = [0.05, 0.3, 0.55];
      flights.forEach((s, i) => {
        const fly = ease(Math.min(1, Math.max(0, (t - s) * 2.6)));
        if (fly <= 0) return;
        const ax = 60 + fly * (cx - 30 - 60), ay = 74 - Math.sin(fly * Math.PI) * (18 + i * 8);
        ctx.strokeStyle = i === 0 ? C.red : i === 1 ? C.green : C.muted;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ax - 16, ay + Math.sin(fly * Math.PI) * 5); ctx.lineTo(ax, ay); ctx.stroke();
      });
      // 记分牌
      const p = ease(Math.min(1, Math.max(0, (t - 0.75) * 4)));
      const bars: Array<[number, string]> = [[80.0, C.red], [81.8, C.green], [83.0, C.muted]];
      bars.forEach(([v, color], i) => {
        const y = 34 + i * 26;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
        ctx.fillRect(20, y, 130, 18); ctx.strokeRect(20, y, 130, 18);
        ctx.fillStyle = color; ctx.globalAlpha = p;
        ctx.fillRect(21, y + 1, 128 * ((v - 75) / 10) * p, 16);
        ctx.globalAlpha = 1;
        ctx.font = '13px sans-serif'; ctx.fillStyle = C.text; ctx.textAlign = 'left';
        ctx.fillText(v.toFixed(1), 158, y + 13);
      });
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('SPECTER / SciNCL / Oracle', 20, 128);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana10;
