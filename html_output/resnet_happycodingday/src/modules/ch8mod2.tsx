import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p3';
import type { WidgetProps } from './registry';

// Ch8 M8.2: P2 stepper inside a bottleneck block — 1x1 down, 3x3 in low dim, 1x1 up.
const W = 560;
const H = 240;

const STEPS = [
  { label: '输入 256 维', note: '高维特征图到达瓶颈块入口。', cls: '' },
  { label: '1×1 降维到 64', note: '第一个 1×1 卷积把通道压到 64。', cls: '' },
  { label: '3×3 在 64 维工作', note: '3×3 只在低维空间里做重活——这就是省参数的机关。', cls: 'good' },
  { label: '1×1 升回 256 维', note: '最后 1×1 把维度还原；若把恒等换成投影，复杂度会翻倍。', cls: 'good' },
];

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const boxes = [
        { x: 70, w: 100, label: '1×1, 256→64', dim: 256, color: C.blue },
        { x: 230, w: 100, label: '3×3, 64', dim: 64, color: C.purple },
        { x: 390, w: 100, label: '1×1, 64→256', dim: 256, color: C.blue },
      ];
      for (let i = 0; i < 3; i++) {
        const b = boxes[i];
        const active = i === s.step - 1;
        const done = i < s.step - 1;
        ctx.strokeStyle = active ? b.color : done ? C.green : C.border;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.10)' : C.white;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.fillRect(b.x, 80, b.w, 44);
        ctx.strokeRect(b.x, 80, b.w, 44);
        ctx.fillStyle = active ? b.color : done ? C.green : C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x + b.w / 2, 108);
        // dimension block under box
        ctx.fillStyle = active ? b.color : C.border;
        ctx.fillRect(b.x + b.w / 2 - 14, 140, 28, clamp(b.dim / 256, 0.15, 1) * 60);
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(`${b.dim}`, b.x + b.w / 2, 216);
      }
      // arrows
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      for (const ax of [180, 340]) {
        ctx.beginPath();
        ctx.moveTo(ax, 102);
        ctx.lineTo(ax + 42, 102);
        ctx.stroke();
      }
      drawSceneLabel(ctx, STEPS[s.step].label, W / 2, 24, C.blue, 'center');
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

  const st = STEPS[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-info">
          步骤 {step + 1} / {STEPS.length}
        </span>
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
          下一步
        </button>
        <button onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${st.cls}`}>{st.note}</div>
    </div>
  );
};

export default Ch8Mod2;
