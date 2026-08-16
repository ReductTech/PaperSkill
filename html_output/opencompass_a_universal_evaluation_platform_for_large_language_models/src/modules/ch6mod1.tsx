import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch6 M6.1 — "切分与并行调度" (P2 step-through, hybrid view).
// One big exam stack is cut into equal atomic tasks, run in parallel, then summarized;
// the final step contrasts the current serial Infer→Eval with the future pipeline.
const W = 560;
const H = 230;
const STEPS = ['完整任务', '切分为原子任务', 'Runner 并行分发', '结果汇总', '串行 vs 流水线'];
const DESC = [
  '整个评测是一大摞待批改的试卷（完整的模型×数据集任务）。',
  'Partitioner 把它切成相互独立的原子子任务，每个任务一份独立输出。',
  'Runner 屏蔽集群异构，把子任务并行分发给本地进程或集群作业。',
  '并行跑完后，各子任务的结果被统一汇总、进入评测阶段。',
  '当前每个数据集内 Infer 与 Eval 串行；未来目标是跨数据集的流水线并行，进一步压缩总时间。',
];

export const Ch6Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: DESC[0], cls: '' });

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
      clear(ctx, W, H);
      const step = s.step;

      if (step === 4) {
        // 串行 vs 流水线并行（论文 Future Works）
        const segs = ['推理A', '评测A', '推理B', '评测B'];
        const sw = 90;
        label(ctx, '当前 · 串行（Infer → Eval）', 40, 66, 13, C.red, 'left', 700);
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * sw;
          ctx.fillStyle = i % 2 ? C.red : 'rgba(196, 63, 82, 0.6)';
          rr(ctx, x, 80, sw - 8, 30, 4);
          ctx.fill();
          label(ctx, segs[i], x + (sw - 8) / 2, 95, 11, '#fff', 'center', 700);
        }
        label(ctx, '评测 A 等推理 A 全部完成', 480, 95, 11, C.red, 'center', 700);
        label(ctx, '未来 · 流水线并行', 40, 138, 13, C.green, 'left', 700);
        for (let i = 0; i < 2; i++) {
          const x = 40 + i * sw;
          ctx.fillStyle = C.blue;
          rr(ctx, x, 152, sw - 8, 26, 4);
          ctx.fill();
          label(ctx, `推理${['A', 'B'][i]}`, x + (sw - 8) / 2, 165, 11, '#fff', 'center', 700);
        }
        for (let i = 0; i < 2; i++) {
          const x = 40 + sw + i * sw;
          ctx.fillStyle = C.green;
          rr(ctx, x, 184, sw - 8, 26, 4);
          ctx.fill();
          label(ctx, `评测${['A', 'B'][i]}`, x + (sw - 8) / 2, 197, 11, '#fff', 'center', 700);
        }
        label(ctx, '推理 B 与评测 A 重叠 → 总时间更短', 480, 165, 11, C.green, 'center', 700);
        return;
      }

      // Life view (left)
      const base = 200;
      if (step === 0) {
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#f3ead2' : '#efe3c4';
          ctx.fillRect(50, base - 14 - i * 12, 120, 12);
        }
        ctx.strokeStyle = C.axis;
        ctx.strokeRect(50, base - 14 - 5 * 12, 120, 14 + 5 * 12);
        label(ctx, '一摞完整试卷', 110, base - 90, 12, C.ink, 'center', 700);
      } else if (step === 1) {
        for (let k = 0; k < 4; k++) {
          for (let i = 0; i < 2; i++) {
            ctx.fillStyle = i % 2 ? '#f3ead2' : '#efe3c4';
            ctx.fillRect(24 + k * 44, base - 14 - i * 12, 40, 12);
          }
          ctx.strokeStyle = C.axis;
          ctx.strokeRect(24 + k * 44, base - 26, 40, 26);
        }
        label(ctx, '切成等份原子任务', 110, base - 56, 12, C.green, 'center', 700);
      } else if (step === 2) {
        for (let k = 0; k < 4; k++) {
          const x = 24 + k * 44;
          ctx.fillStyle = C.blue;
          ctx.fillRect(x, base - 16, 40, 12);
          ctx.fillStyle = C.green;
          ctx.fillRect(x, base - 12 - ((performance.now() / 400 + k) % 1) * 30, 40, 4);
        }
        label(ctx, '并行批改中', 110, base - 60, 12, C.blue, 'center', 700);
      } else {
        ctx.fillStyle = C.green;
        ctx.fillRect(60, base - 26, 100, 26);
        label(ctx, '结果汇总', 110, base - 13, 12, '#fff', 'center', 700);
      }
      // Technical view (right)
      label(ctx, '并行度', 380, 30, 12, C.ink, 'center', 700);
      for (let k = 0; k < 4; k++) {
        const y = 48 + k * 34;
        ctx.fillStyle = C.axis;
        ctx.fillRect(320, y, 200, 18);
        const frac = step === 2 ? ((performance.now() / 500 + k) % 1) : step >= 3 ? 1 : step === 1 ? 0.15 : 0.05;
        ctx.fillStyle = step >= 2 ? C.green : C.blue;
        ctx.fillRect(320, y, 200 * Math.min(1, frac), 18);
        label(ctx, `任务 ${k + 1}`, 300, y + 9, 11, C.muted, 'right');
      }
      label(ctx, '墙钟时间大幅缩短', 420, 205, 12, C.green, 'center', 700);
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (i: number) => {
    const s = Math.max(0, Math.min(4, i));
    stateRef.current.step = s;
    setStep(s);
    setFeedback({ text: DESC[s], cls: s >= 2 ? 'good' : '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => goto(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步 · {STEPS[step]}
        </span>
        <button className="tiny" onClick={() => goto(step + 1)} disabled={step === 4}>
          下一步
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
