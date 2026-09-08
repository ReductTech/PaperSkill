import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 292;
const LEFT = 190;
const TOP = 78;
const SIZE = 148;
const CREASE = LEFT + SIZE / 2;
const RIGHT_OPEN = LEFT + SIZE;
const RIGHT_CLOSED = LEFT;

function foldX(f: number): number {
  return RIGHT_OPEN - (RIGHT_OPEN - RIGHT_CLOSED) * f;
}

export const OrigamiFold: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ fold: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [fold, setFold] = useState(0);
  const [feedback, setFeedback] = useState({ text: '初始状态：一张平展的纸。拖动右边缘开始折叠。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { fold: number; dragging: boolean }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      // workbench surface
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(30, 30, W - 60, H - 66);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(30, 30, W - 60, H - 66);
      const x = foldX(s.fold);
      // predicted final outline (green dashed)
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(LEFT, TOP, CREASE - LEFT, SIZE);
      ctx.setLineDash([]);
      label(ctx, '预测最终状态', LEFT + (CREASE - LEFT) / 2, TOP + SIZE + 18, 10, C.green);
      // left half fixed
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(LEFT, TOP);
      ctx.lineTo(CREASE, TOP);
      ctx.lineTo(CREASE, TOP + SIZE);
      ctx.lineTo(LEFT, TOP + SIZE);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // right half projected as it folds left
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CREASE, TOP);
      ctx.lineTo(x, TOP);
      ctx.lineTo(x, TOP + SIZE);
      ctx.lineTo(CREASE, TOP + SIZE);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // crease
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CREASE, TOP - 10);
      ctx.lineTo(CREASE, TOP + SIZE + 10);
      ctx.stroke();
      label(ctx, '折痕', CREASE, TOP - 22, 10, C.orange);
      // drag handle
      const hy = TOP - 18;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, hy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(x, hy, 4, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, '拖动', x, hy - 20, 10, C.orange);
      // labels kept well inside canvas
      label(ctx, '动作前：平展状态', LEFT - 24, TOP - 26, 11, C.blue);
      label(ctx, '动作后：可预测的新状态', CREASE + 48, TOP - 26, 11, C.blue);
      label(ctx, `折叠角度 ${Math.round(s.fold * 180)}°`, W / 2, 20, 12, s.fold > 0.98 ? C.green : C.blue);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setFoldValue = (v: number) => {
    const f = clamp(v, 0, 1);
    stateRef.current.fold = f;
    setFold(f);
    if (f < 0.02) setFeedback({ text: '初始状态：一张平展的纸。拖动右边缘开始折叠。', cls: '' });
    else if (f < 0.45) setFeedback({ text: `折叠进行中（${Math.round(f * 180)}°）：动作正在执行，右半张纸逐渐盖向左半张。`, cls: '' });
    else if (f < 0.98) setFeedback({ text: `折叠接近完成（${Math.round(f * 180)}°）：状态持续变化，几何关系仍然稳定。`, cls: 'good' });
    else setFeedback({ text: '折叠完成：纸张从平展状态变成半张重叠的新状态，与预测一致。', cls: 'good' });
  };

  const toFold = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    return clamp((RIGHT_OPEN - x) / (RIGHT_OPEN - RIGHT_CLOSED), 0, 1);
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'ew-resize', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          stateRef.current.dragging = true;
          setFoldValue(toFold(e));
        }}
        onPointerMove={(e) => { if (stateRef.current.dragging) setFoldValue(toFold(e)); }}
        onPointerUp={() => { stateRef.current.dragging = false; }}
        onPointerCancel={() => { stateRef.current.dragging = false; }}
      />
      <div className="ctrl">
        <label>折叠进度 <span className="val">{Math.round(fold * 180)}° / 180°</span></label>
        <button className="chip" onClick={() => setFoldValue(0)}>展开</button>
        <button className="chip" onClick={() => setFoldValue(1)}>完全折叠</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default OrigamiFold;
