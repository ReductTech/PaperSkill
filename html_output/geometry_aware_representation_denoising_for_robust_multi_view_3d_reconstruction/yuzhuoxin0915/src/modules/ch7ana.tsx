import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 7 章类比卡：校准显影液参数（560x140）
const W = 560;
const H = 140;

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // 显影液容器
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(180, 50, 200, 70);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(190, 40, 180, 10);
      // 温度计
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(420, 40);
      ctx.lineTo(420, 110);
      ctx.stroke();
      // 温度计液柱（随 t 上下）
      const level = 70 + (Math.sin(t * 1.5) + 1) / 2 * 30;
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(415, level, 10, 110 - level);
      // 液面波纹
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      const wav = Math.sin(t * 3) * 3;
      ctx.beginPath();
      ctx.moveTo(195, 60 + wav);
      ctx.lineTo(370, 60 - wav);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('校准', 200, 140);
    };

    const tick = (time: number) => {
      render(time / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch7Ana;
