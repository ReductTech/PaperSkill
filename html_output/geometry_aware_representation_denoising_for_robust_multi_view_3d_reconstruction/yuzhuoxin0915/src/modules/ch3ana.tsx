import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 3 章类比卡：同一张底片，三个修复地点对比（560x140）
const W = 560;
const H = 140;

export const Ch3Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 22, W, 22);
      // 三处修复地点
      const places = [
        { x: 90, label: '表面', color: '#c43f52' },
        { x: 280, label: '小样', color: '#f07e47' },
        { x: 470, label: '底片', color: '#228d5c' },
      ];
      places.forEach((p, i) => {
        // 一张底片轮廓
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 40, 30, 80, 60);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x - 40, 30, 80, 60);
        // 内部细节（随 t 抖动幅度不同：表面最糊，底片最清）
        const jitter = i === 0 ? 8 : i === 1 ? 4 : 1;
        ctx.strokeStyle = '#76906a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 30, 60 + Math.sin(t * 3) * jitter);
        ctx.lineTo(p.x + 30, 60 + Math.cos(t * 3) * jitter);
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, 115);
        ctx.textAlign = 'left';
      });
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

export default Ch3Ana;
