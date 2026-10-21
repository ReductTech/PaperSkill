import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const STAR = '#dfe7f5';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const BORDER = '#d7deea';
const GX = 40;
const GY = 30;
const GW = 560;
const GH = 220;
const COLS = 8;
const ROWS = 5;
const IX = 680;
const IY = 40;
const IW = 360;
const IH = 200;

function cellOf(x: number, y: number) {
  const c = clamp(Math.floor(((x - GX) / GW) * COLS), 0, COLS - 1);
  const r = clamp(Math.floor(((y - GY) / GH) * ROWS), 0, ROWS - 1);
  return { c, r };
}

function render(ctx: CanvasRenderingContext2D, p: { x: number; y: number }) {
  const { c, r } = cellOf(p.x, p.y);
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GLOW;
  ctx.fillRect(GX, GY, GW, GH);
  ctx.strokeStyle = BORDER;
  ctx.strokeRect(GX, GY, GW, GH);
  ctx.fillStyle = DIM;
  for (const [x, y] of [[120, 80], [260, 200], [400, 90], [520, 190]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = STAR;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BLUE;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(IX + (c / COLS) * IW + IW / COLS / 2, IY + (r / ROWS) * IH + IH / ROWS / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#122346';
  ctx.fillRect(IX, IY, IW, IH);
  for (let i = 0; i <= COLS; i++) {
    const x = IX + (i / COLS) * IW;
    ctx.strokeStyle = BORDER;
    ctx.beginPath();
    ctx.moveTo(x, IY);
    ctx.lineTo(x, IY + IH);
    ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    const y = IY + (j / ROWS) * IH;
    ctx.strokeStyle = BORDER;
    ctx.beginPath();
    ctx.moveTo(IX, y);
    ctx.lineTo(IX + IW, y);
    ctx.stroke();
  }
  const cx = IX + (c / COLS) * IW;
  const cy = IY + (r / ROWS) * IH;
  ctx.fillStyle = BLUE;
  ctx.fillRect(cx, cy, IW / COLS, IH / ROWS);
  ctx.strokeStyle = '#dfe7f5';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx, cy, IW / COLS, IH / ROWS);
  ctx.fillStyle = '#21324a';
  ctx.font = '16px sans-serif';
  ctx.fillText(`特征响应 (${c + 1}, ${r + 1})`, IX, IY - 8);
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [pos, setPos] = useState({ x: 320, y: 140 });
  const [feedback, setFeedback] = useState({
    text: '拖动星星，看右侧特征响应跟着移动。',
    cls: '',
  });
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const toCanvas = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clamp(((e.clientX - rect.left) / rect.width) * W, GX + 8, GX + GW - 8),
        y: clamp(((e.clientY - rect.top) / rect.height) * H, GY + 8, GY + GH - 8),
      };
    };
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      setPos(toCanvas(e));
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      setPos(toCanvas(e));
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      const { c, r } = cellOf(posRef.current.x, posRef.current.y);
      setFeedback({
        text: `特征响应移到 (${c + 1}, ${r + 1})：目标平移，特征也平移，这就是共享特征的平移不变性。`,
        cls: 'good',
      });
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const key = (e: KeyboardEvent) => {
      const step = 16;
      let { x, y } = posRef.current;
      if (e.key === 'ArrowLeft') x -= step;
      if (e.key === 'ArrowRight') x += step;
      if (e.key === 'ArrowUp') y -= step;
      if (e.key === 'ArrowDown') y += step;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setPos({ x: clamp(x, GX + 8, GX + GW - 8), y: clamp(y, GY + 8, GY + GH - 8) });
      }
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('keydown', key);
    canvas.tabIndex = 0;
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('keydown', key);
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    render(ctx, pos);
    const canvas = canvasRef.current;
    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [pos]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          星位置 <span className="val">{`${Math.round(pos.x)}, ${Math.round(pos.y)}`}</span>
        </label>
        <span>支持方向键微调</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
