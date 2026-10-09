import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m3-2 (dot-drag) — 亲手对上：拖拽锚点向量 o，观察与提示向量 p 的余弦相似度。

const W = 1080;
const H = 280;
const OX = 340;
const OY = 150;
const R = 110;
const THRESH = 0.5;

export const M3_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ ang: 1.22, mag: 1.0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({
    text: '拖动蓝色向量靠近绿色提示向量：方向越一致，分数越高。',
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

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 12 * Math.cos(a - 0.4), y2 - 12 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 12 * Math.cos(a + 0.4), y2 - 12 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 单位圆淡痕
      ctx.save();
      ctx.strokeStyle = '#dfe6da';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(OX, OY, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 阈值扇形（±60°，浅绿）
      ctx.save();
      ctx.fillStyle = 'rgba(34,141,92,0.10)';
      ctx.beginPath();
      ctx.moveTo(OX, OY);
      ctx.arc(OX, OY, R, -Math.PI / 3, Math.PI / 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // p（绿，0°）与 o（蓝，角度 ang）
      arrow(OX, OY, OX + R, OY, PALETTE.green, 3.5);
      const ox2 = OX + R * s.mag * Math.cos(s.ang);
      const oy2 = OY - R * s.mag * Math.sin(s.ang);
      arrow(OX, OY, ox2, oy2, PALETTE.blue, 3.5);
      drawSceneLabel(ctx, 'p', OX + R + 10, OY + 5, PALETTE.green);
      drawSceneLabel(ctx, 'o', ox2 + 10, oy2 + 5, PALETTE.blue);

      // 夹角弧
      const sim = Math.cos(s.ang) * s.mag;
      const hit = sim > THRESH;
      ctx.save();
      ctx.strokeStyle = hit ? PALETTE.green : PALETTE.muted;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(OX, OY, 44, -Math.abs(s.ang), 0, s.ang > 0);
      ctx.stroke();
      ctx.restore();

      // 右侧 inset：cos 值与命中标记
      insetBox(ctx, 730, 50, 310, 180);
      drawSceneLabel(ctx, '相似度 = cos(夹角) × 模长', 754, 88, PALETTE.ink);
      ctx.save();
      ctx.fillStyle = hit ? PALETTE.green : sim < 0 ? PALETTE.red : PALETTE.blue;
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(sim.toFixed(2), 754, 140);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = hit ? PALETTE.green : PALETTE.muted;
      ctx.fillText(hit ? '✓ 命中（> 0.5）' : '✗ 未命中（阈值 0.5）', 754, 178);
      ctx.restore();
    };

    const tick = () => {
      render();
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

  const judge = () => {
    const s = stateRef.current;
    const sim = Math.cos(s.ang) * s.mag;
    if (sim < 0) setFeedback({ text: '方向相反：相似度为负，绝不可能是它。', cls: 'bad' });
    else if (sim > THRESH)
      setFeedback({ text: sim.toFixed(2) + ' 超过阈值——这个锚点被命名为该类别。', cls: 'good' });
    else setFeedback({ text: '拖动蓝色向量靠近绿色提示向量：方向越一致，分数越高。', cls: '' });
  };

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const setFromPoint = (p: { x: number; y: number }) => {
    const dx = p.x - OX;
    const dy = OY - p.y;
    const s = stateRef.current;
    s.ang = Math.atan2(dy, dx);
    s.mag = clamp(Math.hypot(dx, dy) / R, 0.4, 1.0);
    judge();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const s = stateRef.current;
    const ox2 = OX + R * s.mag * Math.cos(s.ang);
    const oy2 = OY - R * s.mag * Math.sin(s.ang);
    if (Math.hypot(p.x - ox2, p.y - oy2) < 42) {
      s.dragging = true;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    setFromPoint(toLocal(e));
  };
  const onPointerUp = () => {
    stateRef.current.dragging = false;
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') s.ang += 0.08;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') s.ang -= 0.08;
    else return;
    e.preventDefault();
    judge();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>拖拽蓝色向量端点，或聚焦后用方向键转动（阈值 0.5）</label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M3_2;
