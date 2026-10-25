import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const INK = '#21324a';
const BORDER = '#d7deea';
const BLUE = '#27446e';

const CELL = 25;
const COLS = 8;
const GRID_X = 320;
const GRID_Y = 40;

const RAW: number[][] = [
  [0, 32, 96, 160, 224, 255, 200, 128],
  [16, 48, 112, 176, 240, 216, 168, 96],
  [64, 80, 144, 208, 255, 190, 136, 72],
  [128, 160, 200, 232, 255, 176, 120, 56],
  [200, 224, 248, 255, 208, 152, 96, 40],
  [240, 255, 232, 192, 144, 104, 64, 24],
  [176, 208, 176, 144, 112, 80, 48, 16],
  [96, 128, 104, 80, 56, 40, 24, 8],
];

type Rect = { x: number; y: number; w: number; h: number };

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#dfe6d5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.lineTo(w, h - 22);
  ctx.stroke();
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): Rect {
  ctx.fillStyle = '#92400e';
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.fill();
  const gx = x + 12;
  const gy = y + 12;
  const gw = w - 24;
  const gh = h - 24;
  ctx.fillStyle = '#eaf1fb';
  roundRectPath(ctx, gx, gy, gw, gh, 8);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  roundRectPath(ctx, gx, gy, gw, gh, 8);
  ctx.stroke();
  return { x: gx, y: gy, w: gw, h: gh };
}

function drawCloth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(x - 4, y - r - 16, 8, 16);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = INK;
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function feedbackFor(raw: number): { text: string; cls: string } {
  const scaled = (2 * (raw / 255) - 1).toFixed(2);
  if (raw >= 250) {
    return { text: `当前像素 ${raw}，缩放后 ${scaled}。接近纯白；缩放后接近 1。`, cls: '' };
  }
  return { text: `当前像素 ${raw}，缩放后 ${scaled}。`, cls: '' };
}

export const Ch2Grid: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ col: 0, row: 0 });
  const dragRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState({ col: 0, row: 0, raw: 0 });
  const [feedback, setFeedback] = useState(feedbackFor(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { col: number; row: number }) => {
      clearScene(ctx, W, H);
      drawWindow(ctx, 40, 26, 760, 228);
      for (let r = 0; r < COLS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = RAW[r][c];
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(GRID_X + c * CELL, GRID_Y + r * CELL, CELL, CELL);
        }
      }
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(GRID_X + i * CELL, GRID_Y);
        ctx.lineTo(GRID_X + i * CELL, GRID_Y + CELL * COLS);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(GRID_X, GRID_Y + i * CELL);
        ctx.lineTo(GRID_X + CELL * COLS, GRID_Y + i * CELL);
        ctx.stroke();
      }
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        GRID_X + s.col * CELL + 2,
        GRID_Y + s.row * CELL + 2,
        CELL - 4,
        CELL - 4
      );
      drawCloth(
        ctx,
        GRID_X + s.col * CELL + CELL / 2,
        GRID_Y + s.row * CELL + CELL / 2,
        10,
        BLUE
      );
      const raw = RAW[s.row][s.col];
      const shade = Math.round(lerp(0, 255, raw / 255));
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      roundRectPath(ctx, 840, 70, 150, 150, 10);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, 840, 70, 150, 150, 10);
      ctx.stroke();
      drawSceneLabel(ctx, '8×8 像素网格', 40, 18);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (col: number, row: number) => {
    const c = clamp(Math.round(col), 0, COLS - 1);
    const r = clamp(Math.round(row), 0, COLS - 1);
    const raw = RAW[r][c];
    stateRef.current.col = c;
    stateRef.current.row = r;
    setSel({ col: c, row: r, raw });
    setFeedback(feedbackFor(raw));
  };

  const pick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    const y = (clientY - rect.top) * (H / rect.height);
    const col = Math.floor(map(x, GRID_X, GRID_X + CELL * COLS, 0, COLS));
    const row = Math.floor(map(y, GRID_Y, GRID_Y + CELL * COLS, 0, COLS));
    select(col, row);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) pick(e.clientX, e.clientY);
  };

  const onPointerUp = () => {
    dragRef.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    let col = stateRef.current.col;
    let row = stateRef.current.row;
    if (e.key === 'ArrowLeft') col -= 1;
    else if (e.key === 'ArrowRight') col += 1;
    else if (e.key === 'ArrowUp') row -= 1;
    else if (e.key === 'ArrowDown') row += 1;
    else return;
    e.preventDefault();
    select(col, row);
  };

  const reset = () => select(0, 0);

  const scaled = 2 * (sel.raw / 255) - 1;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>
          原始像素 <span className="val">{sel.raw}</span>
        </label>
        <label>
          缩放后 <span className="val">{scaled.toFixed(2)}</span>
        </label>
        <button className="tiny ghost" type="button" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Grid;
