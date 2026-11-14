import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, slip, filmChip, label, lockTag, arrowLine, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 6.1 Forward-pass stepper. Five stages of one forward pass (Section 4.2):
// enter -> split by modality -> V-Adapter (Eq 5) -> T-MoE (Eq 8) -> reassemble.
const W = 1080;
const H = 320;
const STEPS = [
  { text: '混排序列 H 进入：字条与底片格交错排在同一条队列里。', cls: '' },
  { text: '按模态拆分：字条汇成 H^t，底片格汇成 H^i——拆的是 token，不是层。', cls: '' },
  { text: 'H^i 走 V-Adapter（式5）：单支低秩预设 ΔW=(α/r)BA。', cls: '' },
  { text: 'H^t 走 T-MoE（式8）：门控给每个 token 分配 4 支专家预设的加权。', cls: '' },
  { text: '两股输出按原位置拼回 Ĥ；骨干全程冻结，推理时不区分任务身份。', cls: 'good' },
];

export const M61Forward: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    clearStudio(ctx, W, H, 0.97);
    // frozen backbone band on top
    ctx.fillStyle = SC.shade;
    ctx.fillRect(20, 20, W - 40, 30);
    lockTag(ctx, 40, 24);
    // stage 1: interleaved sequence
    const seqY = 78;
    for (let i = 0; i < 8; i++) {
      const x = 40 + i * 30;
      if (i % 2 === 0) filmChip(ctx, x, seqY, 24, step === 1 ? SC.green : mix(SC.green, SC.bg, 0.55));
      else slip(ctx, x, seqY, 24, 36, step === 1 ? SC.blue : mix(SC.blue, SC.bg, 0.55));
    }
    label(ctx, 'H', 290, seqY + 24, SC.ink, 14);
    // split node + two streams
    const splitDone = step >= 2;
    const nodeX = 340;
    ctx.strokeStyle = splitDone ? SC.ink : SC.shade;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nodeX, 160, 16, 0, Math.PI * 2);
    ctx.stroke();
    label(ctx, '拆', nodeX, 165, splitDone ? SC.ink : SC.muted, 12, 'center');
    // text stream (upper) and image stream (lower)
    const upY = 128;
    const loY = 216;
    const upColor = step >= 4 ? SC.blue : mix(SC.blue, SC.bg, 0.5);
    const loColor = step >= 3 ? SC.green : mix(SC.green, SC.bg, 0.5);
    arrowLine(ctx, nodeX + 20, 152, 470, upY, upColor, step >= 4 ? 3 : 2);
    arrowLine(ctx, nodeX + 20, 168, 470, loY, loColor, step >= 3 ? 3 : 2);
    // T-MoE block (upper)
    ctx.fillStyle = step >= 4 ? mix(SC.blue, SC.paper, 0.7) : SC.paper;
    ctx.fillRect(480, upY - 30, 250, 62);
    ctx.strokeStyle = step >= 4 ? SC.blue : SC.shade;
    ctx.lineWidth = step >= 4 ? 2.5 : 1.5;
    ctx.strokeRect(480, upY - 30, 250, 62);
    label(ctx, 'T-MoE', 605, upY - 8, step >= 4 ? SC.blue : SC.muted, 12, 'center');
    for (let i = 0; i < 4; i++) {
      const wx = 494 + i * 58;
      const pw = [0.85, 0.55, 0.3, 0.2][i];
      ctx.fillStyle = step >= 4 ? mix(SC.purple, SC.bg, 0.78 - pw * 0.6) : mix(SC.purple, SC.bg, 0.7);
      ctx.fillRect(wx, upY + 2, 46, 22);
      ctx.strokeStyle = SC.shade;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, upY + 2, 46, 22);
    }
    // V-Adapter block (lower)
    ctx.fillStyle = step >= 3 ? mix(SC.green, SC.paper, 0.7) : SC.paper;
    ctx.fillRect(480, loY - 16, 250, 44);
    ctx.strokeStyle = step >= 3 ? SC.green : SC.shade;
    ctx.lineWidth = step >= 3 ? 2.5 : 1.5;
    ctx.strokeRect(480, loY - 16, 250, 44);
    label(ctx, 'V-Adapter', 605, loY + 10, step >= 3 ? SC.green : SC.muted, 12, 'center');
    // merge node and output
    arrowLine(ctx, 730, upY, 800, 160, step >= 5 ? SC.blue : SC.shade, 2);
    arrowLine(ctx, 730, loY, 800, 160, step >= 5 ? SC.green : SC.shade, 2);
    ctx.strokeStyle = step >= 5 ? SC.ink : SC.shade;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(816, 160, 16, 0, Math.PI * 2);
    ctx.stroke();
    label(ctx, '拼', 816, 165, step >= 5 ? SC.ink : SC.muted, 12, 'center');
    for (let i = 0; i < 6; i++) {
      const x = 850 + i * 30;
      const on = step >= 5;
      if (i % 2 === 0) filmChip(ctx, x, 148, 24, on ? SC.green : mix(SC.green, SC.bg, 0.6));
      else slip(ctx, x, 142, 24, 36, on ? SC.blue : mix(SC.blue, SC.bg, 0.6));
    }
    label(ctx, 'Ĥ', 1040, 172, step >= 5 ? SC.ink : SC.muted, 14);
    // step progress dots (marks, not prose)
    for (let i = 1; i <= 5; i++) {
      ctx.fillStyle = i <= step ? SC.blue : SC.ground;
      ctx.beginPath();
      ctx.arc(60 + i * 28, 288, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [step]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <button className="chip" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
          上一步
        </button>
        <button className="chip" onClick={() => setStep(Math.min(5, step + 1))} disabled={step === 5}>
          {step === 5 ? '已到最后一步' : '下一步'}
        </button>
        <button className="chip" onClick={() => setStep(1)}>
          重置
        </button>
        <label>
          进度 <span className="val">{step} / 5</span>
        </label>
      </div>
      <div className={`feedback ${STEPS[step - 1].cls}`}>{STEPS[step - 1].text}</div>
    </div>
  );
};
export default M61Forward;
