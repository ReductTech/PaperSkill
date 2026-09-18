import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 7 章：训练收敛（P2 逐步推进）。漂移场趋零，损失下降。
const W = 1080;
const H = 300;
const TOTAL = 8;

export const Ch7Train: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '第 0 轮：漂移场很大，损失高。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const loss = (i: number) => Math.exp(-i / 2.2);
    const render = (s: { step: number }) => {
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, W, H);
      const left = 70;
      const top = 50;
      const bw = W - 140;
      const bh = H - 110;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, bw, bh);
      text(ctx, '损失', left - 36, top + 14, COLORS.muted, 18, 'right');
      text(ctx, '迭代', left + bw / 2, H - 24, COLORS.muted, 18, 'center');
      // 损失曲线
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= TOTAL; i += 1) {
        const x = left + (i / TOTAL) * bw;
        const y = top + bh - loss(i) * bh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 当前迭代点
      const cx = left + (s.step / TOTAL) * bw;
      const cy = top + bh - loss(s.step) * bh;
      ctx.fillStyle = COLORS.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `漂移场强度 ${(loss(s.step) * 100).toFixed(0)}%`, 40, 30, COLORS.ink, 20);
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
    if (s === 0) setFeedback({ text: '第 0 轮：漂移场很大，损失高。', cls: '' });
    else if (s >= TOTAL) setFeedback({ text: '训练收敛：漂移场趋零，生成分布已贴到真实分布。', cls: 'good' });
    else setFeedback({ text: `第 ${s} 轮：漂移场逐步缩小，损失下降。`, cls: '' });
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

export default Ch7Train;
