import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function piece(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s / 2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pos: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [pos, setPos] = useState(0);
  const [feedback, setFeedback] = useState({ text: '左右拖动拼块，看高斯分布怎么变。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // left: slot + draggable piece
      const slotX = 240;
      const slotY = 170;
      ctx.strokeStyle = '#228d5c';
      ctx.setLineDash([6, 5]);
      roundRect(ctx, slotX - 32, slotY - 28, 64, 58, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      const px = slotX + s.pos;
      const dist = Math.abs(s.pos);
      const color = dist > 90 ? '#c43f52' : dist > 30 ? '#f07e47' : '#228d5c';
      piece(ctx, px, slotY - 4, 46, color);

      // right: Gaussian + rate bar
      const mu = 720 + s.pos;
      const sigma = 40 + dist * 2.2;
      const baseY = 210;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 520; x <= 1020; x += 4) {
        const y = baseY - 150 * Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));
        if (x === 520) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('高斯分布', 520, 30);
      ctx.fillStyle = '#21324a';
      ctx.fillText('μ = ' + (s.pos).toFixed(0) + '  σ = ' + sigma.toFixed(0), 520, 56);

      const rate = dist / 120;
      const rbw = 460;
      ctx.fillStyle = rate > 0.6 ? '#c43f52' : rate > 0.25 ? '#f07e47' : '#228d5c';
      ctx.fillRect(520, H - 40 - rate * 40, rbw, rate * 40);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(520, H - 80, rbw, 40);
      ctx.fillStyle = '#68778f';
      ctx.fillText('码率（越紧越省）', 520, H - 50);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const updateFeedback = (v: number) => {
    const a = Math.abs(v);
    if (a > 90) setFeedback({ text: '偏太远，σ 很大、要花很多比特。', cls: 'bad' });
    else if (a > 30) setFeedback({ text: '有点偏，σ 中等。', cls: '' });
    else setFeedback({ text: '贴得紧，σ 小、比特省。', cls: 'good' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const v = clamp(cx - 240, -120, 120);
    stateRef.current.pos = v;
    setPos(v);
    updateFeedback(v);
  };

  const onPointerUp = () => {
    stateRef.current.dragging = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const delta = e.key === 'ArrowLeft' ? -6 : 6;
      const v = clamp(stateRef.current.pos + delta, -120, 120);
      stateRef.current.pos = v;
      setPos(v);
      updateFeedback(v);
    }
  };

  return (
    <div onKeyDown={onKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="ctrl">
        <label>
          拼块偏移 <span className="val">{pos.toFixed(0)}</span>
        </label>
        <span className="step-label" style={{ color: '#68778f' }}>
          （也可用 ← → 键微调）
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod41;
