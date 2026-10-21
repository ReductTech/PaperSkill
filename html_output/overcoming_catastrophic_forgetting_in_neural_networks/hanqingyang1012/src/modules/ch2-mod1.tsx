import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 Module 2.1 (P5 canvas hotspots + keyboard chips): a 6×6 grid of weights.
// Cell fill by usage: task-A-only blue #27446e, task-B-only orange #f07e47,
// shared purple #7c3aed, free light #b8c9a7; the selected cell gets a green
// outline. Right inset: two horizontal bars 任务A使用度 / 任务B使用度 (0..1,
// fixed deterministic per-cell values, 方向性示意) + bare numbers. Chips
// 选高占用 / 选空闲 / 选共享 give keyboard-equivalent selection.

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const FREE = '#b8c9a7';
const GREEN = '#228d5c';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const PANEL = '#ffffff';

const GX = 40;
const GY = 5;
const CELL = 40;
const GAP = 6;
const STEP = CELL + GAP;

type Usage = 'a' | 'b' | 'shared' | 'free';

interface CellData {
  usage: Usage;
  ua: number;
  ub: number;
}

const cell = (usage: Usage, ua: number, ub: number): CellData => ({ usage, ua, ub });

// Fixed deterministic occupancy map (方向性示意):
//   top-left = task-A weights, top-right = task-B weights, middle = shared,
//   bottom two rows = free capacity.
const GRID: CellData[][] = [
  [cell('a', 0.93, 0.12), cell('a', 0.88, 0.1), cell('a', 0.91, 0.14), cell('b', 0.1, 0.9), cell('b', 0.14, 0.86), cell('b', 0.12, 0.93)],
  [cell('a', 0.86, 0.11), cell('a', 0.9, 0.09), cell('shared', 0.78, 0.72), cell('b', 0.09, 0.91), cell('b', 0.12, 0.88), cell('b', 0.11, 0.9)],
  [cell('a', 0.89, 0.13), cell('shared', 0.74, 0.8), cell('shared', 0.82, 0.85), cell('shared', 0.7, 0.76), cell('b', 0.1, 0.87), cell('b', 0.13, 0.89)],
  [cell('a', 0.85, 0.1), cell('a', 0.92, 0.12), cell('shared', 0.76, 0.7), cell('b', 0.11, 0.92), cell('b', 0.14, 0.85), cell('b', 0.12, 0.9)],
  [cell('free', 0.04, 0.03), cell('free', 0.05, 0.02), cell('free', 0.06, 0.04), cell('free', 0.03, 0.05), cell('free', 0.04, 0.02), cell('free', 0.05, 0.04)],
  [cell('free', 0.03, 0.04), cell('free', 0.02, 0.05), cell('free', 0.04, 0.03), cell('free', 0.05, 0.03), cell('free', 0.02, 0.04), cell('free', 0.03, 0.05)],
];

const FILL: Record<Usage, string> = {
  a: BLUE,
  b: ORANGE,
  shared: PURPLE,
  free: FREE,
};

interface Sel {
  row: number;
  col: number;
}

interface M2State {
  selected: Sel | null;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 20
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '16px "Segoe UI", sans-serif';
  let yy = y;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(x, yy - 11, 12, 12);
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, x + 18, yy);
    yy += 24;
  }
}

function render(ctx: CanvasRenderingContext2D, s: M2State) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // grid cells
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const x = GX + col * STEP;
      const y = GY + row * STEP;
      ctx.fillStyle = FILL[GRID[row][col].usage];
      rr(ctx, x, y, CELL, CELL, 5);
      ctx.fill();
    }
  }

  // selected cell: green outline + slight scale
  if (s.selected) {
    const { row, col } = s.selected;
    const x = GX + col * STEP;
    const y = GY + row * STEP;
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    rr(ctx, x - 2, y - 2, CELL + 4, CELL + 4, 7);
    ctx.stroke();
  }

  drawLegend(
    ctx,
    [
      { label: '任务A', color: BLUE },
      { label: '任务B', color: ORANGE },
      { label: '共享', color: PURPLE },
    ],
    350,
    56
  );

  // right inset: white panel + two usage bars
  const PX = 600;
  const PY = 20;
  const PW = 440;
  const PH = 260;
  ctx.fillStyle = PANEL;
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(PX, PY, PW, PH);

  const ua = s.selected ? GRID[s.selected.row][s.selected.col].ua : 0;
  const ub = s.selected ? GRID[s.selected.row][s.selected.col].ub : 0;

  drawSceneLabel(ctx, '任务A使用度', PX + 40, PY + 78, INK, 20);
  ctx.fillStyle = '#e9eef4';
  ctx.fillRect(PX + 40, PY + 92, 320, 20);
  ctx.fillStyle = BLUE;
  ctx.fillRect(PX + 40, PY + 92, 320 * ua, 20);
  drawSceneLabel(ctx, ua.toFixed(2), PX + 372, PY + 109, BLUE, 20);

  drawSceneLabel(ctx, '任务B使用度', PX + 40, PY + 162, INK, 20);
  ctx.fillStyle = '#e9eef4';
  ctx.fillRect(PX + 40, PY + 176, 320, 20);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(PX + 40, PY + 176, 320 * ub, 20);
  drawSceneLabel(ctx, ub.toFixed(2), PX + 372, PY + 193, ORANGE, 20);
}

const FEEDBACK: Record<Usage, { text: string; cls: string }> = {
  a: { text: '这个权重主要服务任务 A——训练任务 B 时它必须被保护。', cls: '' },
  b: { text: '这个权重主要服务任务 B——旧任务并不依赖它，可以自由更新。', cls: '' },
  shared: { text: '两个任务都依赖这个权重：它是珍贵的共享资源，需要小心保护。', cls: '' },
  free: { text: '这个权重几乎没人用：它是留给新任务的空闲容量。', cls: 'good' },
};

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M2State>({ selected: null });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<Sel | null>(null);
  const [feedback, setFeedback] = useState({
    text: '点击一个权重，查看它的占用情况。',
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
    const tick = () => {
      render(ctx, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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

  const selectCell = (row: number, col: number) => {
    stateRef.current.selected = { row, col };
    setSelected({ row, col });
    setFeedback(FEEDBACK[GRID[row][col].usage]);
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) * W) / rect.width;
    const py = ((e.clientY - rect.top) * H) / rect.height;
    const col = Math.floor((px - GX) / STEP);
    const row = Math.floor((py - GY) / STEP);
    const insideX = px - GX - col * STEP >= 0 && px - GX - col * STEP <= CELL;
    const insideY = py - GY - row * STEP >= 0 && py - GY - row * STEP <= CELL;
    if (row < 0 || row > 5 || col < 0 || col > 5 || !insideX || !insideY) return;
    selectCell(row, col);
  };

  const usage = selected ? GRID[selected.row][selected.col].usage : '';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
      />
      <div className="chip-row">
        <button
          type="button"
          className={'chip' + (usage === 'a' ? ' selected' : '')}
          onClick={() => selectCell(3, 1)}
        >
          选高占用
        </button>
        <button
          type="button"
          className={'chip' + (usage === 'free' ? ' selected' : '')}
          onClick={() => selectCell(4, 0)}
        >
          选空闲
        </button>
        <button
          type="button"
          className={'chip' + (usage === 'shared' ? ' selected' : '')}
          onClick={() => selectCell(2, 2)}
        >
          选共享
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
