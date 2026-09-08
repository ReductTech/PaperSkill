import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 技术示意：Teacher-Student 自蒸馏结构（EMA + stop-gradient + 目标流）
const W = 244;
const H = 130;

export const An1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // Teacher（左，蓝）
      ctx.fillStyle = '#27446e';
      ctx.fillRect(18, 28, 94, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('Teacher', 34, 60);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('EMA θ̄', 48, 76);
      // Student（右，绿）
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(132, 28, 94, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('Student', 148, 60);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('θ（梯度）', 154, 76);

      // 目标流（橙，Teacher→Student）
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(112, 42);
      ctx.lineTo(132, 42);
      ctx.stroke();
      ctx.fillStyle = '#d97706';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('目标', 108, 36);
      // EMA（蓝，Student→Teacher）
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(132, 72);
      ctx.lineTo(112, 72);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#27446e';
      ctx.fillText('EMA', 112, 88);

      ctx.fillStyle = '#68778f';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('Teacher 是 Student 的滑动平均，不出现在梯度里', 20, H - 10);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const start = () => render();
    const stop = () => {};
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="an1" ref={canvasRef} width={W} height={H} />;
};

export default An1;
