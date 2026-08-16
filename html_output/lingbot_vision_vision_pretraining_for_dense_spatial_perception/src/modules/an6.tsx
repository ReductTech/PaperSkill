import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 技术示意：分类化 —— 连续边界值离散为 K 个格子的概率分布
const W = 244;
const H = 130;

export const An6: React.FC<WidgetProps> = () => {
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

      // 顶部：连续刻度
      ctx.strokeStyle = '#9fb0c8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(20, 30);
      ctx.lineTo(224, 30);
      ctx.stroke();
      // 连续值指针
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(150, 30, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('连续值', 170, 34);

      // 箭头向下
      ctx.fillStyle = '#68778f';
      ctx.fillText('↓', 150, 46);

      // 底部：K 格概率柱
      for (let i = 0; i < 8; i++) {
        const x = 20 + i * 26;
        const prob = i === 4 ? 0.55 : 0.05 + Math.abs(Math.sin(i * 3.1)) * 0.1;
        const h = prob * 60;
        ctx.fillStyle = i === 4 ? '#d97706' : '#27446e';
        ctx.fillRect(x, 96 - h, 20, h);
        ctx.strokeStyle = '#9fb0c8';
        ctx.strokeRect(x, 36, 20, 60);
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('K 格概率分布（分类）', 20, H - 8);

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

  return <canvas id="an6" ref={canvasRef} width={W} height={H} />;
};

export default An6;
