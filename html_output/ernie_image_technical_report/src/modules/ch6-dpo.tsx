import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 440;
const H = 300;
const MIN_ERROR = 0.05;
const MAX_ERROR = 0.95;
const BETA = 0.05;
const LAMBDA_WIN = 0.35;
const LAMBDA_LOSE = 0.15;
const REF_WIN = 0.32;
const REF_LOSE = 0.5;
const REF_DIFF = REF_WIN - REF_LOSE;
const DURATION = 2200;

const C = {
  field: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  paper: '#ffffff',
};

type Point = { x: number; y: number };
type ErrorPoint = { win: number; lose: number };

const PLOT = { x: 62, y: 52, width: 326, height: 174 };

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function objectiveFor(winError: number, loseError: number) {
  const diff = winError - loseError;
  const dpo = -Math.log(sigmoid(-BETA * (diff - REF_DIFF)));
  const anchor = LAMBDA_WIN * winError + LAMBDA_LOSE * loseError;
  const dpoSlope = BETA * sigmoid(BETA * (diff - REF_DIFF));
  return { dpo, total: dpo + anchor, dpoSlope };
}

function objectiveValue(winError: number, loseError: number, anchored: boolean) {
  const objective = objectiveFor(winError, loseError);
  return anchored ? objective.total : objective.dpo;
}

function objectiveRange(anchored: boolean) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let row = 0; row <= 20; row += 1) {
    for (let col = 0; col <= 20; col += 1) {
      const win = MIN_ERROR + (MAX_ERROR - MIN_ERROR) * (col / 20);
      const lose = MIN_ERROR + (MAX_ERROR - MIN_ERROR) * (row / 20);
      const value = objectiveValue(win, lose, anchored);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return { min, max };
}

const DPO_RANGE = objectiveRange(false);
const ANCHOR_RANGE = objectiveRange(true);

function normalizeError(value: number) {
  return (value - MIN_ERROR) / (MAX_ERROR - MIN_ERROR);
}

function mapError(point: ErrorPoint): Point {
  return {
    x: PLOT.x + normalizeError(point.win) * PLOT.width,
    y: PLOT.y + (1 - normalizeError(point.lose)) * PLOT.height,
  };
}

function descentDirection(winError: number, loseError: number, anchored: boolean) {
  const { dpoSlope } = objectiveFor(winError, loseError);
  const win = -(dpoSlope + (anchored ? LAMBDA_WIN : 0));
  const lose = dpoSlope - (anchored ? LAMBDA_LOSE : 0);
  const length = Math.hypot(win, lose) || 1;
  return { win: win / length, lose: lose / length };
}

function traceDescent(anchored: boolean) {
  const path: ErrorPoint[] = [{ win: REF_WIN, lose: REF_LOSE }];
  let win = REF_WIN;
  let lose = REF_LOSE;
  for (let step = 0; step < 14; step += 1) {
    const direction = descentDirection(win, lose, anchored);
    const nextWin = clamp(win + direction.win * 0.04, MIN_ERROR, MAX_ERROR);
    const nextLose = clamp(lose + direction.lose * 0.04, MIN_ERROR, MAX_ERROR);
    if (Math.abs(nextWin - win) + Math.abs(nextLose - lose) < 0.0001) break;
    win = nextWin;
    lose = nextLose;
    path.push({ win, lose });
  }
  return path;
}

const DPO_PATH = traceDescent(false);
const ANCHOR_PATH = traceDescent(true);

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  size = 7,
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - Math.cos(angle - 0.55) * size, to.y - Math.sin(angle - 0.55) * size);
  ctx.lineTo(to.x - Math.cos(angle + 0.55) * size, to.y - Math.sin(angle + 0.55) * size);
  ctx.closePath();
  ctx.fill();
}

function solveContourY(win: number, target: number, anchored: boolean) {
  let low = MIN_ERROR;
  let high = MAX_ERROR;
  let lowValue = objectiveValue(win, low, anchored) - target;
  const highValue = objectiveValue(win, high, anchored) - target;
  if (lowValue === 0) return low;
  if (highValue === 0) return high;
  if (lowValue * highValue > 0) return null;

  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    const midValue = objectiveValue(win, mid, anchored) - target;
    if (lowValue * midValue <= 0) high = mid;
    else {
      low = mid;
      lowValue = midValue;
    }
  }
  return (low + high) / 2;
}

function drawContours(ctx: CanvasRenderingContext2D, anchored: boolean) {
  const range = anchored ? ANCHOR_RANGE : DPO_RANGE;
  ctx.save();
  ctx.beginPath();
  ctx.rect(PLOT.x, PLOT.y, PLOT.width, PLOT.height);
  ctx.clip();

  for (let contour = 1; contour <= 5; contour += 1) {
    const target = range.min + (range.max - range.min) * (contour / 6);
    ctx.strokeStyle = anchored ? 'rgba(34, 141, 92, 0.20)' : 'rgba(39, 68, 110, 0.20)';
    ctx.lineWidth = contour === 3 ? 1.6 : 1;
    ctx.beginPath();
    let drawing = false;
    for (let col = 0; col <= 80; col += 1) {
      const win = MIN_ERROR + (MAX_ERROR - MIN_ERROR) * (col / 80);
      const lose = solveContourY(win, target, anchored);
      if (lose === null) {
        drawing = false;
        continue;
      }
      const point = mapError({ win, lose });
      if (!drawing) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
      drawing = true;
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlot(ctx: CanvasRenderingContext2D, anchored: boolean) {
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  roundedRect(ctx, PLOT.x, PLOT.y, PLOT.width, PLOT.height, 12);
  ctx.fill();
  ctx.stroke();

  const zone = anchored
    ? { x: PLOT.x, y: PLOT.y + PLOT.height * 0.69, width: PLOT.width * 0.31, height: PLOT.height * 0.31 }
    : { x: PLOT.x, y: PLOT.y, width: PLOT.width * 0.31, height: PLOT.height * 0.31 };
  ctx.fillStyle = anchored ? 'rgba(34, 141, 92, 0.08)' : 'rgba(196, 63, 82, 0.08)';
  roundedRect(ctx, zone.x, zone.y, zone.width, zone.height, 10);
  ctx.fill();

  ctx.strokeStyle = 'rgba(215, 222, 234, 0.72)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const x = PLOT.x + PLOT.width * (i / 4);
    const y = PLOT.y + PLOT.height * (i / 4);
    ctx.beginPath();
    ctx.moveTo(x, PLOT.y);
    ctx.lineTo(x, PLOT.y + PLOT.height);
    ctx.moveTo(PLOT.x, y);
    ctx.lineTo(PLOT.x + PLOT.width, y);
    ctx.stroke();
  }

  drawContours(ctx, anchored);

  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(PLOT.x, PLOT.y + PLOT.height);
  ctx.lineTo(PLOT.x + PLOT.width, PLOT.y + PLOT.height);
  ctx.moveTo(PLOT.x, PLOT.y + PLOT.height);
  ctx.lineTo(PLOT.x, PLOT.y);
  ctx.stroke();
  drawArrowHead(
    ctx,
    { x: PLOT.x + PLOT.width - 12, y: PLOT.y + PLOT.height },
    { x: PLOT.x + PLOT.width, y: PLOT.y + PLOT.height },
    C.blue,
    6,
  );
  drawArrowHead(
    ctx,
    { x: PLOT.x, y: PLOT.y + 12 },
    { x: PLOT.x, y: PLOT.y },
    C.blue,
    6,
  );

  ctx.fillStyle = C.ink;
  ctx.font = '600 11px "Segoe UI", sans-serif';
  ctx.fillText('胜样本误差 ℓ_win →', PLOT.x + PLOT.width - 112, PLOT.y + PLOT.height + 18);
  ctx.save();
  ctx.translate(PLOT.x - 13, PLOT.y + 116);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('负样本误差 ℓ_lose →', 0, 0);
  ctx.restore();

  ctx.fillStyle = anchored ? C.green : C.red;
  ctx.font = '700 11px "Segoe UI", sans-serif';
  ctx.fillText(anchored ? '受约束区' : '奖励投机区', zone.x + 12, anchored ? zone.y + zone.height - 12 : zone.y + 19);
}

function pointAlong(path: ErrorPoint[], progress: number) {
  const travel = clamp(progress, 0, 1) * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(travel));
  const local = travel - index;
  const from = path[index];
  const to = path[index + 1];
  return {
    win: from.win + (to.win - from.win) * local,
    lose: from.lose + (to.lose - from.lose) * local,
    index,
  };
}

function drawObjectiveGauge(
  ctx: CanvasRenderingContext2D,
  anchored: boolean,
  current: ErrorPoint,
  path: ErrorPoint[],
) {
  const start = objectiveValue(path[0].win, path[0].lose, anchored);
  const endPoint = path[path.length - 1];
  const end = objectiveValue(endPoint.win, endPoint.lose, anchored);
  const value = objectiveValue(current.win, current.lose, anchored);
  const remaining = clamp((value - end) / (start - end), 0, 1);
  const color = anchored ? C.green : C.red;

  ctx.fillStyle = C.ink;
  ctx.font = '700 11px "Segoe UI", sans-serif';
  ctx.fillText(anchored ? 'L_total' : 'L_DPO', 62, 27);
  ctx.fillStyle = '#e8edf4';
  roundedRect(ctx, 120, 18, 190, 12, 6);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(ctx, 120, 18, 38 + 152 * remaining, 12, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = '700 12px "Segoe UI", sans-serif';
  ctx.fillText(value.toFixed(3), 326, 29);
  ctx.fillStyle = C.muted;
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText('优化目标下降', 326, 42);
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  path: ErrorPoint[],
  anchored: boolean,
  progress: number,
) {
  const color = anchored ? C.green : C.red;
  const projected = path.map(mapError);
  const current = pointAlong(path, progress);
  const currentPoint = mapError(current);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = anchored ? 'rgba(34, 141, 92, 0.20)' : 'rgba(196, 63, 82, 0.20)';
  ctx.lineWidth = 5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  projected.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i <= current.index; i += 1) ctx.lineTo(projected[i].x, projected[i].y);
  ctx.lineTo(currentPoint.x, currentPoint.y);
  ctx.stroke();

  if (progress > 0.12) {
    const previous = current.index > 0 ? projected[current.index] : projected[0];
    drawArrowHead(ctx, previous, currentPoint, color, 9);
  }

  const end = projected[projected.length - 1];
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.28 + progress * 0.72;
  ctx.beginPath();
  ctx.arc(end.x, end.y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
  ctx.beginPath();
  ctx.arc(currentPoint.x, currentPoint.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.strokeStyle = C.paper;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(currentPoint.x, currentPoint.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return { win: current.win, lose: current.lose };
}

function drawResultRibbon(ctx: CanvasRenderingContext2D, anchored: boolean) {
  const color = anchored ? C.green : C.red;
  ctx.fillStyle = anchored ? 'rgba(34, 141, 92, 0.07)' : 'rgba(196, 63, 82, 0.07)';
  ctx.strokeStyle = anchored ? 'rgba(34, 141, 92, 0.30)' : 'rgba(196, 63, 82, 0.30)';
  ctx.lineWidth = 1;
  roundedRect(ctx, 62, 256, 326, 30, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 12px "Segoe UI", sans-serif';
  ctx.fillText('ℓ_win ↓', 88, 275);
  ctx.fillText(anchored ? 'ℓ_lose ↓　两侧都受约束' : 'ℓ_lose ↑　只把负样本做坏', 180, 275);
}

function drawScene(ctx: CanvasRenderingContext2D, anchored: boolean, progress: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  drawPlot(ctx, anchored);
  const path = anchored ? ANCHOR_PATH : DPO_PATH;
  const current = drawTrajectory(ctx, path, anchored, progress);
  drawObjectiveGauge(ctx, anchored, current, path);
  drawResultRibbon(ctx, anchored);
}

export const Ch6DpoWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const dpoCanvasRef = useRef<HTMLCanvasElement>(null);
  const anchorCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef({ progress: 0, startedAt: 0, running: false });
  const paintRef = useRef<(() => void) | null>(null);
  const requestFrameRef = useRef<(() => void) | null>(null);
  const reducedMotionRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const dpoCanvas = dpoCanvasRef.current;
    const anchorCanvas = anchorCanvasRef.current;
    if (!dpoCanvas || !anchorCanvas) return;

    let dpoCtx: CanvasRenderingContext2D;
    let anchorCtx: CanvasRenderingContext2D;
    try {
      dpoCtx = setupCanvas(dpoCanvas, W, H);
      anchorCtx = setupCanvas(anchorCanvas, W, H);
    } catch {
      return;
    }
    for (const canvas of [dpoCanvas, anchorCanvas]) {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    }

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = false;
    let raf: number | null = null;

    const paint = () => {
      drawScene(dpoCtx, false, animationRef.current.progress);
      drawScene(anchorCtx, true, animationRef.current.progress);
      dpoCanvas.classList.add('is-ready');
      anchorCanvas.classList.add('is-ready');
    };
    const tick = (time: number) => {
      const animation = animationRef.current;
      if (animation.running) {
        const raw = clamp((time - animation.startedAt) / DURATION, 0, 1);
        animation.progress = easeInOutQuad(raw);
        if (raw >= 1) {
          animation.running = false;
          setRunning(false);
          setFinished(true);
        }
      }
      paint();
      raf = visible && animationRef.current.running ? requestAnimationFrame(tick) : null;
    };
    const requestFrame = () => {
      if (visible && raf === null) raf = requestAnimationFrame(tick);
      else paint();
    };
    const start = () => {
      visible = true;
      requestFrame();
    };
    const stop = () => {
      visible = false;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    paintRef.current = paint;
    requestFrameRef.current = requestFrame;
    paint();
    const disconnect = observeCanvas(dpoCanvas, start, stop);
    return () => {
      paintRef.current = null;
      requestFrameRef.current = null;
      stop();
      disconnect();
    };
  }, []);

  const playComparison = () => {
    setFinished(false);
    if (reducedMotionRef.current) {
      animationRef.current = { progress: 1, startedAt: 0, running: false };
      setRunning(false);
      setFinished(true);
      paintRef.current?.();
      return;
    }
    animationRef.current = { progress: 0, startedAt: performance.now(), running: true };
    setRunning(true);
    requestFrameRef.current?.();
  };

  const feedback = running
    ? '同一参考点正在沿两种目标下降：注意左侧目标值下降时，负样本误差却在上升。'
    : finished
    ? '仅 DPO 的确降低了 L_DPO，但它走进“提高负样本误差”的投机区；加入 Anchor Losses 后，L_total 的下降方向转向左下，两侧误差都受到约束。'
    : '点击播放，同时比较 DPO 与 DPO + Anchor Losses 的二维优化方向。';

  return (
    <div className="dpo-widget">
      <div className="dpo-compare-grid">
        <section className="dpo-compare-card dpo-compare-card--naive">
          <header className="dpo-compare-head">
            <span>仅 DPO</span>
            <strong>只优化胜负误差差距</strong>
          </header>
          <canvas
            id={`cv-${chapterId}-${moduleId}-dpo`}
            ref={dpoCanvasRef}
            width={W}
            height={H}
            className="dpo-compare-canvas"
            aria-label="仅 DPO 的二维等损失图。橙色点沿红色路径进入奖励投机区，优化目标下降，但负样本误差升高。"
          />
        </section>

        <section className="dpo-compare-card dpo-compare-card--anchor">
          <header className="dpo-compare-head">
            <span>DPO + Anchor Losses</span>
            <strong>胜负误差同时承担代价</strong>
          </header>
          <canvas
            id={`cv-${chapterId}-${moduleId}-anchor`}
            ref={anchorCanvasRef}
            width={W}
            height={H}
            className="dpo-compare-canvas"
            aria-label="加入锚定损失后的二维等损失图。橙色点沿绿色路径进入受约束区，总目标下降，胜负样本误差同时降低。"
          />
        </section>
      </div>

      <div className="dpo-action-row">
        <span>β = 0.05　λ_win = 0.35　λ_lose = 0.15</span>
        <button type="button" className="tiny" onClick={playComparison} disabled={running}>
          {running ? '优化中…' : finished ? '再次播放' : '播放二维对比'}
        </button>
      </div>

      <div
        id={`fb-${chapterId}-${moduleId}`}
        className={`feedback ${finished ? 'good' : ''}`}
        aria-live="polite"
      >
        {feedback}
      </div>
    </div>
  );
};

export default Ch6DpoWidget;
