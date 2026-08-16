import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 右：LingBot —— 点击 Reveal 让隐藏的边界亮起来
const W = 460;
const H = 240;

export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();
    const render = (t: number) => {
      const rev = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 0, W, 150);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 150, W, 90);

      const cx = 200;
      const cy = 140;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - 60, cy - 30, 120, 60);
      ctx.beginPath();
      ctx.arc(cx + 70, cy - 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy - 20);
      ctx.lineTo(cx - 95, cy - 45);
      ctx.lineTo(cx - 62, cy - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 45, cy + 30, 18, 26);
      ctx.fillRect(cx - 5, cy + 30, 18, 26);

      if (rev) {
        const pulse = 0.6 + 0.4 * Math.sin((t - t0) / 300);
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.35 * pulse;
        ctx.strokeRect(cx - 60, cy - 30, 120, 60);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.6;
        ctx.strokeRect(cx - 60, cy - 30, 120, 60);
        ctx.beginPath();
        ctx.arc(cx + 70, cy - 30, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#228d5c';
        for (let i = 0; i < 5; i++) {
          const bx = cx - 60 + (i / 4) * 120;
          const by = cy - 30 + ((t - t0) / 400 + i * 40) % 60;
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin((t - t0) / 200 + i);
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(rev ? '边界亮起来了 ✓' : '隐藏的边界…', 40, 40);
      ctx.fillStyle = rev ? '#228d5c' : '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(rev ? 'LingBot 学到的空间结构' : 'DINO 从未学过的信号', 40, 64);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('LingBot · 语义 + 边界几何', 40, H - 14);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const stateRef = useRef(false);
  stateRef.current = revealed;

  const reveal = () => {
    stateRef.current = true;
    setRevealed(true);
  };

  return (
    <div>
      <canvas id="hero-new" ref={canvasRef} width={W} height={H} />
      {!revealed ? (
        <button className="btn" onClick={reveal} style={{ marginTop: 8, width: '100%' }}>
          Reveal the missing signal →
        </button>
      ) : (
        <div className="feedback good" style={{ marginTop: 8 }}>
          语义不变性会抑制稠密任务需要的空间细节——LingBot 把这部分补了回来。
        </div>
      )}
    </div>
  );
};

export default HeroNew;
