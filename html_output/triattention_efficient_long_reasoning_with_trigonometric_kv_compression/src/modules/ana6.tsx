import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', ORANGE = '#d97706', GREEN = '#228d5c';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

const MEAN_A = -0.7;
const N = 12;
const OFF: { a: number; r: number }[] = [];
for (let i = 0; i < N; i++) {
  OFF.push({ a: (i / N) * Math.PI * 2, r: 18 + (i % 4) * 8 });
}

// 第 5 章：旋转前的 Q/K 高度聚集 —— 向量点云收拢到固定中心，R 值同步上升。
export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const cx = 70, cy = 78;
      const prog = (t % 4) / 4; // 0..1 循环：分散 -> 聚集

      // 计算点与 R
      const pts = OFF.map(({ a, r }) => {
        const ang = lerp(a, MEAN_A, prog);
        const rr = lerp(r, r * 0.2, prog);
        return [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr] as [number, number];
      });
      let mx = 0, my = 0, ml = 0;
      pts.forEach(([x, y]) => { mx += x - cx; my += y - cy; ml += Math.hypot(x - cx, y - cy); });
      const R = clamp(Math.hypot(mx / N, my / N) / Math.max(ml / N, 1e-6), 0, 1);

      // 标题
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('旋转前的 Q/K 聚集在固定中心', 10, 18);

      // 参考圆环
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.stroke();

      // 向量点
      pts.forEach(([x, y]) => {
        ctx.fillStyle = BLUE;
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.stroke();
      });

      // 中心
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy + 9); ctx.stroke();

      // R 值（右侧）
      ctx.fillStyle = R > 0.6 ? GREEN : MUT;
      ctx.font = 'bold 14px ' + FONT;
      ctx.fillText('R = ' + R.toFixed(2), 138, 44);
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.fillText('R 越接近 1 越聚集', 138, 62);
      ctx.fillStyle = '#eef1f5';
      ctx.fillRect(138, 72, 90, 8);
      ctx.fillStyle = R > 0.6 ? GREEN : '#d97706';
      ctx.fillRect(138, 72, 90 * R, 8);

      // 底部说明带
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText(prog > 0.85 ? '向量集中在固定中心附近' : '向量点云向中心收拢', 10, H - 8);
    };

    const tick = (ts: number) => {
      render(ts / 1000);
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

export default Ana6;