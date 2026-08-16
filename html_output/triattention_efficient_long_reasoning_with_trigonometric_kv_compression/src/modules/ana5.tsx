import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0';
const BLUE = '#27446e', ORANGE = '#d97706', INK = '#21324a', MUT = '#68778f', DIM = '#c7cfda';

// 第 5 章：旋转后查询方向散成扇面，只有最近几个方向一致 —— 观察窗口极小。
export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const ox = 40, oy = 106;
    const N = 12;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 从同一起点出发的查询向量，方向随位置散开（扇面）
      for (let i = 0; i < N; i++) {
        const recent = i >= N - 3; // 最近 3 个
        // 越早的位置偏转越大；最近 3 个基本一致
        const ang = recent ? -Math.PI / 2 : -Math.PI / 2 + (i - (N - 4)) * 0.34 - 0.5;
        const len = 52 + (i % 3) * 3;
        const x2 = ox + Math.cos(ang) * len;
        const y2 = oy + Math.sin(ang) * len;
        ctx.strokeStyle = recent ? BLUE : DIM;
        ctx.lineWidth = recent ? 2.5 : 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = recent ? BLUE : DIM;
        ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill();
      }

      // 起点
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();

      // 观察窗口括号（只包住最近 3 个，其余在窗外）
      const xr = ox + Math.cos(-Math.PI / 2) * 52;
      const yr = oy + Math.sin(-Math.PI / 2) * 52;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ox, oy, 60, -Math.PI / 2 - 0.16, -Math.PI / 2 + 0.16, false);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.font = '12px ' + FONT;
      ctx.fillText('方向散成扇面', 88, 20);
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('只有最近几个方向一致', 88, 36);
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('窗口太小，远处的键被漏看', 20, 122);
    };

    const tick = (ts: number) => {
      render(ts / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
