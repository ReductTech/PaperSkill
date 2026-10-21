import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const ENERGIES = [0.95, 0.7, 0.48, 0.3, 0.14, 0.05];
const N = ENERGIES.length;
const CARD_W = 140;
const GAP = 14;
const START_X = 90;
const CARD_Y = 44;
const CARD_H = 92;

const isSorted = (order: number[]) =>
  order.every((v, i) => i === 0 || ENERGIES[order[i - 1]] >= ENERGIES[order[i]]);

// P6 drag: reorder channel cards by energy; the bar chart follows.
export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ order: [3, 1, 5, 0, 4, 2], dragging: -1 });
  const dragRef = useRef<{ index: number; offsetX: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '拖动卡片，把通道按能量从大到小排序。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cardX = (i: number) => START_X + i * (CARD_W + GAP);

    const render = (s: { order: number[]; dragging: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      s.order.forEach((ch, i) => {
        const x = cardX(i);
        const dragging = i === s.dragging;
        ctx.fillStyle = dragging ? '#27446e' : '#fdfcf9';
        ctx.strokeStyle = dragging ? '#27446e' : '#d7deea';
        ctx.lineWidth = dragging ? 3 : 1;
        ctx.fillRect(x, CARD_Y, CARD_W, CARD_H);
        ctx.strokeRect(x, CARD_Y, CARD_W, CARD_H);
        ctx.fillStyle = '#68778f';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(String(ch), x + 10, CARD_Y + 20);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillText(ENERGIES[ch].toFixed(2), x + 34, CARD_Y + 56);
      });

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('能量', START_X, 200);
      s.order.forEach((ch, i) => {
        const x = cardX(i);
        const bh = ENERGIES[ch] * 70;
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(x, 210 - bh, CARD_W, bh);
        ctx.strokeStyle = '#d7deea';
        ctx.strokeRect(x, 210 - bh, CARD_W, bh);
      });
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

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    const i = Math.floor((x - START_X) / (CARD_W + GAP));
    if (i >= 0 && i < N && y >= CARD_Y && y <= CARD_Y + CARD_H) {
      dragRef.current = { index: i, offsetX: x - (START_X + i * (CARD_W + GAP)) };
      stateRef.current.dragging = i;
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const { x } = getPos(e);
    const center = x - d.offsetX + (CARD_W + GAP) / 2;
    const target = clamp(Math.round((center - START_X) / (CARD_W + GAP)), 0, N - 1);
    if (target !== d.index) {
      const next = [...stateRef.current.order];
      const [item] = next.splice(d.index, 1);
      next.splice(target, 0, item);
      stateRef.current.order = next;
      d.index = target;
      stateRef.current.dragging = target;
      if (isSorted(next)) setFeedback({ text: '已按能量降序排好——信息压缩性质成立！', cls: 'good' });
      else setFeedback({ text: '继续拖，把能量大的通道排到前面。', cls: '' });
    }
  };

  const onUp = () => {
    dragRef.current = null;
    stateRef.current.dragging = -1;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
