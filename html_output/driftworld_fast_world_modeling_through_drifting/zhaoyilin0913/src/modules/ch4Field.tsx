import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, arrow, text } from './river';
import type { WidgetProps } from './registry';

// 第 4 章：漂移场（P6 拖动）。绿色吸引正样本，红色排斥负样本。
const W = 1080;
const H = 300;

export const Ch4Field: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ bx: W * 0.28, by: H * 0.6, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '拖动船，观察漂移场如何把它拉回目标、推离礁石。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { bx: number; by: number }) => {
      drawRiver(ctx, W, H);
      const dockX = W - 90;
      const dockY = H * 0.62;
      const rockX = W * 0.34;
      const rockY = H * 0.4;
      drawDock(ctx, dockX, dockY, COLORS.green);
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(rockX, rockY, 14, 0, Math.PI * 2);
      ctx.fill();
      // 吸引（绿）与排斥（红）向量。
      arrow(ctx, s.bx, s.by, dockX - 30, dockY, COLORS.green, 4);
      const awayDx = s.bx - rockX;
      const awayDy = s.by - rockY;
      const awayLen = Math.hypot(awayDx, awayDy) || 1;
      arrow(ctx, s.bx, s.by, s.bx + (awayDx / awayLen) * 90, s.by + (awayDy / awayLen) * 90, COLORS.red, 4);
      drawBoat(ctx, s.bx, s.by, 1, COLORS.blue, COLORS.green);
      text(ctx, '正样本', dockX, dockY - 44, COLORS.green, 18, 'center');
      text(ctx, '负样本', rockX, rockY - 24, COLORS.red, 18, 'center');
    };
    const tick = () => {
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

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = true;
    const p = point(e);
    stateRef.current.bx = p.x;
    stateRef.current.by = p.y;
    setFeedback({ text: '船偏离目标越远，纠偏的合力越明显。', cls: '' });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const p = point(e);
    stateRef.current.bx = clamp(p.x, 40, W - 40);
    stateRef.current.by = clamp(p.y, H * 0.36, H * 0.84);
  };
  const onUp = () => {
    stateRef.current.dragging = false;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      />
      <div className="ctrl">
        <label>拖动船身探索漂移场</label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Field;
