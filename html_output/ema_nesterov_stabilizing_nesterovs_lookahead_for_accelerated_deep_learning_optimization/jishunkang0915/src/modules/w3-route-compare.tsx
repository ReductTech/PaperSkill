import React, { useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, drawTarget, drawLabel, drawLegend } from './river-kit';

// §3 Module 3.1: step through 6 stops down the valley, comparing per-stop
// lookahead positions of wave-chasing vs trend-following directions.

const W = 1080;
const H = 280;
const STOPS = 6;

const STEP_TEXT = [
  '第 1/6 步：两舟同一起点，方向尚未分出高下。',
  '第 2/6 步：平稳河段，两种前瞻都还在河道内。',
  '第 3/6 步：浪开始密集，逐浪路线出现第一个偏移。',
  '第 4/6 步：河谷转弯了，逐浪的船头甩向高岸。',
  '第 5/6 步：趋势路线贴着弯道内侧，损失始终更低。',
  '第 6/6 步：六步下来，趋势路线的累计损失更低。',
];

// per-stop loss values (illustrative of Fig 1 left: chase route lands high after the bend)
const LOSS_CHASE = [0.02, 0.05, 0.14, 0.52, 0.66, 0.71];
const LOSS_TREND = [0.02, 0.04, 0.07, 0.09, 0.11, 0.12];

export const W3RouteCompare: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  const render = (s: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    // top: valley route with 6 stops
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 110);
    ctx.clip();
    drawRiver(ctx, W, H, 0.5, 0.6);
    const stopX = (i: number) => 60 + i * ((W - 140) / (STOPS - 1));
    const stopY = (i: number) => 74 + Math.sin((i / (STOPS - 1)) * Math.PI * 1.4) * 10;
    // route lines
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let i = 0; i <= s; i++) {
      const x = stopX(i);
      const y = stopY(i) + (i >= 3 ? (i - 2) * 9 : 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= s; i++) {
      const x = stopX(i);
      const y = stopY(i);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < STOPS; i++) {
      ctx.fillStyle = i <= s ? C.text : C.muted;
      ctx.beginPath();
      ctx.arc(stopX(i), stopY(i), i === s ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s >= 3) drawLookaheadArrow(ctx, stopX(s), stopY(s) + (s - 2) * 9, 20, -34, C.red, 2.5);
    drawCanoe(ctx, stopX(s), s >= 3 ? stopY(s) + (s - 2) * 9 : stopY(s), s >= 3 ? -0.16 : 0, C.red, 0.7);
    ctx.restore();
    // bottom: zoomed comparison of the current stop
    const by = 130;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, by, W - 220, H - by - 34);
    drawRiver(ctx, W - 260, H - by - 34, 0, 0);
    ctx.save();
    ctx.translate(40, by);
    ctx.beginPath();
    ctx.rect(0, 0, W - 220, H - by - 34);
    ctx.clip();
    const cy = 52;
    drawLookaheadArrow(ctx, 60, cy, 90, LOSS_CHASE[s] * 90, C.red, 3.5);
    drawLookaheadArrow(ctx, 60, cy, 90, LOSS_TREND[s] * 12, C.green, 3.5);
    drawCanoe(ctx, 60, cy, 0, C.blue, 0.75);
    drawTarget(ctx, W - 280, 26);
    ctx.restore();
    drawLabel(ctx, `逐浪损失 ${LOSS_CHASE[s].toFixed(2)}`, W - 165, by + 50, C.red, 14);
    drawLabel(ctx, `趋势损失 ${LOSS_TREND[s].toFixed(2)}`, W - 165, by + 76, C.green, 14);
    drawLegend(ctx, [[C.red, '逐浪路线'], [C.green, '趋势路线']], 40, H - 12);
  };

  const go = (n: number) => {
    const s = Math.max(0, Math.min(STOPS - 1, n));
    setStep(s);
    render(s);
  };

  // initial draw happens on mount via ref callback below
  return (
    <div>
      <canvas
        ref={(el) => {
          if (el) {
            (canvasRef as { current: HTMLCanvasElement | null }).current = el;
            requestAnimationFrame(() => render(step));
          }
        }}
        width={W}
        height={H}
        style={{ maxWidth: '100%' }}
      />
      <div className="ctrl">
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button onClick={() => go(0)}>重置</button>
        <button onClick={() => go(step + 1)} disabled={step === STOPS - 1}>
          下一步
        </button>
      </div>
      <div className={`feedback ${step >= 4 ? 'good' : step === 3 ? 'bad' : ''}`}>{STEP_TEXT[step]}</div>
    </div>
  );
};

export default W3RouteCompare;
