import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const PX0 = 96;
const PX1 = 762;
const PY0 = 30;
const PY1 = 232;
const LOSS_MIN = 0.02;
const LOSS_MAX = 0.98;
const SC_MIN = 0.32;
const SC_MAX = 0.7;
const INITIAL_THRESHOLD = 0.05;

const INITIAL_FB = '如果损失代表下游表现，低损失一侧应该同时是高得分。拖动选型线试试。';
const LOSS_FB = '损失最低的运行，得分并不突出——桶内相关性均值仅 −0.08，区间 [−0.25, +0.07]。';
const SCORE_FB = '改按下游得分挑选，最好的运行显形。靠损失达到同样水平，约需 2–5 倍算力（点估计 3.5×）。';

interface Run {
  loss: number;
  score: number;
  r: number;
}

interface RunSet {
  runs: Run[];
  best: Run;
  lossPick: Run;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rnd: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildRuns(): RunSet {
  const rnd = mulberry32(260703949);
  const runs: Run[] = [];
  for (let i = 0; i < 395; i++) {
    const loss = 0.06 + 0.9 * rnd();
    const score = clamp(0.545 - 0.07 * (loss - 0.5) + gauss(rnd) * 0.085, 0.34, 0.69);
    runs.push({ loss, score, r: 2 + rnd() * 1.6 });
  }
  let best = runs[0];
  for (const run of runs) {
    if (run.score > best.score) best = run;
  }
  const byLoss = [...runs].sort((a, b) => a.loss - b.loss);
  const lossPick = byLoss[0] === best ? byLoss[1] : byLoss[0];
  lossPick.score = best.score - 0.0486;
  return { runs, best, lossPick };
}

const DATA = buildRuns();

function pickByThreshold(threshold: number): Run {
  let selected = DATA.runs[0];
  let bestDist = Infinity;
  for (const run of DATA.runs) {
    const d = Math.abs(run.loss - threshold);
    if (d < bestDist) {
      bestDist = d;
      selected = run;
    }
  }
  return selected;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 22, W, 22);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 22);
  ctx.lineTo(W, H - 22);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, t: number) {
  const stars: Array<[number, number]> = [
    [60, 16],
    [200, 12],
    [420, 18],
    [560, 10],
    [640, 20],
    [716, 14],
    [778, 62],
    [782, 124],
    [774, 186],
  ];
  for (let i = 0; i < stars.length; i++) {
    const [x, y] = stars[i];
    const alpha = 0.32 + 0.22 * Math.sin(t * 0.9 + i * 1.7);
    ctx.fillStyle = `rgba(104, 119, 143, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 13, y);
  ctx.lineTo(x - 4, y);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 13, y);
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x, y - 4);
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x, y + 13);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

interface LegendItem {
  color: string;
  label: string;
}

function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number) {
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 11, 14, 11);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 18;
  }
}

type Mode = 'loss' | 'score';

interface WidgetState {
  mode: Mode;
  threshold: number;
  revealed: boolean;
  dragging: boolean;
  started: boolean;
}

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WidgetState>({
    mode: 'loss',
    threshold: INITIAL_THRESHOLD,
    revealed: false,
    dragging: false,
    started: false,
  });
  const [mode, setMode] = useState<Mode>('loss');
  const [threshold, setThreshold] = useState(INITIAL_THRESHOLD);
  const [feedback, setFeedback] = useState({ text: INITIAL_FB, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx);
      drawSky(ctx, t);

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PX0, PY1);
      ctx.lineTo(PX1, PY1);
      ctx.moveTo(PX0, PY0);
      ctx.lineTo(PX0, PY1);
      ctx.stroke();

      for (const run of DATA.runs) {
        const x = map(run.loss, LOSS_MIN, LOSS_MAX, PX0, PX1);
        const y = map(run.score, SC_MIN, SC_MAX, PY1, PY0);
        ctx.fillStyle = 'rgba(104, 119, 143, 0.42)';
        ctx.beginPath();
        ctx.arc(x, y, run.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const selected = s.mode === 'loss' ? pickByThreshold(s.threshold) : DATA.best;
      const lossX = map(DATA.lossPick.loss, LOSS_MIN, LOSS_MAX, PX0, PX1);
      const lossY = map(DATA.lossPick.score, SC_MIN, SC_MAX, PY1, PY0);
      if (s.mode === 'loss') {
        const lx = map(s.threshold, LOSS_MIN, LOSS_MAX, PX0, PX1);
        ctx.strokeStyle = '#f07e47';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, PY0);
        ctx.lineTo(lx, PY1);
        ctx.stroke();
      } else {
        const ly = map(DATA.best.score, SC_MIN, SC_MAX, PY1, PY0);
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(PX0, ly);
        ctx.lineTo(PX1, ly);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        drawTarget(ctx, lossX, lossY, '#c43f52');
        ctx.globalAlpha = 1;
        drawSceneLabel(ctx, DATA.lossPick.score.toFixed(3), lossX + 14, lossY - 12, '#c43f52');
      }

      const selX = map(selected.loss, LOSS_MIN, LOSS_MAX, PX0, PX1);
      const selY = map(selected.score, SC_MIN, SC_MAX, PY1, PY0);
      if (s.started || s.mode === 'score') {
        drawTarget(ctx, selX, selY, s.mode === 'loss' ? '#c43f52' : '#228d5c');
        drawSceneLabel(ctx, selected.score.toFixed(3), selX + 14, selY - 12, '#21324a');
      }

      drawSceneLabel(ctx, '损失', PX1 - 66, PY1 + 24, '#68778f');
      drawSceneLabel(ctx, '得分', 16, PY0 + 16, '#68778f');

      drawPlate(ctx, 800, 92, 248, 152);
      const barX = 820;
      const barW = 160;
      const lossLen = map(DATA.lossPick.score, SC_MIN, SC_MAX, 12, barW);
      const bestLen = map(DATA.best.score, SC_MIN, SC_MAX, 12, barW);
      ctx.fillStyle = '#c43f52';
      roundRect(ctx, barX, 126, lossLen, 16, 4);
      ctx.fill();
      ctx.fillStyle = s.revealed ? '#228d5c' : 'rgba(34, 141, 92, 0.2)';
      roundRect(ctx, barX, 166, bestLen, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText(DATA.lossPick.score.toFixed(3), barX + lossLen + 12, 140);
      if (s.revealed) {
        ctx.fillStyle = '#228d5c';
        ctx.fillText(DATA.best.score.toFixed(3), barX + bestLen + 12, 180);
      }
      drawLegend(
        ctx,
        [
          { color: '#c43f52', label: '按损失' },
          { color: '#228d5c', label: '按得分' },
        ],
        barX,
        226
      );
    };

    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const clientToThreshold = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.threshold;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    return map(x, PX0, PX1, LOSS_MIN, LOSS_MAX);
  };

  const applyThreshold = (value: number) => {
    const t = clamp(value, LOSS_MIN, LOSS_MAX);
    stateRef.current.threshold = t;
    stateRef.current.started = true;
    setThreshold(t);
    setFeedback({ text: LOSS_FB, cls: 'bad' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.mode === 'score') return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        void 0;
      }
    }
    stateRef.current.dragging = true;
    applyThreshold(clientToThreshold(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging || stateRef.current.mode === 'score') return;
    applyThreshold(clientToThreshold(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    stateRef.current.dragging = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        void 0;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (stateRef.current.mode === 'score') return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowLeft' ? -0.02 : 0.02;
    applyThreshold(stateRef.current.threshold + delta);
  };

  const useScore = () => {
    stateRef.current.mode = 'score';
    stateRef.current.revealed = true;
    stateRef.current.dragging = false;
    setMode('score');
    setFeedback({ text: SCORE_FB, cls: 'good' });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ cursor: mode === 'loss' ? 'ew-resize' : 'default', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <div className="chip-row">
          <button className="chip selected" disabled>
            拖动选型线
          </button>
          <span className="val">损失阈值 {threshold.toFixed(2)}</span>
        </div>
        <button onClick={useScore} disabled={mode === 'score'}>
          {mode === 'score' ? '已按下游得分选型' : '改用下游得分'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
