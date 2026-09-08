import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 模块 2.1 —— 逐段推进，看清 4 个有重叠的块。
const W = 560;
const H = 240;
const CHUNKS = 4;
const OVERLAP_FRAMES = 2;

interface Pt {
  x: number;
  y: number;
}
interface ChunkState {
  t: number;
  step: number; // 1..4
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.72);
  ctx.quadraticCurveTo(w * 0.85, h * 0.8, w, h * 0.66);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: Pt[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

function drawSurveyor(ctx: CanvasRenderingContext2D, x: number, y: number, phase = 0, color = '#27446e') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  const s = Math.sin(phase) * 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x - 4 - s, y + 8);
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 4 + s, y + 8);
  ctx.stroke();
}

export const ModChunking: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ChunkState>({ t: 0, step: 1 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({
    text: '第 1/4 块，与相邻块共享 2 帧重叠。',
    cls: '',
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

    const x0 = 24;
    const x1 = W - 24;
    const span = x1 - x0;
    // 每块窗口（含重叠）以帧比例定义：整条路 12 帧、每块 4 帧、步长 3、重叠 1 段
    const totalFrames = 12;
    const chunkFrames = 4;
    const stride = 3;
    const frameX = (f: number) => x0 + (f / totalFrames) * span;

    const render = (s: ChunkState) => {
      const phase = s.t * 0.12;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const yTrail = 96;
      const pts: Pt[] = [];
      const segs = 60;
      for (let i = 0; i <= segs; i++) {
        const f = i / segs;
        pts.push({ x: x0 + f * span, y: yTrail + Math.sin(f * Math.PI * 4 + phase) * 8 });
      }
      drawTrail(ctx, pts);

      // 各块窗口
      const startF = (k: number) => k * stride;
      const cur = s.step - 1;
      const curStart = startF(cur);
      const curEnd = curStart + chunkFrames;

      // 重叠带（当前块与相邻块的公共帧）
      const drawBand = (a: number, b: number) => {
        const bx = frameX(a);
        const bw = frameX(b) - bx;
        ctx.fillStyle = 'rgba(39,68,110,0.16)';
        ctx.fillRect(bx, yTrail - 30, bw, 60);
      };
      if (cur > 0) drawBand(curStart, curStart + OVERLAP_FRAMES);
      if (cur < CHUNKS - 1) drawBand(curEnd - OVERLAP_FRAMES, curEnd);

      // 分段竖线
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      for (let k = 0; k < CHUNKS; k++) {
        const sx = frameX(startF(k));
        const ex = frameX(startF(k) + chunkFrames);
        [sx, ex].forEach((xx) => {
          ctx.beginPath();
          ctx.moveTo(xx, yTrail - 34);
          ctx.lineTo(xx, yTrail + 34);
          ctx.stroke();
        });
      }

      // 当前块高亮框（蓝）
      const csx = frameX(curStart);
      const cex = frameX(curEnd);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(csx, yTrail - 30, cex - csx, 60);

      // 测量员走在当前块中部
      drawSurveyor(ctx, (csx + cex) / 2, yTrail + 4, phase);

      // 顶部标题
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`第 ${s.step} / ${CHUNKS} 块`, x0, 28);

      // 下区块索引条
      const barY = H - 46;
      const cellW = span / CHUNKS;
      for (let k = 0; k < CHUNKS; k++) {
        const bx = x0 + k * cellW;
        const active = k === cur;
        ctx.fillStyle = active ? '#27446e' : '#e7ece3';
        ctx.fillRect(bx + 3, barY, cellW - 6, 22);
        ctx.strokeStyle = active ? '#27446e' : '#c7d0c0';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 3, barY, cellW - 6, 22);
        ctx.fillStyle = active ? '#ffffff' : '#68778f';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`块${k + 1}`, bx + cellW / 2 - 14, barY + 15);
        // 重叠连接标记
        if (k < CHUNKS - 1) {
          ctx.fillStyle = 'rgba(39,68,110,0.5)';
          ctx.fillRect(bx + cellW - 5, barY + 6, 10, 10);
        }
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('索引条：蓝格=当前块，小方块=与相邻块的重叠', x0, barY - 8);
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

  const setStepTo = (v: number) => {
    const k = clamp(v, 1, CHUNKS);
    stateRef.current.step = k;
    setStep(k);
    const neighbors = k === 1 || k === CHUNKS ? 1 : 2;
    setFeedback({
      text: `第 ${k}/${CHUNKS} 块，与相邻块共享 ${OVERLAP_FRAMES} 帧重叠（相邻块 ${neighbors} 个）。`,
      cls: '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step <= 1} onClick={() => setStepTo(step - 1)}>
          上一段
        </button>
        <span className="step-label">
          第 <b>{step}</b> / {CHUNKS} 块
        </span>
        <button className="tiny" disabled={step >= CHUNKS} onClick={() => setStepTo(step + 1)}>
          下一段
        </button>
      </div>
      <div className="step-desc">
        {step <= 1
          ? '已是第一段：“上一段”不可用。'
          : step >= CHUNKS
          ? '已是最后一段：“下一段”不可用。'
          : '重叠处留作对齐用的“公共桩”。'}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModChunking;
