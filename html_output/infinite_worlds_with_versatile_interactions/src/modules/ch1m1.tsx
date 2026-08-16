import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearScene,
  createAutoplay,
  drawBasket,
  drawInset,
  drawLegend,
  drawNeedles,
  drawScarf,
  drawSceneLabel,
  drawTargetWidthGuide,
  drawYarnBall,
  rampSteps,
  setupCrispCanvas,
  useAutoplay,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 280;

interface S {
  minutes: number;
}

function driftOf(minutes: number): number {
  return Math.pow(minutes / 60, 1.35);
}

function colorOf(drift: number): string {
  if (drift < 0.25) return PAL.green;
  if (drift < 0.55) return PAL.blue;
  return PAL.red;
}

export const Ch1M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S>({ minutes: 1 });
  const rafRef = useRef<number | null>(null);
  const [minutes, setMinutes] = useState(1);
  const [feedback, setFeedback] = useState({
    text: '当前 1 分钟：围巾还贴着导引带，画面稳定。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: S, time: number) => {
      const drift = driftOf(s.minutes);
      const col = colorOf(drift);
      const rows = 8 + Math.floor(s.minutes / 3);

      clearScene(ctx, W, H);
      drawTargetWidthGuide(ctx, 46, 430, 168, 30);
      drawBasket(ctx, 32, 168, Math.min(6, Math.floor(s.minutes / 8)));
      const end = drawScarf(
        ctx,
        52,
        168,
        rows,
        (i) => 26 + drift * 30 * Math.pow(i / Math.max(1, rows - 1), 2),
        col,
        13
      );
      drawYarnBall(ctx, 58, 226, time);
      drawNeedles(ctx, Math.min(end, 436), 168, 0.18, col, 4);

      // technical inset: drift vs elapsed time (qualitative shape)
      drawInset(ctx, 470, 40, 226, 172, '偏离程度随时长变化（定性示意）');
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(486, 186);
      ctx.lineTo(684, 186);
      ctx.moveTo(486, 74);
      ctx.lineTo(486, 186);
      ctx.stroke();

      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let m = 1; m <= 60; m++) {
        const x = 486 + ((m - 1) / 59) * 194;
        const y = 186 - Math.pow(m / 60, 1.35) * 104;
        if (m === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const cx = 486 + ((s.minutes - 1) / 59) * 194;
      const cy = 186 - drift * 104;
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 186);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.fillStyle = PAL.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('时长', 646, 200);

      drawSceneLabel(ctx, 52, 36, `连续生成 ${s.minutes} 分钟`);
      drawSceneLabel(ctx, 52, 262, '导引带 = 可接受的形变范围');
      drawLegend(ctx, 300, 262, [
        { color: PAL.green, label: '带内' },
        { color: PAL.red, label: '带外' },
      ]);
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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
      detachCrisp();
    };
  }, []);

  const apply = (m: number) => {
    stateRef.current.minutes = m;
    setMinutes(m);
    if (m <= 15) {
      setFeedback({ text: `当前 ${m} 分钟：围巾还在容差带内，几何和纹理都稳。`, cls: 'good' });
    } else if (m <= 35) {
      setFeedback({ text: `当前 ${m} 分钟：边缘开始外扩，纹理和几何已经在慢慢跑偏。`, cls: '' });
    } else {
      setFeedback({
        text: `当前 ${m} 分钟：边缘明显歪出导引带，这正是论文说的纹理糊化、几何扭曲（趋势为定性示意，论文未给出量化曲线）。`,
        cls: 'bad',
      });
    }
  };

  // Autoplay sweeps 1 -> 60 minutes so the monotone degradation is visible
  // without dragging. Any manual move stops it.
  const demo = useAutoplay({ steps: rampSteps(1, 60, 24), intervalMs: 380 }, (m: number) =>
    apply(Math.round(m))
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    demo.stop();
    apply(Number(e.target.value));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          连续生成时长 <span className="val">{minutes} 分钟</span>
        </label>
        <input type="range" min={1} max={60} step={1} value={minutes} onChange={onChange} />
        <button className={demo.btnClass} onClick={demo.toggle}>
          {demo.label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1M1;
