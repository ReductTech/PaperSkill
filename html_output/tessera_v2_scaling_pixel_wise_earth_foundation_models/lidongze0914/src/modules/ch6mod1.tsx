import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const TOTAL_STEPS = 8;
const OBS_PER_STEP = 5;
const TOTAL_OBS = 40;
const PLATE_X = 800;
const PLATE_Y = 104;
const PLATE_S = 132;

interface SceneState {
  step: number;
  stepAt: number;
  doneAt: number;
}

interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

const feedbackFor = (step: number): Feedback => {
  if (step === 0) {
    return { text: '第 0 步：还没有叠入曝光，成像板上只有噪声。', cls: 'bad' };
  }
  if (step >= TOTAL_STEPS) {
    return {
      text: '40 个有效观测全部叠入：同一物候的更多证据，不是更长的分布外输入；证据区显示同一权重下 OpenET 年度窗 0.51、月度窗 0.69。',
      cls: 'good',
    };
  }
  return {
    text: `第 ${step} 步：已叠 ${step * OBS_PER_STEP}/40 个观测，噪声下降、星点变亮。`,
    cls: '',
  };
};

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 34, W, 34);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 34);
  ctx.lineTo(W, H - 34);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, count: number): void {
  let s = 13;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 20 + (s / 233280) * (W - 40);
    s = (s * 9301 + 49297) % 233280;
    const y = 12 + (s / 233280) * 56;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const half = size / 2;
  ctx.fillStyle = 'rgba(215,222,234,0.25)';
  ctx.fillRect(x - half, y - half, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - half, y - half, size, size);
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign
): void {
  ctx.fillStyle = '#21324a';
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 10, 14, 10);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 44 + ctx.measureText(item.label).width;
  });
}

function renderScene(ctx: CanvasRenderingContext2D, s: SceneState, now: number): void {
  clearScene(ctx);
  drawSky(ctx, 10);

  const flying = s.step > 0 && now - s.stepAt < 400;
  const effStep = flying ? s.step - 1 : s.step;
  const done = s.step === TOTAL_STEPS;
  const fade = done ? clamp((now - s.doneAt) / 600, 0, 1) : 0;

  for (let i = 0; i < TOTAL_STEPS; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawPlate(ctx, 112 + col * 56, 66 + row * 32, 30, i < s.step ? '#68778f' : '#27446e');
  }

  for (let i = 0; i < TOTAL_STEPS; i += 1) {
    ctx.fillStyle = i < s.step ? '#f07e47' : '#d7deea';
    ctx.beginPath();
    ctx.arc(70 + i * 24, 187, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSceneLabel(ctx, '曝光帧', 60, 44, 'left');
  drawSceneLabel(ctx, '成像板', PLATE_X, 24, 'center');

  drawPlate(ctx, PLATE_X, PLATE_Y, PLATE_S, '#27446e');

  const noise = Math.round((30 * (TOTAL_STEPS - effStep)) / TOTAL_STEPS);
  let seed = 23;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < noise; i += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const nx = PLATE_X - PLATE_S / 2 + 10 + (seed / 233280) * (PLATE_S - 20);
    seed = (seed * 9301 + 49297) % 233280;
    const ny = PLATE_Y - PLATE_S / 2 + 10 + (seed / 233280) * (PLATE_S - 20);
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  if (done && !flying) {
    drawTarget(ctx, PLATE_X, PLATE_Y, '#228d5c');
    drawTarget(ctx, PLATE_X + 46, PLATE_Y + 46, '#228d5c');
    drawBeam(ctx, PLATE_X + 46, PLATE_Y + 46, PLATE_X + 46, 196, '#228d5c');
  } else {
    const starR = 2 + (5 * effStep) / TOTAL_STEPS;
    ctx.save();
    ctx.globalAlpha = 0.15 + (0.85 * effStep) / TOTAL_STEPS;
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(PLATE_X, PLATE_Y, starR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (flying) {
    const i = s.step - 1;
    const t = easeOutCubic(clamp((now - s.stepAt) / 400, 0, 1));
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawPlate(ctx, lerp(112 + col * 56, PLATE_X, t), lerp(66 + row * 32, PLATE_Y, t), 30, '#27446e');
  }

  ctx.fillStyle = '#d7deea';
  ctx.fillRect(PLATE_X - 90, 180, 180, 8);
  ctx.fillStyle = '#27446e';
  ctx.fillRect(PLATE_X - 90, 180, map(effStep * OBS_PER_STEP, 0, TOTAL_OBS, 0, 180), 8);
  ctx.fillStyle = '#21324a';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${effStep * OBS_PER_STEP}/40`, PLATE_X + 98, 190);

  ctx.fillStyle = 'rgba(215,222,234,0.18)';
  ctx.fillRect(40, 196, 1000, 80);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 196, 1000, 80);

  const bars = [
    { score: 0.51, color: '#27446e', y: 212, thick: 10 },
    { score: 0.69, color: '#228d5c', y: 234, thick: 14 },
    { score: 0.58, color: '#68778f', y: 256, thick: 10 },
  ];
  if (fade > 0) {
    ctx.save();
    ctx.globalAlpha = fade;
    bars.forEach((bar) => {
      const len = map(bar.score, 0, 1, 0, 380);
      ctx.fillStyle = bar.color;
      ctx.fillRect(560, bar.y, len, bar.thick);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(bar.score.toFixed(2), 560 + len + 10, bar.y + bar.thick - 1);
    });
    ctx.restore();
  } else {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(215,222,234,0.9)';
    ctx.lineWidth = 2;
    bars.forEach((bar) => {
      ctx.beginPath();
      ctx.moveTo(560, bar.y + bar.thick / 2);
      ctx.lineTo(940, bar.y + bar.thick / 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawLegend(
    ctx,
    [
      { label: '年度窗', color: '#27446e' },
      { label: '月度窗', color: '#228d5c' },
      { label: '参照基线', color: '#68778f' },
    ],
    60,
    262
  );
}

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef<SceneState>({ step: 0, stepAt: 0, doneAt: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(0));

  useEffect(() => {
    if (step === TOTAL_STEPS) restartRef.current?.focus();
  }, [step]);

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
      renderScene(ctx, stateRef.current, performance.now());
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

  const onNext = () => {
    const s = stateRef.current;
    if (s.step >= TOTAL_STEPS) return;
    s.step += 1;
    s.stepAt = performance.now();
    if (s.step === TOTAL_STEPS) s.doneAt = performance.now();
    setStep(s.step);
    setFeedback(feedbackFor(s.step));
  };

  const onReset = () => {
    const s = stateRef.current;
    s.step = 0;
    s.stepAt = 0;
    s.doneAt = 0;
    setStep(0);
    setFeedback(feedbackFor(0));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onNext} disabled={step >= TOTAL_STEPS}>
          {step >= TOTAL_STEPS ? '已叠满' : '下一步'}
        </button>
        <button type="button" onClick={onReset} disabled={step === 0} ref={restartRef}>
          重新开始
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch6Mod1;
