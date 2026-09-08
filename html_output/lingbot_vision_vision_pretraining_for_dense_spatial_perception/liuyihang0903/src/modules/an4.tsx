import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 技术示意：同一 Student 的三条监督流（CLS / masked patch / boundary）
const W = 244;
const H = 130;

export const An4: React.FC<WidgetProps> = () => {
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

      ctx.fillStyle = '#27446e';
      ctx.fillRect(92, 26, 60, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('Student', 100, 66);

      const targets: Array<[string, number, string]> = [
        ['CLS → 整图语义', 34, '#d97706'],
        ['mask → 局部语义', 56, '#7c3aed'],
        ['boundary → 几何', 78, '#228d5c'],
      ];
      targets.forEach(([label, y, color]) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(92, y);
        ctx.lineTo(20, y);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.fillText(label, 22, y + 3);
      });

      ctx.fillStyle = '#68778f';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('一个主干，同时学语义与几何', 22, H - 8);

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

  return <canvas id="an4" ref={canvasRef} width={W} height={H} />;
};

export default An4;
