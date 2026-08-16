import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', ORANGE = '#d97706', GREEN = '#228d5c';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

// 第 3 章：旋转 RoPE —— 位置差 Δ 变成两向量夹角，旋转把距离编进点积。
export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const arrow = (x1: number, y1: number, a: number, len: number, color: string, lw: number) => {
      const x2 = x1 + Math.cos(a) * len;
      const y2 = y1 + Math.sin(a) * len;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(a - 0.4), y2 - 6 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 6 * Math.cos(a + 0.4), y2 - 6 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 顶部标题带
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('旋转把距离变成夹角', 10, 18);

      // 位置差 Δ 循环 0..6
      const delta = Math.floor((t % 4.2) / 0.6);
      const omega = 0.45; // 每单位距离的旋转角
      const ang = delta * omega;

      // 表盘
      const cx = 66, cy = 76, r = 46;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

      // K 固定朝右，Q 随 Δ 旋转
      arrow(cx, cy, 0, 40, ORANGE, 2.5);
      arrow(cx, cy, ang, 44, BLUE, 2.5);
      ctx.fillStyle = ORANGE;
      ctx.font = 'bold 11px ' + FONT;
      ctx.fillText('K', cx + 34, cy - 12);
      ctx.fillStyle = BLUE;
      ctx.fillText('Q', cx + Math.cos(ang) * 52, cy + Math.sin(ang) * 52);

      // 夹角弧
      if (ang > 0.05) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 24, 0, ang, false); ctx.stroke();
      }

      // 右侧数值
      ctx.fillStyle = INK;
      ctx.font = '13px ' + FONT;
      ctx.fillText('距离 Δ = ' + delta, 128, 58);
      ctx.fillStyle = MUT;
      ctx.font = '12px ' + FONT;
      ctx.fillText('夹角 = ω·Δ', 128, 80);
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillText('点积 = cos(ω·Δ)', 128, 104);

      // 底部说明带
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('Δ 越大，夹角越大，点积越低', 10, H - 8);
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

export default Ana4;