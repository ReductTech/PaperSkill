import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 技术示意：结果对比（NYUv2 深度 RMSE，真实数字，越低越好）
const W = 244;
const H = 130;

export const An7: React.FC<WidgetProps> = () => {
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

      const models = [
        { label: 'DINOv2', rmse: 0.372, color: '#c43f52' },
        { label: 'V-JEPA', rmse: 0.350, color: '#d97706' },
        { label: 'DINOv3', rmse: 0.309, color: '#27446e' },
        { label: 'LingBot', rmse: 0.296, color: '#228d5c' },
      ];
      const maxR = 0.4;
      const gy = 20;
      const gh = 80;
      models.forEach((m, i) => {
        const x = 16 + i * 56;
        const h = (m.rmse / maxR) * gh;
        ctx.fillStyle = m.color;
        ctx.fillRect(x, gy + gh - h, 40, h);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillText(m.rmse.toFixed(3), x, gy + gh - h - 4);
        ctx.fillStyle = '#68778f';
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.fillText(m.label, x, gy + gh + 12);
      });

      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText('1B 击败 7B（RMSE ↓）', 40, H - 10);

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

  return <canvas id="an7" ref={canvasRef} width={W} height={H} />;
};

export default An7;
