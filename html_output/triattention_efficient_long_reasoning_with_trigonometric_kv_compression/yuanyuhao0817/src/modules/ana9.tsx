import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', RIM = '#92400e', CLAY = '#b8c9a7', CLAY_D = '#76906a';
const GREEN = '#228d5c', ORANGE = '#d97706', INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

// 第 9 章：落地 —— 先用一小段校准文本得到统计卡，再每 128 个词修一刀（窗口剪枝）。
export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const wheelY = 112;
    const budgetY = 52;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 统计卡（校准结果，始终显示在右上）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 14, 78, 40);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(150, 14, 78, 40);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillText('统计卡', 156, 28);
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.fillText('E[q] · R=0.97', 156, 42);
      ctx.fillStyle = '#8a93a6';
      ctx.fillText('校准一次', 156, 52);

      // 预算线
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(36, budgetY); ctx.lineTo(142, budgetY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ORANGE;
      ctx.font = '10px ' + FONT;
      ctx.fillText('预算', 120, budgetY - 5);

      // 转盘
      ctx.fillStyle = CLAY_D;
      ctx.beginPath(); ctx.ellipse(88, wheelY, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(88, wheelY, 44, 11, 0, 0, Math.PI * 2); ctx.stroke();

      // 泥柱按窗口步进增长，越线即被修一刀
      const cycle = (t % 3.6) / 3.6;
      const step = Math.floor(cycle * 5); // 5 个窗口
      const within = cycle * 5 - step;
      const baseH = 18 + step * 13;
      const h = baseH + within * 13;
      const trimmed = within > 0.82;
      const hh = trimmed ? baseH + 3 : h;
      const topY = wheelY - hh;

      ctx.fillStyle = CLAY;
      ctx.fillRect(88 - 14, topY, 28, hh);
      ctx.strokeStyle = CLAY_D;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(88 - 14, topY, 28, hh);

      // 修刀（越线时切回）
      if (trimmed) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(60, budgetY); ctx.lineTo(116, budgetY); ctx.stroke();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.font = '12px ' + FONT;
      ctx.fillText('先校准，再定时修一刀', 34, 18);
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText(trimmed ? '每 128 词剪一次，回到预算' : '缓存按窗口步进增长', 34, 122);
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

export default Ana9;
