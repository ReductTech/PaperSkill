import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 1.1 / 5.1 —— P1 滑块模式
// 隐喻：长上下文像一叠长长的试卷，关键信息（"针"）放在卷首/卷尾时考官一眼看到，
// 放在卷中间容易被"淹没"。用滑块移动关键信息位置，实时显示模型命中率。
const CANVAS_W = 720;
const CANVAS_H = 220;

// 论文结论：U 形位置效应——首尾高、中间低（定性区间，不编造精确数值）
function accuracyAt(pos: number, len: number): number {
  const t = pos / Math.max(1, len - 1); // 0..1
  // U 形：两端高、中间低
  const u = 0.45 + 0.5 * Math.abs(t - 0.5) * 2; // 0.45..0.95
  // 长上下文整体下压
  const penalty = len > 16 ? 0.12 : 0;
  return Math.max(0.1, Math.min(0.98, u - penalty));
}

export function LitmKeyPosition({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [len, setLen] = useState(8);
  const [pos, setPos] = useState(4);
  const stateRef = useRef({ len, pos });
  stateRef.current = { len, pos };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, CANVAS_W, CANVAS_H);

    const draw = () => {
      const { len: L, pos: P } = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      // 背景
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const padX = 30;
      const stripY = 60;
      const stripH = 90;
      const stripW = CANVAS_W - padX * 2;
      const cell = stripW / L;
      // 试卷条
      for (let i = 0; i < L; i++) {
        const x = padX + i * cell;
        const accent = i === P;
        ctx.fillStyle = accent ? '#ffd166' : i < L * 0.2 || i > L * 0.8 ? '#2a3a66' : '#1c2746';
        ctx.fillRect(x, stripY, cell - 3, stripH);
        ctx.fillStyle = accent ? '#1a1206' : '#9fb3d9';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), x + cell / 2, stripY + stripH / 2 + 4);
      }
      // 关键信息标记
      const kx = padX + P * cell + cell / 2;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(kx, stripY - 14);
      ctx.lineTo(kx, stripY + stripH + 14);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.font = '12px system-ui';
      ctx.fillText('关键信息', kx, stripY - 18);
      // 命中率
      const acc = accuracyAt(P, L);
      ctx.fillStyle = acc > 0.7 ? '#52e0a0' : acc > 0.5 ? '#ffd166' : '#ff6b6b';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`模型命中率 ≈ ${(acc * 100).toFixed(0)}%`, padX, 36);
    };

    const start = () => {
      const loop = () => {
        draw();
        reqRef.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const stop = () => cancelAnimationFrame(reqRef.current);
    start();
    return () => stop();
  }, []);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <div className="litm-controls">
        <label>
          试卷数量（上下文长度）：<b>{len}</b>
          <input type="range" min={4} max={24} step={1} value={len}
            onChange={(e) => setLen(Number(e.target.value))} />
        </label>
        <label>
          关键信息放在第几张：<b>{pos + 1}</b> / {len}
          <input type="range" min={0} max={len - 1} step={1} value={pos}
            onChange={(e) => setPos(Number(e.target.value))} />
        </label>
      </div>
      <p className="litm-hint">
        拖动滑块把"关键信息"从卷首移到卷尾：你会发现它处在<strong>最前 / 最后</strong>时命中率最高，
        拖到<strong>中间</strong>时明显下降——这正是论文的 U 形位置效应。
      </p>
    </div>
  );
}
