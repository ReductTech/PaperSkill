import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ patchX: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [patchX, setPatchX] = useState(0);
  const [feedback, setFeedback] = useState({ text: '拖动左侧高亮像素块，观察任务表示与权重共享的变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { patchX: number; dragging: boolean }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const gx = 30, gy = 24, cell = 32, gap = 4;
      const cells = 7;
      // digit "7" pattern on 7x7 grid
      const digit = [
        [1,1,1,1,1,1,1],
        [0,0,0,0,0,1,1],
        [0,0,0,0,1,1,0],
        [0,0,0,1,1,0,0],
        [0,0,1,1,0,0,0],
        [0,0,1,1,0,0,0],
        [0,0,1,1,0,0,0],
      ];
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const x = gx + c * (cell + gap);
          const y = gy + r * (cell + gap);
          ctx.fillStyle = digit[r][c] ? C.blue : '#ffffff';
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeRect(x, y, cell, cell);
        }
      }
      // highlighted patch (3x3) displaced horizontally
      const pc = Math.round(s.patchX * 4);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.strokeRect(gx + pc * (cell + gap) - 2, gy + 2 * (cell + gap) - 2, cell * 3 + gap * 2 + 4, cell * 3 + gap * 2 + 4);
      // right panel: Fisher overlap bars per layer
      const rx = 360, ry = 24, rw = 680, rh = 232;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      const layers = ['浅层', '中层', '深层'];
      const vals = [1 - 0.85 * s.patchX, 1 - 0.55 * s.patchX, 1 - 0.15 * s.patchX];
      layers.forEach((label, i) => {
        const y = ry + 30 + i * 60;
        ctx.fillStyle = C.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText(label, rx + 16, y + 6);
        ctx.fillStyle = C.border;
        ctx.fillRect(rx + 70, y - 8, 480, 22);
        const v = vals[i];
        ctx.fillStyle = v > 0.7 ? C.green : v > 0.4 ? C.orange : C.red;
        ctx.fillRect(rx + 70, y - 8, 480 * v, 22);
        ctx.fillStyle = C.ink;
        ctx.fillText(v.toFixed(2), rx + 70 + 480 * v + 8, y + 8);
      });
      ctx.fillStyle = C.muted;
      ctx.fillText('Fisher 重叠（1=完全共享）', rx + 16, ry + rh - 14);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disc = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disc();
    };
  }, []);

  const setFromPointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const v = clamp((x - 40) / 260, 0, 1);
    stateRef.current.patchX = v;
    setPatchX(v);
    updateFeedback(v);
  };
  const updateFeedback = (v: number) => {
    if (v < 0.25) setFeedback({ text: '表示变化很小，任务仍很相似。', cls: '' });
    else if (v < 0.7) setFeedback({ text: '像素被打乱得越多，浅层权重越需要分开使用。', cls: '' });
    else setFeedback({ text: '浅层几乎各用各的，但深层仍在共享——因为类别（靶心）没变。', cls: 'good' });
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stateRef.current.dragging = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.dragging) setFromPointer(e.clientX);
  };
  const onPointerUp = () => {
    stateRef.current.dragging = false;
  };
  const reset = () => {
    stateRef.current.patchX = 0;
    setPatchX(0);
    setFeedback({ text: '已重置：像素块回到原位，任务表示恢复相似。', cls: '' });
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: 'grab', touchAction: 'none' }}
      />
      <div className="ctrl">
        <label>像素块偏移 <span className="val">{patchX.toFixed(2)}</span></label>
        <button className="chip" onClick={reset}>重置</button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh2Mod1;
