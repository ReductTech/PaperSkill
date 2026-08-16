import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 类比卡：一步一记的递推。token 依次读入，隐状态 h 随之累积（h = Āh + B̄x），
// 每个位置读出输出 y。递推即沿序列行进：走一步、记一次。
const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, w, h);
}

const W = 244, H = 130;
const N = 4;

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const p = (t / 3.0) % 1;
      const k = clamp(Math.floor(p * (N + 0.4)), 0, N); // 已读入的 token 数 0..N

      // 输入 token 序列
      for (let i = 0; i < N; i++) {
        const x = 12 + i * 22;
        const on = i < k;
        ctx.fillStyle = on ? C.blue : '#ffffff';
        rr(ctx, x, 22, 16, 16, 4);
        ctx.fill();
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = on ? '#ffffff' : C.muted;
        ctx.font = 'bold 9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x' + (i + 1), x + 8, 31);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      // 方向箭头 → h
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(98, 30);
      ctx.lineTo(134, 52);
      ctx.stroke();

      // 隐状态 h：随已读 token 增长
      const r = 9 + (k / N) * 8;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(150, 62, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('h', 150, 63);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // 方向箭头 h → y
      ctx.strokeStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(160, 62);
      ctx.lineTo(194, 62);
      ctx.stroke();

      // 输出 y：读过一次即出现
      const yr = k > 0 ? 9 : 5;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(206, 62, yr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (k > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('y', 206, 63);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      // 图注
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('h = Āh + B̄x', 96, 98);
      ctx.fillText('走一步，记一次', 96, 114);
    };
    const tick = (t: number) => {
      render((t / 1000) % 3.0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
