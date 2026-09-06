import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 技术示意：完整训练循环（教师 → 边界掩码 → 学生重建 → EMA 回环）
const W = 244;
const H = 130;

export const An5: React.FC<WidgetProps> = () => {
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

      const nodes = [
        { x: 44, y: 26, label: '教师', color: '#27446e' },
        { x: 200, y: 26, label: '边界掩码', color: '#d97706' },
        { x: 200, y: 96, label: '学生重建', color: '#7c3aed' },
        { x: 44, y: 96, label: 'EMA', color: '#228d5c' },
      ];
      nodes.forEach((n) => {
        ctx.fillStyle = n.color;
        ctx.fillRect(n.x - 44, n.y - 12, 88, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText(n.label, n.x - 34, n.y + 4);
      });

      const arrows: Array<[number, number, number, number]> = [
        [88, 26, 156, 26],
        [200, 38, 200, 84],
        [156, 96, 88, 96],
        [44, 84, 44, 38],
      ];
      arrows.forEach(([x1, y1, x2, y2]) => {
        ctx.strokeStyle = '#68778f';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.fillStyle = '#68778f';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('一次训练迭代的完整回路', 56, H - 10);

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

  return <canvas id="an5" ref={canvasRef} width={W} height={H} />;
};

export default An5;
