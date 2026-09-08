import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function drawShelfRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.fillStyle = C.shelf; ctx.fillRect(x0, y - 6, x1 - x0, 8);
  ctx.fillStyle = C.shelfDark; ctx.fillRect(x0, y + 1, x1 - x0, 2);
  ctx.fillStyle = 'rgba(118,144,106,0.25)'; ctx.fillRect(x1 - 4, y - 8, 4, 10);
}
function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, color: string) {
  ctx.fillStyle = color; rr(ctx, x, y - bh, bw, bh, 2); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.35)'; ctx.fillRect(x + bw / 2 - 0.5, y - bh + 3, 1, bh - 6);
}
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.sin(t * 6) * 1.2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  rr(ctx, -16, -22, 32, 24, 9); ctx.fill(); ctx.stroke();
  rr(ctx, -12, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 3, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawBookmark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill();
}
function drawEndStop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.wood;
  ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 12, y); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.fill();
}
function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  ctx.fillStyle = '#ffffff'; rr(ctx, x, y, 96, 30, 5); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + 8, y + 13);
  ctx.fillStyle = C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.fillText(value, x + 8, y + 25);
}
function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.font = 'bold 20px "Segoe UI", sans-serif'; ctx.fillText('✓', x, y);
}
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 90, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 90 + 9, y + 8);
  });
}

const W = 560, H = 240;
const GRID_ROWS = 6, GRID_COLS = 8, TOTAL = GRID_ROWS * GRID_COLS;
const GRID_X = 16, GRID_Y = 24, CELL_W = 22, CELL_H = 19, CELL_GAP = 2;
const BLOCK_COUNT = 12, BLOCK_W = 15, BLOCK_H = 26, BLOCK_GAP = 1;
const TOKEN_X0 = 226, TOKEN_W = BLOCK_COUNT * (BLOCK_W + BLOCK_GAP) - BLOCK_GAP;
const BOOKS_PER_BLOCK = TOTAL / BLOCK_COUNT;

function pickK(px: number, py: number): number {
  const gridW = GRID_COLS * (CELL_W + CELL_GAP);
  const gridH = GRID_ROWS * (CELL_H + CELL_GAP);
  if (px >= GRID_X && px <= GRID_X + gridW && py >= GRID_Y && py <= GRID_Y + gridH) {
    const col = clamp(Math.floor((px - GRID_X) / (CELL_W + CELL_GAP)), 0, GRID_COLS - 1);
    const row = clamp(Math.floor((py - GRID_Y) / (CELL_H + CELL_GAP)), 0, GRID_ROWS - 1);
    return row * GRID_COLS + col;
  }
  const t = clamp((px - TOKEN_X0) / TOKEN_W, 0, 1);
  return clamp(Math.round(t * (TOTAL - 1)), 0, TOTAL - 1);
}

export const Ch5M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ k: 10 });
  const rafRef = useRef<number | null>(null);
  const [k, setK] = useState(10);
  const [feedback, setFeedback] = useState({
    text: '沿 token 行移动光标，特征图对应位置点亮，详情区显示该 token 的内容。',
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

    const render = (s: { k: number }) => {
      clearScene(ctx, W, H);
      const kk = s.k;
      const row = Math.floor(kk / GRID_COLS);
      const col = kk % GRID_COLS;

      // ---- left: 6×8 feature-map grid ----
      drawSceneLabel(ctx, GRID_X, 16, '特征图（6×8）', C.ink);
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const x = GRID_X + c * (CELL_W + CELL_GAP);
          const y = GRID_Y + r * (CELL_H + CELL_GAP);
          const isCur = r === row && c === col;
          ctx.fillStyle = isCur ? C.blue : '#e6ecdc';
          rr(ctx, x, y, CELL_W, CELL_H, 3);
          ctx.fill();
          ctx.strokeStyle = isCur ? C.blue : C.line;
          ctx.lineWidth = isCur ? 2 : 1;
          ctx.stroke();
        }
      }

      // ---- middle: flattened token row (12 wide blocks for 48 tokens) ----
      drawSceneLabel(ctx, 228, 16, '展平的 token 行（48 个）', C.ink);
      const shelfY = 96;
      drawShelfRow(ctx, shelfY, TOKEN_X0, TOKEN_X0 + TOKEN_W + BLOCK_GAP);
      const curBlock = Math.floor(kk / BOOKS_PER_BLOCK);
      for (let b = 0; b < BLOCK_COUNT; b++) {
        const x = TOKEN_X0 + b * (BLOCK_W + BLOCK_GAP);
        drawBook(ctx, x, shelfY, BLOCK_W, BLOCK_H, b === curBlock ? C.blue : '#b8c9a7');
      }
      // cursor arrow above the current token block
      const cx = TOKEN_X0 + curBlock * (BLOCK_W + BLOCK_GAP) + BLOCK_W / 2;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(cx, 52);
      ctx.lineTo(cx - 6, 62);
      ctx.lineTo(cx + 6, 62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 52);
      ctx.lineTo(cx, 66);
      ctx.stroke();

      // ---- right: detail card ----
      drawSceneLabel(ctx, 428, 16, '当前 token', C.ink);
      ctx.fillStyle = '#ffffff';
      rr(ctx, 428, 26, 120, 98, 6);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(`token #${kk}`, 438, 50);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`空间坐标 (${row}, ${col})`, 438, 72);
      const val = 20 + Math.round(80 * Math.abs(Math.cos(kk * 0.9)));
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('值', 438, 96);
      ctx.fillStyle = '#e6ecdc';
      rr(ctx, 460, 85, 78, 12, 3);
      ctx.fill();
      ctx.fillStyle = C.blue;
      rr(ctx, 460, 85, Math.max(2, (78 * val) / 100), 12, 3);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText(String(val), 438, 112);

      drawSceneLabel(ctx, 16, 214, '拖动光标 / 点击网格，或按 ◀ ▶ 微调', C.muted);
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

  const setState = (s: Partial<typeof stateRef.current>) => {
    stateRef.current = { ...stateRef.current, ...s };
    const v = stateRef.current;
    setK(v.k);
    const row = Math.floor(v.k / GRID_COLS);
    const col = v.k % GRID_COLS;
    setFeedback({
      text: `token #${v.k} 对应特征图 (${row}, ${col}) 位置。C2PSA 与 MambaPSA 都把 H×W 个位置展平成 H·W 个 token：C2PSA 的自注意力对它们两两打分，Mamba 沿 token 顺序扫描（蓝色 = 当前）。`,
      cls: '',
    });
  };

  const toIntrinsic = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return { px: (e.clientX - rect.left) * sx, py: (e.clientY - rect.top) * sy };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    const pos = toIntrinsic(e);
    if (pos) setState({ k: pickK(pos.px, pos.py) });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    const pos = toIntrinsic(e);
    if (pos) setState({ k: pickK(pos.px, pos.py) });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setState({ k: clamp(stateRef.current.k + 1, 0, TOTAL - 1) });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setState({ k: clamp(stateRef.current.k - 1, 0, TOTAL - 1) });
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKey}
        style={{ outline: 'none', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setState({ k: clamp(stateRef.current.k - 1, 0, TOTAL - 1) })}>
          ◀ 上一个
        </button>
        <span className="step-label">
          token #{k}　坐标 ({Math.floor(k / GRID_COLS)}, {k % GRID_COLS})
        </span>
        <button type="button" className="tiny ghost" onClick={() => setState({ k: clamp(stateRef.current.k + 1, 0, TOTAL - 1) })}>
          下一个 ▶
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
