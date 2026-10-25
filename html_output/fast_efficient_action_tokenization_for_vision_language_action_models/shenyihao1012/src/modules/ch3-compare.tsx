import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWaveform,
  drawFreqBars,
  drawShorthand,
  drawCheckMark,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch3 module (E05, ShirtFold row): same 1-second action chunk, two routes on a
// shared clock. Naive: per-step grid cells fill, counter climbs to 700 (red).
// FAST: the waveform folds into frequency bars, then condenses into sparse
// shorthand symbols, counter settles at 53 (green).
const W = 1080;
const H = 280;
const DUR = 5000;
const CELL_MAX = 700; // 50 tokens/s × 14 dims, 1-second chunk
const SYM_MAX = 53;

const WAVE: number[] = [];
for (let i = 0; i < 140; i++) {
  const a = (i / 139) * Math.PI * 2;
  WAVE.push(
    clamp(
      0.52 * Math.sin(a + 0.4) + 0.3 * Math.sin(a * 2.35 + 1.7) + 0.18 * Math.sin(a * 4.1 + 0.9),
      -0.95,
      0.95
    )
  );
}
const COEFS = [0.86, 0.5, 0.32, 0.2, 0.14, 0.1, 0.07, 0.05, 0.03, 0.02];

interface CmpState {
  startMs: number | null;
  done: boolean;
}

export const Ch3Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CmpState>({ startMs: null, done: false });
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '两条路线准备就绪——按下开始，同时记录同一段 1 秒动作。',
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
    let raf = 0;

    const render = (ms: number) => {
      const s = stateRef.current;
      const p = s.startMs === null ? 0 : clamp((ms - s.startMs) / DUR, 0, 1);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // separators
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      [74, 154].forEach((sy) => {
        ctx.beginPath();
        ctx.moveTo(24, sy);
        ctx.lineTo(1056, sy);
        ctx.stroke();
      });

      // top: the shared 1-second waveform, shown once
      drawSceneLabel(ctx, '同一秒动作', 40, 42);
      drawWaveform(ctx, 150, 10, 890, 58, WAVE, C.text);

      // lane 1 — naive route: per-step grid cells fill, counter → 700
      const q = easeOutCubic(p);
      const naive = Math.floor(q * CELL_MAX);
      if (p < 1) {
        ctx.globalAlpha = 0.15 * (1 - p);
        drawWaveform(ctx, 40, 82, 930, 60, WAVE, C.text, { dashed: true });
        ctx.globalAlpha = 1;
      }
      const cols = 70;
      const pitchX = 930 / cols;
      ctx.fillStyle = C.red;
      for (let i = 0; i < naive; i++) {
        const rr = Math.floor(i / cols);
        const cc = i % cols;
        ctx.fillRect(40 + cc * pitchX, 84 + rr * 6, pitchX - 2, 4.6);
      }
      drawValueChip(ctx, 1010, 114, String(naive), C.red);

      // lane 2 — compression route: waveform folds into freq bars, then
      // condenses into sparse shorthand symbols, counter settles at 53
      const aFade = 1 - clamp(p / 0.35, 0, 1);
      if (aFade > 0.01) {
        ctx.globalAlpha = aFade;
        drawWaveform(ctx, 40, 164, 930, 44, WAVE, C.text);
        ctx.globalAlpha = 1;
      }
      const barT = clamp((p - 0.3) / 0.35, 0, 1);
      const barAlpha = barT * (1 - clamp((p - 0.62) / 0.2, 0, 1));
      if (barAlpha > 0.01) {
        ctx.globalAlpha = barAlpha;
        drawFreqBars(ctx, 40, 168, 930, 40, COEFS, C.purple);
        ctx.globalAlpha = 1;
      }
      const symT = clamp((p - 0.6) / 0.36, 0, 1);
      const fast = Math.floor(symT * SYM_MAX);
      if (fast > 0) drawShorthand(ctx, 44, 222, fast, { size: 0.78 });
      drawValueChip(ctx, 1010, 208, String(fast), s.done ? C.green : C.purple);
      if (s.done) drawCheckMark(ctx, 1010, 244);

      drawLegend(
        ctx,
        [
          ['硬塞路线', C.red],
          ['压缩路线', C.green],
        ],
        40,
        268
      );

      if (p >= 1 && !s.done) {
        s.done = true;
        setRunning(false);
        setFeedback({
          text: '同样一秒的动作：700 个冗余 token vs 53 个高信息 token——压缩不是省纸，是救学习信号。',
          cls: 'good',
        });
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const restart = () => {
    stateRef.current.startMs = performance.now();
    stateRef.current.done = false;
    setRunning(true);
    setFeedback({
      text: '硬塞路线逐件占格；压缩路线把衣物折进压缩袋、再卷成衣物卷。',
      cls: '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={restart} disabled={running}>
          开始
        </button>
        <button type="button" className="tiny ghost" onClick={restart}>
          重放
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Compare;
