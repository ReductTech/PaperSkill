import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 模块 9.1「局部修复还是整件重来」（1080×280，拖动检查点 + 两个方式 chip）
// 左侧 scene：12 行织片，已完成行蓝色、被退回行灰虚线、重织区段绿色，橙色记号扣可拖动。
// 右侧 evidence：两条对比条（重织行数 / 需要重新检查的产物数）。
// 绘制顺序：clearScene → 桌面带 → 织片 12 行 → 记号扣 → 重织区段 → 两条对比条 → drawLabel → drawLegend。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SUB = '#68778f';

const ROWS = 12;
const CELL_H = 17;
const FABRIC_X = 92;
const FABRIC_W = 468;
const FABRIC_TOP = 32;
const STITCHES = 13;
const STITCH_STEP = 36;
const GROUND_Y = 252;

const MIN_ROW = 2;
const MAX_ROW = 12;

const BAR_X = 700;
const BAR_MAX_W = 330;
const BAR_A_Y = 108;
const BAR_B_Y = 196;
const BAR_H = 30;
const REDONE_MAX = 12;
const ARTIFACT_MAX = 5;
const ARTIFACT_LOCAL = 2;
const ARTIFACT_GLOBAL = 5;

type RepairMode = 'local' | 'global';

interface CheckState {
  row: number;
  mode: RepairMode;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function stitchX(i: number): number {
  return FABRIC_X + 18 + i * STITCH_STEP;
}

function rowY(r: number): number {
  return FABRIC_TOP + r * CELL_H + CELL_H / 2;
}

/** 一整行线圈：blue = 已完成，ghost = 被退回（灰色虚线），green = 重织区段。 */
function drawRow(
  ctx: CanvasRenderingContext2D,
  r: number,
  style: 'blue' | 'ghost' | 'green'
): void {
  const cy = rowY(r);
  if (style === 'ghost') {
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < STITCHES; i++) {
      drawKnit(ctx, stitchX(i), cy + 3, 25, SUB, 2.6, true);
    }
    ctx.restore();
    return;
  }
  const color = style === 'blue' ? BLUE : GREEN;
  for (let i = 0; i < STITCHES; i++) {
    drawKnit(ctx, stitchX(i), cy, 25, color, 3, false);
  }
}

/** 记号扣：橙色小环 + 拖拽把柄，并标出退回的那一条线。 */
function drawMarker(ctx: CanvasRenderingContext2D, row: number): void {
  const y = FABRIC_TOP + row * CELL_H;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(FABRIC_X - 30, y);
  ctx.lineTo(FABRIC_X + FABRIC_W, y);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(FABRIC_X - 46, y, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ORANGE;
  roundRectPath(ctx, FABRIC_X - 82, y - 4, 16, 8, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(FABRIC_X - 66, y);
  ctx.lineTo(FABRIC_X - 55, y);
  ctx.stroke();
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('第 ' + row + ' 行', FABRIC_X - 84, y - 16);
  ctx.restore();
}

/** 右侧 evidence：两条对比条。 */
function drawBars(
  ctx: CanvasRenderingContext2D,
  redoneRows: number,
  artifacts: number,
  mode: RepairMode
): void {
  const items: Array<{
    y: number;
    title: string;
    value: number;
    max: number;
    unit: string;
    color: string;
    ticks: number;
  }> = [
    {
      y: BAR_A_Y,
      title: '重织行数',
      value: redoneRows,
      max: REDONE_MAX,
      unit: ' 行',
      color: mode === 'global' ? RED : GREEN,
      ticks: REDONE_MAX,
    },
    {
      y: BAR_B_Y,
      title: '需要重新检查的产物数',
      value: artifacts,
      max: ARTIFACT_MAX,
      unit: ' 项',
      color: mode === 'global' ? RED : BLUE,
      ticks: ARTIFACT_MAX,
    },
  ];

  items.forEach((it) => {
    ctx.save();
    ctx.fillStyle = SUB;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(it.title, BAR_X, it.y - 14);

    // 轨道
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = LINE;
    roundRectPath(ctx, BAR_X, it.y, BAR_MAX_W, BAR_H, 5);
    ctx.fill();
    ctx.restore();

    // 刻度
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    for (let i = 0; i <= it.ticks; i++) {
      const x = BAR_X + (BAR_MAX_W * i) / it.ticks;
      ctx.beginPath();
      ctx.moveTo(x, it.y + BAR_H + 3);
      ctx.lineTo(x, it.y + BAR_H + 9);
      ctx.stroke();
    }
    ctx.restore();

    // 条形
    const w = Math.max(4, (BAR_MAX_W * clamp(it.value, 0, it.max)) / it.max);
    ctx.save();
    ctx.fillStyle = it.color;
    roundRectPath(ctx, BAR_X, it.y, w, BAR_H, 5);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(it.value) + it.unit, BAR_X + BAR_MAX_W + 10, it.y + BAR_H / 2 + 6);
    ctx.restore();
  });
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, y: number): void {
  const items: Array<{ color: string; text: string; dashed: boolean }> = [
    { color: BLUE, text: '已完成行', dashed: false },
    { color: SUB, text: '被退回行', dashed: true },
    { color: GREEN, text: '重织区段', dashed: false },
  ];
  let x = FABRIC_X;
  ctx.save();
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.save();
    ctx.globalAlpha = it.dashed ? 0.6 : 1;
    ctx.strokeStyle = it.color;
    ctx.fillStyle = it.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(it.dashed ? [4, 4] : []);
    ctx.strokeRect(x, y - 11, 22, 13);
    if (!it.dashed) ctx.fillRect(x, y - 11, 22, 13);
    ctx.restore();
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, x + 29, y);
    x += 29 + it.text.length * 15 + 28;
  });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, s: CheckState): void {
  clearScene(ctx);

  const redoneRows = s.mode === 'local' ? ROWS - s.row : ROWS;
  const artifacts = s.mode === 'global' ? ARTIFACT_GLOBAL : ARTIFACT_LOCAL;

  // 织片本体：12 行
  for (let r = 0; r < ROWS; r++) {
    const rowNo = r + 1;
    if (s.mode === 'global') {
      drawRow(ctx, r, 'ghost');
    } else if (rowNo <= s.row) {
      drawRow(ctx, r, 'blue');
    } else {
      drawRow(ctx, r, 'ghost');
    }
  }

  // 记号扣（被夹在有效行范围内）
  drawMarker(ctx, clamp(s.row, MIN_ROW, MAX_ROW));

  // 重织区段：从检查点的下一行开始
  const startRow = s.mode === 'global' ? 1 : s.row + 1;
  for (let k = 0; k < redoneRows; k++) {
    const rowNo = startRow + k;
    if (rowNo > ROWS) break;
    drawRow(ctx, rowNo - 1, 'green');
  }

  drawBars(ctx, redoneRows, artifacts, s.mode);

  drawLabel(ctx, '织片', FABRIC_X, 24, INK);
  drawLabel(ctx, '代价对比', 660, 24, INK);
  drawLegend(ctx, 270);
}

function feedbackFor(row: number, mode: RepairMode): { text: string; cls: string } {
  if (mode === 'global') {
    return {
      text: '整件重做：12 行全部重织，之前那些已经确认过的产物也要重新检查。',
      cls: 'bad',
    };
  }
  if (row <= MIN_ROW) {
    return {
      text: '检查点太靠前，需要重织的行数已经接近整件——这时局部修复的优势就很小了。',
      cls: 'orange',
    };
  }
  return {
    text: '只重织受影响的 ' + (ROWS - row) + ' 行：其余已完成的工作被保留下来。',
    cls: 'good',
  };
}

export const Ch9Check: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<CheckState>({ row: 8, mode: 'local' });
  const draggingRef = useRef(false);
  const [row, setRow] = useState(8);
  const [mode, setMode] = useState<RepairMode>('local');
  const [feedback, setFeedback] = useState(feedbackFor(8, 'local'));

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

  const apply = (next: number, nextMode: RepairMode) => {
    const v = Math.round(clamp(next, MIN_ROW, MAX_ROW));
    stateRef.current = { row: v, mode: nextMode };
    setRow(v);
    setMode(nextMode);
    setFeedback(feedbackFor(v, nextMode));
  };

  const rowFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.row;
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) * H) / (rect.height || H);
    return Math.round((y - FABRIC_TOP) / CELL_H);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(rowFromEvent(e), stateRef.current.mode);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    apply(rowFromEvent(e), stateRef.current.mode);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const redoneRows = mode === 'local' ? ROWS - row : ROWS;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          行号滑块 <span className="val">第 {row} 行</span>
        </label>
        <input
          type="range"
          min={MIN_ROW}
          max={MAX_ROW}
          step={1}
          value={row}
          onChange={(e) => apply(Number(e.target.value), stateRef.current.mode)}
        />
        <label>
          需重织{' '}
          <span className="val">
            {redoneRows} 行 / 共 {ROWS} 行
          </span>
        </label>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={mode === 'local' ? 'chip selected' : 'chip'}
          onClick={() => apply(stateRef.current.row, 'local')}
        >
          局部修复
        </button>
        <button
          type="button"
          className={mode === 'global' ? 'chip selected' : 'chip'}
          onClick={() => apply(stateRef.current.row, 'global')}
        >
          整件重做
        </button>
      </div>
      <div
        className={feedback.cls === 'orange' ? 'feedback' : `feedback ${feedback.cls}`}
        style={feedback.cls === 'orange' ? { color: ORANGE, borderLeftColor: ORANGE } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch9Check;
