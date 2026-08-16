import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch7 M7.1 — "一次任务的执行：Infer → Eval" (P2 step-through, technical view).
// Each step now shows a visual, lightly animated scene instead of a text-only detail.
const W = 560;
const H = 230;
const STEPS = ['实例化模型', '构造 prompt', '推理 dump', '后处理', 'Evaluator 打分'];
const DESC = [
  '按配置实例化模型：支持 API、HuggingFace 原生，或 vLLM/LMDeploy 加速部署。',
  'Retriever 检索示例 + Template 构造 prompt（few-shot / zero-shot / ChatML 多轮）。',
  'Inferencer 驱动模型前向推理，生成预测并 dump 落盘。',
  'PostProcessor 对参考答案与预测做格式归一、冗余过滤。',
  'Evaluator 按预配指标（Accuracy / ROUGE / BLEU…）计算分数并生成结果。',
];

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, text: string): void {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  label(ctx, text, x + w / 2, y + h / 2, 12, '#fff', 'center', 700);
}

export const Ch7Mod1: React.FC<WidgetProps> = () => {
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
      // Top: five pipeline nodes (progress indicator).
      const nodes = ['模型', 'prompt', '推理', '后处理', '打分'];
      const xs = [24, 130, 236, 342, 448];
      for (let i = 0; i < 5; i++) {
        const active = i === s.step;
        ctx.fillStyle = active ? C.blue : '#fff';
        rr(ctx, xs[i], 16, 96, 32, 8);
        ctx.fill();
        ctx.strokeStyle = active ? C.blue : C.axis;
        rr(ctx, xs[i], 16, 96, 32, 8);
        ctx.stroke();
        label(ctx, nodes[i], xs[i] + 48, 32, 12, active ? '#fff' : C.ink, 'center', 700);
        if (i < 4) {
          ctx.strokeStyle = active ? C.blue : C.axis;
          ctx.beginPath();
          ctx.moveTo(xs[i] + 96, 32);
          ctx.lineTo(xs[i + 1], 32);
          ctx.stroke();
        }
      }

      const t = performance.now() / 1000;
      const phase = (t * 0.8) % 1;

      if (s.step === 0) {
        // 实例化模型：模型盒浮现，下方三种接入方式。
        const pulse = (Math.sin(t * 4) + 1) / 2;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2 + pulse;
        rr(ctx, 200, 88, 160, 66, 8);
        ctx.stroke();
        ctx.lineWidth = 1;
        label(ctx, '模型', 280, 112, 16, C.blue, 'center', 800);
        label(ctx, '实例化中…', 280, 138, 11, C.muted, 'center');
        const modes = ['HuggingFace', 'API', 'vLLM / LMDeploy'];
        for (let i = 0; i < 3; i++) {
          box(ctx, 118 + i * 122, 178, 108, 26, i === 1 ? C.orange : C.green, modes[i]);
        }
      } else if (s.step === 1) {
        // 构造 prompt：Retriever 取示例 + Template 填问题 → 合并为完整 prompt。
        box(ctx, 24, 78, 118, 38, C.green, 'Retriever');
        ctx.fillStyle = '#fff';
        rr(ctx, 24, 128, 118, 44, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 24, 128, 118, 44, 6);
        ctx.stroke();
        label(ctx, '示例：2+2=?', 83, 145, 11, C.ink, 'center', 600);
        label(ctx, '答：4', 83, 162, 11, C.ink, 'center', 600);
        box(ctx, 176, 78, 118, 38, C.blue, 'Template');
        ctx.fillStyle = '#fff';
        rr(ctx, 176, 128, 118, 44, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 176, 128, 118, 44, 6);
        ctx.stroke();
        label(ctx, '问题：3+5=?', 235, 150, 11, C.ink, 'center', 600);
        ctx.strokeStyle = C.axis;
        ctx.beginPath();
        ctx.moveTo(142, 97);
        ctx.lineTo(176, 97);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(142, 150);
        ctx.lineTo(176, 150);
        ctx.stroke();
        ctx.fillStyle = C.green;
        rr(ctx, 330, 84, 210, 88, 8);
        ctx.fill();
        label(ctx, '完整 prompt', 435, 108, 12, '#fff', 'center', 700);
        label(ctx, '[示例] + [问题]', 435, 132, 11, '#fff', 'center', 600);
        label(ctx, '→ 交给模型', 435, 156, 11, '#fff', 'center', 600);
      } else if (s.step === 2) {
        // 推理 dump：模型 → 流动的 token 点 → predictions 文件。
        box(ctx, 24, 96, 110, 60, C.blue, '模型');
        for (let i = 0; i < 5; i++) {
          const p = (phase + i / 5) % 1;
          const x = 150 + p * 150;
          const y = 126 + Math.sin(p * Math.PI * 2) * 9;
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        rr(ctx, 320, 88, 210, 76, 8);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 320, 88, 210, 76, 8);
        ctx.stroke();
        label(ctx, 'predictions.json', 425, 112, 12, C.green, 'center', 700);
        label(ctx, '{ answer: "..." }', 425, 138, 11, C.muted, 'center', 600);
      } else if (s.step === 3) {
        // 后处理：脏输出 → 归一化过滤 → 干净答案（与参考答案对齐）。
        ctx.fillStyle = '#fff';
        rr(ctx, 20, 88, 150, 72, 8);
        ctx.fill();
        ctx.strokeStyle = C.red;
        rr(ctx, 20, 88, 150, 72, 8);
        ctx.stroke();
        label(ctx, '答案： 42  ', 95, 118, 13, C.red, 'center', 700);
        label(ctx, '（含冗余/格式）', 95, 140, 11, C.muted, 'center');
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(176, 124);
        ctx.lineTo(214, 124);
        ctx.stroke();
        ctx.lineWidth = 1;
        label(ctx, '归一化', 195, 106, 11, C.orange, 'center');
        ctx.fillStyle = '#fff';
        rr(ctx, 222, 88, 120, 72, 8);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 222, 88, 120, 72, 8);
        ctx.stroke();
        label(ctx, '42', 282, 124, 20, C.green, 'center', 800);
        ctx.fillStyle = '#fff';
        rr(ctx, 372, 88, 170, 72, 8);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        rr(ctx, 372, 88, 170, 72, 8);
        ctx.stroke();
        label(ctx, '参考答案', 457, 110, 11, C.blue, 'center', 700);
        label(ctx, '42', 457, 134, 18, C.blue, 'center', 800);
      } else {
        // 打分：Evaluator 对比预测与参考 → 分数。
        box(ctx, 20, 100, 110, 56, C.purple, 'Evaluator');
        ctx.fillStyle = '#fff';
        rr(ctx, 168, 78, 120, 40, 6);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 168, 78, 120, 40, 6);
        ctx.stroke();
        label(ctx, '预测：42', 228, 98, 12, C.green, 'center', 700);
        ctx.fillStyle = '#fff';
        rr(ctx, 168, 128, 120, 40, 6);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        rr(ctx, 168, 128, 120, 40, 6);
        ctx.stroke();
        label(ctx, '参考：42', 228, 148, 12, C.blue, 'center', 700);
        ctx.fillStyle = C.green;
        rr(ctx, 330, 98, 210, 70, 8);
        ctx.fill();
        label(ctx, 'score = 0.86', 435, 133, 18, '#fff', 'center', 800);
      }
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
    setFeedback({ text: DESC[s], cls: s === 4 ? 'good' : '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => goto(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 5 步 · {STEPS[step]}
        </span>
        <button className="tiny" onClick={() => goto(step + 1)} disabled={step === 4}>
          下一步
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
