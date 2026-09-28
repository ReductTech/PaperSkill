import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 8：弓、箭袋、靶、记分牌依次就位（双模态流水线布置）。
const W = 560, H = 140;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', text: '#21324a', muted: '#68778f', wood: '#92400e', green: '#228d5c' };

export const Ana8: React.FC<WidgetProps> = () => {
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
      const seg = (start: number) => ease(Math.min(1, Math.max(0, (t - start) * 5)));
      // 弓（图侧）
      const p0 = seg(0);
      const bowX = -40 + p0 * 110;
      ctx.strokeStyle = C.wood; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(bowX, 72, 34, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bowX, 38); ctx.lineTo(bowX, 106); ctx.stroke();
      // 箭袋（检索）
      const p1 = seg(0.25);
      ctx.fillStyle = C.wood; ctx.globalAlpha = p1;
      ctx.beginPath(); ctx.moveTo(190, 44); ctx.lineTo(214, 44); ctx.lineTo(209, 112); ctx.lineTo(196, 112); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // 靶（文本侧）
      const p2 = seg(0.5);
      const tx = 300 + (1 - p2) * 60;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = Math.max(0.1, p2);
      ctx.beginPath(); ctx.arc(tx, 74, 36, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
      for (const f of [0.66, 0.33]) { ctx.beginPath(); ctx.arc(tx, 74, 36 * f, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(tx, 74, 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // 记分牌（结果）
      const p3 = seg(0.75);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0.1, p3);
      ctx.fillRect(390, 48, 130, 52); ctx.strokeRect(390, 48, 130, 52);
      ctx.fillStyle = C.green; ctx.fillRect(396, 54, 118 * p3 * 0.8, 40 * p3);
      ctx.globalAlpha = 1;
      ctx.font = '14px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'left';
      ctx.fillText('图侧出题 · 文本侧答题 · 只在数据上交接', 200, 30);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana8;
