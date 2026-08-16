import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', RIM = '#92400e';
const GREEN = '#228d5c', INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

// 第 10 章：验证 —— 两件作品比一比，TriAttention 更完整（同预算下精度更高）。
export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const baseY = 108;

    const pot = (x: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 13, baseY);
      ctx.quadraticCurveTo(x - 18, baseY - h * 0.6, x - 11, baseY - h);
      ctx.quadraticCurveTo(x, baseY - h - 6, x + 11, baseY - h);
      ctx.quadraticCurveTo(x + 18, baseY - h * 0.6, x + 13, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 共享基线
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(36, baseY); ctx.lineTo(208, baseY); ctx.stroke();

      // 两个罐子从基线长起：左边基线（灰），右边 TriAttention（绿，更高）
      const cycle = (t % 3.6) / 3.6;
      const hBase = 16 + (cycle < 0.7 ? cycle / 0.7 : 1) * 34;
      const hTri = 16 + (cycle < 0.85 ? cycle / 0.85 : 1) * 62;
      pot(84, hBase, '#c7cfda');
      pot(158, hTri, GREEN);

      // 高度差标注
      ctx.fillStyle = GREEN;
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('更完整', 176, 116);

      ctx.fillStyle = INK;
      ctx.font = '12px ' + FONT;
      ctx.fillText('两件作品比一比', 34, 18);
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('同预算下，TriAttention 精度更高', 34, 122);
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

export default Ana10;
