import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawMoldGrid,
  drawChunkStrip,
  drawVerdict,
  drawArm,
  drawValueChip,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch1 module: one shared clock (~2 s) draws the same order twice.
// TOP lane — 档位词轨迹: a staircase snapped to a 12-column mold grid; the
// robot only moves while a word is being emitted and idles (blinking
// hourglass) in between; 12 red token cells light up one per word.
// BOTTOM lane — 流式轨迹: a smooth bezier arc traced continuously with a
// fluid arm, plus the H=50 action chunk strip compressed to 25 purple cells.
const W = 1080;
const H = 280;
const RUN = 2000;

const GX = 60;
const GY = 44;
const GW = 620;
const GH = 78;
const COLS = 12;
const ROWS = 3;
const CW = GW / COLS;
const RH = GH / ROWS;
// Grid row line (0..2) the staircase sits on, per column 0..12.
const ROW_LINE = [2, 1, 1, 2, 1, 0, 0, 1, 2, 2, 1, 0, 1];

// Bottom-lane pick-and-place bezier.
const BZ: [number, number][] = [
  [70, 250],
  [210, 156],
  [490, 156],
  [680, 230],
];

function bez(t: number): [number, number] {
  const mt = 1 - t;
  const x =
    mt ** 3 * BZ[0][0] + 3 * mt * mt * t * BZ[1][0] + 3 * mt * t * t * BZ[2][0] + t ** 3 * BZ[3][0];
  const y =
    mt ** 3 * BZ[0][1] + 3 * mt * mt * t * BZ[1][1] + 3 * mt * t * t * BZ[2][1] + t ** 3 * BZ[3][1];
  return [x, y];
}

function drawHourglass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  a: number
) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 8);
  ctx.lineTo(x + 6, y - 8);
  ctx.lineTo(x - 6, y + 8);
  ctx.lineTo(x + 6, y + 8);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 3);
  ctx.lineTo(x + 3, y + 3);
  ctx.lineTo(x, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

type Phase = 'idle' | 'running' | 'done';

const FB_IDLE = { text: '按开始，看同一订单的两种做法。', cls: '' };
const FB_RUN = {
  text: '同一座钟：上——档位词逐格生成、机器人干等；下——流式轨迹连着拉、动作块边生成边亮。',
  cls: '',
};
const FB_DONE = {
  text: '同样听懂了指令，差在手上：离散格子画不出流畅弧线——<b>灵巧=连续+高频</b>，这就是 π0 换赛道的理由。',
  cls: 'good',
};

export const Ch1Order: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; t0: number }>({ phase: 'idle', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState(FB_IDLE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (elapsed: number, ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(24, 138);
      ctx.lineTo(1056, 138);
      ctx.stroke();

      const cl = clamp(elapsed >= 0 ? elapsed / RUN : 0, 0, 1);
      const q = cl * COLS;

      // ---- TOP: discretized word trajectory ----
      drawMoldGrid(ctx, GX, GY, GW, GH, COLS, ROWS);
      const e = Math.min(COLS, Math.floor(q));
      const frac = q - e;
      const emitting = e < COLS && frac < 0.7;
      const moveP = emitting ? frac / 0.7 : 1;
      const rowY = (k: number) => GY + ROW_LINE[k] * RH;
      let tip: [number, number] = [GX, rowY(0)];
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(GX, rowY(0));
      for (let k = 0; k <= e && k < COLS; k++) {
        const xEnd = k < e ? GX + (k + 1) * CW : GX + (k + moveP) * CW;
        ctx.lineTo(xEnd, rowY(k));
        tip = [xEnd, rowY(k)];
        if (k < e) {
          ctx.lineTo(xEnd, rowY(k + 1));
          tip = [xEnd, rowY(k + 1)];
        }
      }
      ctx.stroke();
      ctx.restore();
      if (!emitting && e < COLS) {
        drawHourglass(
          ctx,
          tip[0] + 18,
          Math.max(tip[1] - 22, 40),
          0.35 + 0.65 * Math.abs(Math.sin(ms / 160))
        );
      }
      drawArm(ctx, 36, 122, {
        scale: 0.85,
        angle: emitting ? -0.35 + moveP * 0.6 : 0.2,
        grip: 0.4,
        color: C.red,
      });
      drawChunkStrip(ctx, 740, 84, 280, COLS, {
        color: C.red,
        highlightTo: Math.min(COLS, Math.ceil(q)),
      });

      // ---- BOTTOM: flow trajectory ----
      const p = cl;
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(BZ[0][0], BZ[0][1]);
      for (let i = 1; i <= 40; i++) {
        const [x, y] = bez(i / 40);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const [sx, sy] = bez(0);
      ctx.moveTo(sx, sy);
      const steps = 48;
      for (let i = 1; i <= Math.round(p * steps); i++) {
        const [x, y] = bez(i / steps);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      const [ax, ay] = bez(p);
      drawArm(ctx, ax, ay + 10, {
        scale: 0.8,
        angle: -0.45 * Math.sin(p * Math.PI * 2),
        grip: 0.35 + 0.45 * Math.sin(p * Math.PI),
        color: C.blue,
      });
      drawChunkStrip(ctx, 740, 208, 280, 25, { highlightTo: Math.floor(p * 25) });

      // ---- Verdicts after both lanes finish ----
      if (elapsed > RUN + 300) {
        const pulse = (elapsed - RUN) / 650;
        drawVerdict(ctx, 1046, 84, false, { r: 15, pulse });
        drawVerdict(ctx, 1046, 208, true, { r: 15, pulse });
      }

      drawSceneLabel(ctx, '档位词轨迹', 60, 26, { color: C.red });
      drawValueChip(ctx, 172, 26, '256档', C.red);
      drawSceneLabel(ctx, '流式轨迹', 60, 150, { color: C.green });
      drawValueChip(ctx, 150, 150, '50Hz', C.green);
      drawLegend(
        ctx,
        [['锯齿折线', C.red], ['平滑弧线', C.green], ['动作块 H=50', C.purple]],
        60,
        272
      );
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      const elapsed = s.phase === 'idle' ? -1 : ms - s.t0;
      render(elapsed, ms);
      if (s.phase === 'running' && elapsed >= RUN + 300) {
        s.phase = 'done';
        setPhase('done');
        setFeedback(FB_DONE);
      }
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

  const startRun = () => {
    stateRef.current.phase = 'running';
    stateRef.current.t0 = performance.now();
    setPhase('running');
    setFeedback(FB_RUN);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={startRun}>
          {phase === 'idle' ? '开始' : '重放'}
        </button>
        <span className="step-label">
          订单：<b>抓起杯子放进盘</b>
        </span>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch1Order;
