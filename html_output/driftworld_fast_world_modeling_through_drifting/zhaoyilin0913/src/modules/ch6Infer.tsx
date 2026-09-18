import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 6 章：单次前向 + 自回归 rollout（P2 逐步推进）。
const W = 1080;
const H = 280;
const TOTAL = 4;

export const Ch6Infer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '第 0 段：从当前观测出发。', cls: '' });

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
      drawRiver(ctx, W, H);
      const dockX = W - 90;
      drawDock(ctx, dockX, H * 0.6, COLORS.green);
      const x = 70 + (s.step / TOTAL) * (dockX - 110);
      drawBoat(ctx, x, H * 0.6, 1, COLORS.blue, COLORS.green);
      text(ctx, `当前段 ${s.step} / ${TOTAL}`, 40, 34, COLORS.ink, 22);
      text(ctx, '每次都是一次前向，无逐步去噪', 40, 66, COLORS.muted, 18);
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

  const go = (s: number) => {
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFeedback({ text: '第 0 段：从当前观测出发。', cls: '' });
    else if (s >= TOTAL) setFeedback({ text: '长程 rollout 完成：每一步都只需一次前向传播。', cls: 'good' });
    else setFeedback({ text: `第 ${s} 段：预测帧送回策略，再单次前向生成下一段。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={step === 0} onClick={() => go(Math.max(0, step - 1))}>
          上一步
        </button>
        <button className="chip" disabled={step === TOTAL} onClick={() => go(Math.min(TOTAL, step + 1))}>
          下一步
        </button>
        <button className="chip" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Infer;
