import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 8 章类比卡：暗房设备布局（560x140）
const W = 560;
const H = 140;

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 三个设备
      const devices = [
        { x: 100, label: '放大机', color: '#27446e' },
        { x: 280, label: '显影盘', color: '#228d5c' },
        { x: 460, label: '灯箱', color: '#f07e47' },
      ];
      devices.forEach((d, i) => {
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, 40, 80, 60);
        ctx.fillRect(d.x + 20, 30, 40, 12);
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, d.x + 40, 120);
        ctx.textAlign = 'left';
      });
      // 连接线（光路，随 t 脉冲）
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++) {
        const pulse = (Math.sin(t * 2 + i) + 1) / 2;
        ctx.globalAlpha = 0.4 + pulse * 0.6;
        ctx.beginPath();
        ctx.moveTo(devices[i].x + 80, 70);
        ctx.lineTo(devices[i + 1].x, 70);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
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

export default Ch8Ana;
