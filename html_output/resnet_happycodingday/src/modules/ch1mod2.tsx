import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawSceneLabel, drawLegend } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch1 M1.2: P2 stepper — identity construction keeps error flat (green), real plain net error rises (red).
const W = 560;
const H = 240;

const STEPS = [
  '浅层网络已经训练好，误差为 E。',
  '新增一层「什么都不做」的恒等层：误差保持 E。',
  '真实普通网络新增一层：误差升到 E′ > E——优化器学不出恒等。',
  '结论：退化 = 优化问题，不是容量问题。',
];

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // paper stack on the left
      const n = s.step + 1;
      for (let i = 0; i < n; i++) {
        const clarity = clamp(1 - i * 0.22, 0.15, 1);
        drawPage(ctx, 130, 70 + i * 18, 150, 30, (i % 2 === 0 ? -1 : 1) * 0.03);
        drawTextLines(ctx, 65, 66 + i * 18, 120, 1, clarity, i === n - 1 && s.step === 2 ? C.red : C.ink);
      }
      drawSceneLabel(ctx, `第 ${n} 层`, 40, 40, C.blue);
      // error bars on the right
      const ox = 380;
      const oy = 210;
      const barE = 60;
      const barE2 = 120;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy + 12);
      ctx.lineTo(ox, oy - 150);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillRect(ox, oy - barE, 40, barE);
      drawSceneLabel(ctx, 'E', ox + 52, oy - barE - 12, C.green);
      if (s.step >= 2) {
        ctx.fillStyle = C.red;
        ctx.fillRect(ox + 90, oy - barE2, 40, barE2);
        drawSceneLabel(ctx, "E′", ox + 142, oy - barE2 - 12, C.red);
      }
      drawLegend(ctx, [
        { color: C.green, label: '恒等构造' },
        { color: C.red, label: '实际 plain' },
      ], ox - 40, oy + 30);
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
    const s = clamp(ns, 0, STEPS.length - 1);
    stateRef.current.step = s;
    setStep(s);
  };

  const feedback =
    step === 0
      ? '浅层网络：训练误差为 E。'
      : step === 1
      ? '新增恒等层，误差不变——构造解证明深层本可以不更差。'
      : step === 2
      ? '真实 plain 网络的误差却上升了：优化器学不出恒等映射。'
      : '退化问题 = 优化问题，不是容量问题。';

  const cls = step === 2 ? 'bad' : step === 1 || step === 3 ? 'good' : '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-info">
          步骤 {step + 1} / {STEPS.length}：{STEPS[step]}
        </span>
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
          下一步
        </button>
        <button onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${cls}`}>{feedback}</div>
    </div>
  );
};

export default Ch1Mod2;
