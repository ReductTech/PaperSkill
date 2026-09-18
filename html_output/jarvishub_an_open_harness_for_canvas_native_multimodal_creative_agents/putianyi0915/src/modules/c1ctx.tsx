import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 模块 1.1「上下文丢失模拟器」（1080×280，实时滑块 + 一个二值修复按钮）
// 左侧生活场景：织片随对话轮数被抽短；右侧技术视图：仍可见产物数量的条形与图例。
// 由后到前的绘制顺序：clearScene → 桌面带 → 灰色虚线旧线圈 → 蓝色实心线圈 → 棒针
// → 目标线球 → drawChart 条形 → drawLabel（2 个）→ drawLegend（3 项）。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const WOOD = '#92400e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const COLS = 6;
const ROWS = 2;
const CELL_W = 62;
const CELL_H = 54;
const ORIGIN_X = 72;
const ORIGIN_Y = 56;
const LOOP = 34;
const BALL_X = 540;
const BALL_Y = 150;
const BALL_R = 28;

const AXIS_Y = 232;
const MAX_BAR = 148;
const BAR_W = 78;
const BAR_A_X = 690;
const BAR_B_X = 862;

interface CtxState {
  turns: number;
  useCanvas: boolean;
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
  ctx.fillRect(0, 186, W, H - 186);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 186);
  ctx.lineTo(W, 186);
  ctx.stroke();
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  dashed: boolean,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function cellOfOrder(order: number): { col: number; row: number } {
  return { col: order % COLS, row: ROWS - 1 - Math.floor(order / COLS) };
}

function cellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: ORIGIN_X + col * CELL_W + CELL_W / 2,
    y: ORIGIN_Y + row * CELL_H + CELL_H / 2,
  };
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.52, cy - r * 1.05, r * 1.12, 0.34 * Math.PI, 0.66 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
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
    { color: BLUE, text: '被保留', dashed: false },
    { color: RED, text: '已丢失', dashed: true },
    { color: GREEN, text: '画布保存', dashed: false },
  ];
  let x = 664;
  ctx.save();
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.save();
    ctx.strokeStyle = it.color;
    ctx.fillStyle = it.color;
    ctx.lineWidth = 3;
    ctx.setLineDash(it.dashed ? [4, 4] : []);
    ctx.strokeRect(x, y - 12, 22, 14);
    if (!it.dashed) {
      ctx.fillRect(x, y - 12, 22, 14);
    }
    ctx.restore();
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, x + 30, y);
    x += 30 + it.text.length * 18 + 26;
  });
  ctx.restore();
}

function drawChart(ctx: CanvasRenderingContext2D, s: CtxState, visible: number, lost: number): void {
  const total = Math.max(1, s.turns);
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(660, AXIS_Y);
  ctx.lineTo(1040, AXIS_Y);
  ctx.stroke();

  // turns 同时决定条形的刻度密度
  ctx.strokeStyle = '#e3e9f2';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s.turns; i++) {
    const x = 660 + (380 * i) / s.turns;
    ctx.beginPath();
    ctx.moveTo(x, AXIS_Y);
    ctx.lineTo(x, AXIS_Y + 8);
    ctx.stroke();
  }
  ctx.restore();

  const keptH = (MAX_BAR * visible) / total;
  const lostH = (MAX_BAR * lost) / total;

  // 仍可见产物的条形
  ctx.save();
  ctx.fillStyle = s.useCanvas ? GREEN : BLUE;
  roundRectPath(ctx, BAR_A_X, AXIS_Y - keptH, BAR_W, keptH, 4);
  ctx.fill();
  ctx.restore();

  // 已丢失产物的条形（红色虚线段）
  if (lostH > 0.5) {
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    roundRectPath(ctx, BAR_B_X, AXIS_Y - lostH, BAR_W, lostH, 4);
    ctx.stroke();
    ctx.restore();
  }
}

function render(ctx: CanvasRenderingContext2D, s: CtxState, time: number): void {
  clearScene(ctx);

  const visible = s.useCanvas ? s.turns : 1;
  const lost = Math.max(0, s.turns - visible);

  // 灰色虚线旧线圈（已丢失）
  for (let i = 0; i < s.turns - visible; i++) {
    const cell = cellOfOrder(i);
    const c = cellCenter(cell.col, cell.row);
    drawKnit(ctx, c.x, c.y + 4, LOOP, LINE, true, 3);
  }

  // 蓝色实心线圈（被保留）
  const pulse = 0.5 + 0.5 * Math.sin(time / 420);
  for (let i = Math.max(0, s.turns - visible); i < s.turns; i++) {
    const cell = cellOfOrder(i);
    const c = cellCenter(cell.col, cell.row);
    ctx.save();
    if (i === s.turns - 1 && s.useCanvas) {
      ctx.shadowColor = 'rgba(34,141,92,0.55)';
      ctx.shadowBlur = 6 + pulse * 10;
    }
    drawKnit(ctx, c.x, c.y, LOOP, BLUE, false, 4);
    ctx.restore();
  }

  // 棒针
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(74, 38);
  ctx.lineTo(472, 44);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.arc(74, 38, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(472, 44);
  ctx.lineTo(462, 39);
  ctx.lineTo(462, 49);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 目标线球
  drawBall(ctx, BALL_X, BALL_Y, BALL_R);

  drawChart(ctx, s, visible, lost);

  drawLabel(ctx, '织片', 66, 30, INK);
  drawLabel(ctx, '仍可见产物', 660, 62, INK);
  drawLegend(ctx, 264);
}

function feedbackFor(turns: number, useCanvas: boolean): { text: string; cls: string } {
  if (useCanvas) {
    return {
      text: '画布保留了全部中间产物：参考、候选、修改与反馈都能被后续步骤复用。',
      cls: 'good',
    };
  }
  if (turns >= 8) {
    return {
      text: '中间产物几乎全部丢失：后续步骤看不到第 2 轮之后的草稿、候选与反馈。',
      cls: 'bad',
    };
  }
  if (turns <= 3) {
    return { text: '轮数还少，损失不明显；把轮数调大就会看出问题。', cls: '' };
  }
  return { text: '拖动滑块：轮数越多，被丢掉的中间产物就越多。', cls: '' };
}

export const Ch1Context: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CtxState>({ turns: 6, useCanvas: false });
  const rafRef = useRef<number | null>(null);
  const [turns, setTurns] = useState(6);
  const [useCanvas, setUseCanvas] = useState(false);
  const [feedback, setFeedback] = useState(feedbackFor(6, false));

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
      render(ctx, stateRef.current, performance.now());
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

  const onTurns = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.round(clamp(Number(e.target.value), 1, 12));
    stateRef.current.turns = v;
    setTurns(v);
    setFeedback(feedbackFor(v, stateRef.current.useCanvas));
  };

  const onUseCanvas = () => {
    stateRef.current.useCanvas = true;
    setUseCanvas(true);
    setFeedback(feedbackFor(stateRef.current.turns, true));
  };

  const onReset = () => {
    stateRef.current.useCanvas = false;
    setUseCanvas(false);
    setFeedback(feedbackFor(stateRef.current.turns, false));
  };

  const visible = useCanvas ? turns : 1;
  const lost = Math.max(0, turns - visible);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          对话轮数 <span className="val">{turns}</span>
        </label>
        <input type="range" min={1} max={12} step={1} value={turns} onChange={onTurns} />
        <button className="tiny" onClick={onUseCanvas} disabled={useCanvas}>
          {useCanvas ? '已改用画布保存' : '改用画布保存项目状态'}
        </button>
        {useCanvas ? (
          <button className="tiny ghost" onClick={onReset}>
            重置
          </button>
        ) : null}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">对话轮数</div>
          <div className="v">{turns}</div>
        </div>
        <div className="metric">
          <div className="l">仍可见产物</div>
          <div className="v">{visible} 项</div>
        </div>
        <div className="metric">
          <div className="l">已丢失产物</div>
          <div className="v">{lost} 项</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Context;
