import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 模块 3.1 —— 切换“独立分块 / 共享记录本”，看漂移出现或消失。
const W = 560;
const H = 240;

type Mode = 'isolated' | 'shared';
interface DriftState {
  t: number;
  mode: Mode;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.66, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.86, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

function drawLogbook(ctx: CanvasRenderingContext2D, x: number, y: number, fill = 0, w = 54, h = 64) {
  ctx.fillStyle = '#fffef8';
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#27446e';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  const rows = Math.round(fill * 8);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < rows; i++) {
    const ry = y + 8 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x + 6, ry);
    ctx.lineTo(x + w / 2 - 4, ry);
    ctx.moveTo(x + w / 2 + 4, ry);
    ctx.lineTo(x + w - 6, ry);
    ctx.stroke();
  }
}

export const ModDriftDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<DriftState>({ t: 0, mode: 'isolated' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('isolated');
  const [feedback, setFeedback] = useState({
    text: '没有全局参照：接缝错位，漂移累积。切到“共享记录本”看看。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: DriftState) => {
      const isolated = s.mode === 'isolated';
      // 漂移量：独立时随时间往复摆动（体现累计漂移的抖动），共享时几乎为 0
      const drift = isolated ? 10 + Math.sin(s.t * 0.5) * 3 : 0;
      const shake = isolated ? Math.sin(s.t * 0.7) * 1.6 : 0;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const seamX = W / 2;
      const yBase = 118;

      // 左段地图（固定角度）
      const leftPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 30; i++) {
        const f = i / 30;
        leftPts.push({ x: 40 + f * (seamX - 60), y: yBase + Math.sin(f * Math.PI * 2) * 6 });
      }
      drawTrail(ctx, leftPts);

      // 右段地图（独立时整体旋转 + 上移，形成接缝错位）
      const rightPts: { x: number; y: number }[] = [];
      const ox = seamX + 20;
      const oy = yBase + (isolated ? -drift : 0);
      const ang = isolated ? -0.18 : 0;
      for (let i = 0; i <= 30; i++) {
        const f = i / 30;
        const lx = f * (W - 60 - ox);
        const ly = Math.sin(f * Math.PI * 2) * 6;
        const rx = ox + lx * Math.cos(ang) - ly * Math.sin(ang);
        const ry = oy + lx * Math.sin(ang) + ly * Math.cos(ang) + shake;
        rightPts.push({ x: rx, y: ry });
      }
      drawTrail(ctx, rightPts);

      // 接缝标记
      const leftEnd = leftPts[leftPts.length - 1];
      const rightStart = rightPts[0];
      if (isolated) {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(leftEnd.x, leftEnd.y);
        ctx.lineTo(rightStart.x, rightStart.y);
        ctx.stroke();
        // 红色缝隙叉号
        ctx.beginPath();
        ctx.moveTo(seamX - 6, (leftEnd.y + rightStart.y) / 2 - 6);
        ctx.lineTo(seamX + 6, (leftEnd.y + rightStart.y) / 2 + 6);
        ctx.moveTo(seamX + 6, (leftEnd.y + rightStart.y) / 2 - 6);
        ctx.lineTo(seamX - 6, (leftEnd.y + rightStart.y) / 2 + 6);
        ctx.stroke();
      } else {
        // 闭合接缝变绿
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(seamX, yBase, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 共享模式：中央出现蓝色记录本
      if (!isolated) {
        const fill = 0.3 + (Math.sin(s.t * 0.1) * 0.5 + 0.5) * 0.6;
        drawLogbook(ctx, seamX - 27, 150, fill, 54, 64);
      }

      // 顶部标题
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(isolated ? '独立分块：各测各的' : '共享记录本：统一参照', 20, 26);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
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

  const applyMode = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'isolated') {
      setFeedback({ text: '没有全局参照：接缝错位，漂移累积。', cls: 'bad' });
    } else {
      setFeedback({ text: '共享全局记录：接缝对齐，一致。', cls: 'good' });
    }
  };

  const opts: { key: Mode; label: string }[] = [
    { key: 'isolated', label: '独立分块' },
    { key: 'shared', label: '共享记录本' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {opts.map((o) => (
          <button
            key={o.key}
            className={`chip ${mode === o.key ? 'selected' : ''}`}
            onClick={() => applyMode(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModDriftDemo;
