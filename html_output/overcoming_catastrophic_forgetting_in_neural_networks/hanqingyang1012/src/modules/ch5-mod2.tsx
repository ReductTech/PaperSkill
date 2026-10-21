import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5.2（P6 拖动，technical，1080×280）：白色场，x 轴「λ」（0.01..100 对数映射
// λ = 10^(4·pos−2)，pos∈0..1）；旧任务保持率（绿，随 λ 升向 1）与新任务学习率
// （橙红，随 λ 下降）两条曲线；橙色竖线标记 + 两个裸数字；两曲线均 >0.8 的区间
// 画浅绿带。拖动用 pointer 事件（setPointerCapture、clamp），键盘方向键微调。
const W = 1080;
const H = 280;
const PLOT = { x0: 90, x1: 1010, y0: 30, y1: 230 };
const LN4 = Math.log(4);
const U_LO = LN4 / 1.8 - 0.9;
const U_HI = 0.9 - LN4 / 1.8;
const POS_LO = (U_LO + 2) / 4;
const POS_HI = (U_HI + 2) / 4;

const C = {
  bg: '#f5f8f0',
  rockL: '#b8c9a7',
  rockD: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  mute: '#68778f',
  border: '#d7deea',
};

const keepA = (u: number): number => 1 / (1 + Math.exp(-(u + 0.9) * 1.8));
const learnB = (u: number): number => 1 - 1 / (1 + Math.exp(-(u - 0.9) * 1.8));
const lambdaOf = (pos: number): number => Math.pow(10, 4 * pos - 2);

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

export const Ch5Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pos: 0.5 });
  const dragRef = useRef(false);
  const [pos, setPos] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>({
    text: '把标记拖向两端，感受权衡。',
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
    let raf = 0;

    const render = (): void => {
      const s = stateRef.current;
      const u = 4 * s.pos - 2;
      const mx = PLOT.x0 + s.pos * (PLOT.x1 - PLOT.x0);
      const vA = keepA(u);
      const vB = learnB(u);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // sweet band: both curves > 0.8
      const bx0 = PLOT.x0 + POS_LO * (PLOT.x1 - PLOT.x0);
      const bx1 = PLOT.x0 + POS_HI * (PLOT.x1 - PLOT.x0);
      ctx.fillStyle = 'rgba(34,141,92,0.10)';
      ctx.fillRect(bx0, PLOT.y0, bx1 - bx0, PLOT.y1 - PLOT.y0);
      ctx.strokeStyle = 'rgba(34,141,92,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx0 + 0.5, PLOT.y0 + 0.5, bx1 - bx0 - 1, PLOT.y1 - PLOT.y0 - 1);

      // x-axis
      ctx.strokeStyle = C.mute;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.x0, PLOT.y1);
      ctx.lineTo(PLOT.x1, PLOT.y1);
      ctx.stroke();
      text(ctx, '0.01', PLOT.x0, PLOT.y1 + 18, C.mute, 12, 'center');
      text(ctx, '1', (PLOT.x0 + PLOT.x1) / 2, PLOT.y1 + 18, C.mute, 12, 'center');
      text(ctx, '100', PLOT.x1, PLOT.y1 + 18, C.mute, 12, 'center');
      text(ctx, 'λ', PLOT.x1 + 8, PLOT.y1 + 20, C.ink, 16);

      // curves
      const drawCurve = (fn: (uu: number) => number, color: string, width: number): void => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const N = 80;
        for (let i = 0; i <= N; i++) {
          const p = i / N;
          const x = PLOT.x0 + p * (PLOT.x1 - PLOT.x0);
          const y = PLOT.y0 + (1 - fn(4 * p - 2)) * (PLOT.y1 - PLOT.y0);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawCurve(keepA, C.green, 3);
      drawCurve(learnB, C.orange, 3);

      // marker: orange vertical line + knob on the axis
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mx, PLOT.y0);
      ctx.lineTo(mx, PLOT.y1);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(mx, PLOT.y1 + 8, 6, 0, Math.PI * 2);
      ctx.fill();

      // two bare numbers at the marker
      const yA = PLOT.y0 + (1 - vA) * (PLOT.y1 - PLOT.y0);
      const yB = PLOT.y0 + (1 - vB) * (PLOT.y1 - PLOT.y0);
      text(ctx, vA.toFixed(2), mx - 10, Math.max(yA - 10, PLOT.y0 + 14), C.green, 15, 'right');
      text(ctx, vB.toFixed(2), mx + 10, Math.min(yB + 20, PLOT.y1 + 16), C.orange, 15, 'left');

      // legend (2 entries)
      ctx.fillStyle = C.green;
      ctx.fillRect(760, 10, 14, 4);
      text(ctx, '旧任务保持率', 780, 16, C.mute, 12);
      ctx.fillStyle = C.orange;
      ctx.fillRect(880, 10, 14, 4);
      text(ctx, '新任务学习率', 900, 16, C.mute, 12);
    };

    const tick = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const apply = (p: number): void => {
    const v = clamp(p, 0, 1);
    stateRef.current.pos = v;
    setPos(v);
    if (v >= POS_LO && v <= POS_HI) {
      setFeedback({ text: '当前 λ 落在甜点区：两个任务的表现都还能接受。', cls: 'good' });
    } else if (v < POS_LO) {
      setFeedback({ text: 'λ 偏小：新任务学得快，旧任务保持率下降。', cls: '' });
    } else {
      setFeedback({ text: 'λ 偏大：旧任务稳如磐石，新任务学不动。', cls: 'bad' });
    }
  };

  const updateFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    apply((e.clientX - rect.left) / rect.width);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    dragRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (dragRef.current) updateFromEvent(e);
  };
  const onPointerUp = (): void => {
    dragRef.current = false;
    setDragging(false);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      apply(stateRef.current.pos - 0.02);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      apply(stateRef.current.pos + 0.02);
    }
  };

  return (
    <div tabIndex={0} onKeyDown={onKeyDown} aria-label="λ 拖动区">
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          当前 λ <span className="val">{lambdaOf(pos).toFixed(2)}</span>
        </label>
        <span>拖动橙色竖线，或用 ←/→ 键微调。</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod2;
