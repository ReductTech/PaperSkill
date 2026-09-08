import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Module 6.1 — 分阶段训练配方：CPT → SFT → RL (P2 step-through visualizer).
// Canvas 560x240: four stage cards, log-scale-like volume bars, per-step revealed
// score curve. Colors only from the locked palette.

const W = 560;
const H = 240;

interface StageMeta {
  name: string;
  volumeLabel: string;
  lrLabel: string;
  jobLine: string;
}

const stageMeta: readonly StageMeta[] = [
  {
    name: '起步点',
    volumeLabel: '',
    lrLabel: '—',
    jobLine: '起步点：从 1.5 的 checkpoint 出发，先看基线分数。',
  },
  { name: 'CPT 广覆盖', volumeLabel: '1680 万', lrLabel: '学习率 3×10⁻⁵', jobLine: '灌入全部新分布与修正标签' },
  { name: 'SFT 精难例', volumeLabel: '730 万', lrLabel: '学习率 1×10⁻⁵', jobLine: '只练难样本与修正样本' },
  { name: 'RL 收官', volumeLabel: '4.9 万', lrLabel: '学习率 2×10⁻⁶', jobLine: '只练高潜力样本' },
];

const scoreData: readonly number[] = [94.93, 95.62, 96.25, 96.33];

const cardX: readonly number[] = [20, 152, 284, 416];
const cardY = 10;
const cardW = 120;
const cardH = 34;
const pointX: readonly number[] = [80, 212, 344, 476];
const baseY = 216; // score panel axis baseline
const barBase = 108; // volume bars baseline
const barW = 26;
const barCx: readonly number[] = [212, 344, 476];

const feedbacks: ReadonlyArray<{ text: string; cls: string }> = [
  { text: '起点是 1.5 的 checkpoint：总分 94.93。', cls: '' },
  { text: 'CPT 广覆盖：1680 万样本注入新分布，总分 +0.69 到 95.62，表格 TEDS 大幅回升。', cls: '' },
  { text: 'SFT 精难例：730 万难样本精修，总分再 +0.63 到 96.25，结构分 TEDS-S 冲到 97.09。', cls: '' },
  {
    text: 'RL 收官：4.9 万高潜力样本，总分 +0.08 到 96.33——余量虽小，但每一步都为正。<br/>三阶段各司其职：广度、难度、潜力——这正是“把数据按可靠性分层使用”。',
    cls: 'good',
  },
];

/** Log-scale-like bar height (示意): h = max(8, 60·(log10(n) − 4.5) / (7.23 − 4.5)). */
function barHeight(samples: number): number {
  return Math.max(8, Math.round((60 * (Math.log10(samples) - 4.5)) / (7.23 - 4.5)));
}

const barHeights: readonly number[] = [barHeight(16.8e6), barHeight(7.3e6), barHeight(4.9e4)];

function scoreY(score: number): number {
  return baseY - (score - 94.5) * 22;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function desk(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 30, W, 30);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 30);
  ctx.lineTo(W, H - 30);
  ctx.stroke();
}

function sheet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function stageCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  active: boolean
) {
  ctx.fillStyle = active ? '#f5f8f0' : '#ffffff';
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeStyle = active ? '#27446e' : '#d7deea';
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + w / 2, y + h / 2);
}

function barOutline(ctx: CanvasRenderingContext2D, i: number) {
  const cx = barCx[i - 1];
  const h = barHeights[i - 1];
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - barW / 2, barBase - h, barW, h);
}

function barFill(ctx: CanvasRenderingContext2D, i: number, step: number) {
  if (i > step) return; // unreached stages stay hollow
  const cx = barCx[i - 1];
  const h = barHeights[i - 1];
  ctx.fillStyle = i < step ? '#228d5c' : '#27446e';
  ctx.fillRect(cx - barW / 2, barBase - h, barW, h);
}

function barLabels(ctx: CanvasRenderingContext2D, i: number) {
  const cx = barCx[i - 1];
  const h = barHeights[i - 1];
  ctx.fillStyle = '#68778f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '10px sans-serif';
  ctx.fillText(stageMeta[i].volumeLabel, cx, barBase - h - 4);
  ctx.font = '9px sans-serif';
  ctx.fillText(stageMeta[i].lrLabel, cx, barBase + 8);
}

function scorePanel(
  ctx: CanvasRenderingContext2D,
  step: number,
  time: number,
  reduceMotion: boolean
) {
  sheet(ctx, 20, 148, 520, 84);
  // axis baseline
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, baseY);
  ctx.lineTo(524, baseY);
  ctx.stroke();
  // left axis tick labels
  ctx.fillStyle = '#68778f';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('96.5', 38, 175);
  ctx.fillText('94.5', 38, 219);
  // caption at the right end of the baseline
  ctx.textAlign = 'right';
  ctx.fillText('总分（越高越好）', 524, 219);
  // curve segments between consecutive reached points
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < scoreData.length; i++) {
    if (i <= step) {
      ctx.moveTo(pointX[i - 1], scoreY(scoreData[i - 1]));
      ctx.lineTo(pointX[i], scoreY(scoreData[i]));
    }
  }
  ctx.stroke();
  // points
  const pulseT = (time / 1200) % 1;
  const ringR = reduceMotion ? 7 : lerp(6, 8, easeInOutQuad(pulseT));
  for (let i = 0; i < scoreData.length; i++) {
    const x = pointX[i];
    const y = scoreY(scoreData[i]);
    if (i <= step) {
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (i === step) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(scoreData[i].toFixed(2), x, y - 6);
    } else {
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (s: { step: number }, time: number) => {
      ctx.clearRect(0, 0, W, H);
      desk(ctx);
      // top band: four stage cards
      for (let i = 0; i < stageMeta.length; i++) {
        stageCard(ctx, cardX[i], cardY, cardW, cardH, stageMeta[i].name, i === s.step);
      }
      // volume band: hollow outlines first, fills after
      for (let i = 1; i < stageMeta.length; i++) barOutline(ctx, i);
      for (let i = 1; i < stageMeta.length; i++) barFill(ctx, i, s.step);
      // count + learning-rate labels
      for (let i = 1; i < stageMeta.length; i++) barLabels(ctx, i);
      // 起步点 column: dashed placeholder + '—'
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(pointX[0] - barW / 2, barBase - 60, barW, 60);
      ctx.setLineDash([]);
      ctx.fillStyle = '#68778f';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(stageMeta[0].lrLabel, pointX[0], barBase + 8);
      // 示意图 note (top baseline, clear of the lr labels)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('示意：柱长按对数刻度，非真实比例', 536, 118);
      ctx.textBaseline = 'alphabetic';
      // score panel
      scorePanel(ctx, s.step, time, reduceMotion);
      // job detail line
      ctx.fillStyle = '#21324a';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stageMeta[s.step].jobLine, W / 2, 139);
      // step highlight drawn last
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      rr(ctx, cardX[s.step], cardY, cardW, cardH, 6);
      ctx.stroke();
    };

    const tick = (now: number) => {
      render(stateRef.current, now);
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

  const goTo = (s: number) => {
    const ns = clamp(s, 0, 3);
    stateRef.current.step = ns;
    setStep(ns);
  };

  const fb = feedbacks[step];
  const disabledStyle: React.CSSProperties = { opacity: 0.45, cursor: 'not-allowed' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          aria-disabled={step === 0}
          style={step === 0 ? disabledStyle : undefined}
        >
          上一步
        </button>
        <span aria-live="polite" style={{ color: '#21324a', fontWeight: 700 }}>
          第 {step + 1} / 4 步
        </span>
        <button
          type="button"
          className="tiny"
          onClick={() => goTo(step + 1)}
          disabled={step === 3}
          aria-disabled={step === 3}
          style={step === 3 ? disabledStyle : undefined}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => goTo(0)}>
          重置
        </button>
      </div>
      <div
        className={'feedback ' + fb.cls}
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: fb.text }}
      />
    </div>
  );
};

export default Ch5Mod1;
