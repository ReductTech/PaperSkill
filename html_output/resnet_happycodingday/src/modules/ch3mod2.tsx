import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch3 M3.2: P2 stepper — correction amount 0 / 50 / 100 / 120% shows original+fix converging.
const W = 560;
const H = 240;

const AMOUNTS = [
  { pct: 0, label: '0% 只保留原文', fb: '只保留原文，错误还在。', cls: 'bad' },
  { pct: 50, label: '50% 修正一半', fb: '修正一半，接近但仍不准。', cls: '' },
  { pct: 100, label: '100% 原文+修正', fb: '原文 + 修正 = 正确修订句。', cls: 'good' },
  { pct: 120, label: '120% 修正过头', fb: '修正过头，反而引入新错误。', cls: 'bad' },
];

export const Ch3Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const render = (s: { step: number }) => {
      clearScene(ctx, W, H);
      const amt = AMOUNTS[s.step].pct / 100;
      drawPage(ctx, W / 2, 120, 440, 90, 0);
      // original line
      drawTextLines(ctx, W / 2 - 190, 108, 200, 2, 1, C.ink);
      // correction overlay proportional to amount
      const markLen = Math.min(amt, 1) * 170;
      if (amt > 0) {
        drawMark(ctx, W / 2 - 170 + markLen / 2, 138, 'under', amt > 1 ? C.orange : C.red, markLen);
      }
      if (amt > 0.3) {
        drawMark(ctx, W / 2 - 130 + markLen / 2, 158, 'caret', amt > 1 ? C.orange : C.red, 20);
      }
      // correctness bar
      const ok = amt === 1;
      const bad = amt === 0 || amt > 1;
      ctx.fillStyle = ok ? C.green : bad ? C.red : C.orange;
      ctx.fillRect(W / 2 - 100, 210, 200 * (ok ? 1 : bad ? 0.35 : 0.65), 8);
      drawSceneLabel(ctx, AMOUNTS[s.step].label, W / 2, 30, ok ? C.green : bad ? C.red : C.orange, 'center');
    };
    const tick = () => {
      render(stateRef.current);
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

  const go = (ns: number) => {
    const s = clamp(ns, 0, AMOUNTS.length - 1);
    stateRef.current.step = s;
    setStep(s);
  };

  const a = AMOUNTS[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button onClick={() => go(step + 1)} disabled={step === AMOUNTS.length - 1}>
          下一步
        </button>
        <button onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${a.cls}`}>{a.fb}</div>
    </div>
  );
};

export default Ch3Mod2;
