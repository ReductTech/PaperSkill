import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 9：重弓滑出、轻弓滑入，一支箭仍落进绿带。
const W = 560, H = 140;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', text: '#21324a', muted: '#68778f', wood: '#92400e' };

export const Ana9: React.FC<WidgetProps> = () => {
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
      const swap = ease(Math.min(1, Math.max(0, (t - 0.1) * 3)));
      const oldX = 120 - swap * 90, newX = 30 + swap * 90;
      // 重弓退出
      ctx.globalAlpha = 1 - swap;
      ctx.strokeStyle = C.wood; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(oldX, 74, 40, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      // 轻弓进入
      ctx.globalAlpha = Math.max(0.15, swap);
      ctx.strokeStyle = C.wood; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(newX, 74, 38, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.globalAlpha = 1;
      // 靶 + 绿带
      const cx = 400, cy = 74;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      for (const f of [1, 0.66, 0.33]) { ctx.beginPath(); ctx.arc(cx, cy, 52 * f, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.arc(cx, cy, 18, 0, Math.PI * 2, true); ctx.fill();
      ctx.globalAlpha = 1;
      // 一支箭飞入绿带
      const fly = ease(Math.min(1, Math.max(0, (t - 0.5) * 2.4)));
      const ax = 80 + fly * (cx - 26 - 80), ay = 74 - Math.sin(fly * Math.PI) * 26;
      ctx.strokeStyle = '#68778f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ax - 14, ay + Math.sin(fly * Math.PI) * 4); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.fillStyle = C.wood; ctx.beginPath();
      ctx.moveTo(ax, ay - 4); ctx.lineTo(ax, ay + 4); ctx.lineTo(ax + 8, ay); ctx.closePath(); ctx.fill();
      ctx.font = '14px sans-serif'; ctx.fillStyle = C.text; ctx.textAlign = 'left';
      ctx.fillText('轻弓（BitFit / 通用域初始化）照样命中', 180, 26);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana9;
