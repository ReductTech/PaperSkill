import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, barH, mix, roundRect } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 5.2 Orthogonality prover. Three steps of Proposition 2:
// 1 shared block -> inner product negative; 2 blocks split; 3 gradients land on
// disjoint supports -> inner product exactly zero, first-order term vanishes.
const W = 1080;
const H = 280;
const STEPS = [
  { text: '共用一块预设板：两个梯度落在同一块 φ 上，内积 −0.5，一阶项把视觉损失抬高 O(η)。', cls: 'bad' },
  { text: '拆板：φ 板只归文本，ψ 板只归出图——参数所有权划清。', cls: '' },
  { text: '∂L_v/∂φ=0、∂L_t/∂ψ=0 ⇒ 内积恒为 0：一阶项根本不存在，干扰上界降到 O(η²)（命题2）。', cls: 'good' },
];

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, color: string) {
  // 照相馆预设板：纸质板身 + 板上一格预设窗
  ctx.fillStyle = SC.paper;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = mix(color, SC.bg, 0.45);
  ctx.fillRect(x + 18, y + 16, w - 36, h - 34);
  ctx.strokeStyle = mix(color, SC.shade, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 18, y + 16, w - 36, h - 34);
  ctx.fillStyle = SC.shade;
  for (const [sx, sy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, name, x + w / 2, y + h + 18, color, 13, 'center');
}

function gradBall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = SC.paper;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export const M52Ortho: React.FC<WidgetProps> = () => {
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
    clearStudio(ctx, W, H, 0.96);
    const splitX = step >= 2 ? 60 : 0;
    // phi block (text) and psi block (vision)
    block(ctx, 80 + (step >= 2 ? splitX : 0), 60, 190, 90, 'φ 文本块', SC.blue);
    if (step >= 2) {
      block(ctx, 420 + splitX, 60, 190, 90, 'ψ 图像块', SC.green);
    } else {
      block(ctx, 300, 60, 190, 90, 'φ（共用）', SC.muted);
    }
    // gradient balls land per step
    if (step === 1) {
      gradBall(ctx, 140, 100, SC.blue);
      gradBall(ctx, 200, 108, SC.green);
      label(ctx, '内积 = −0.5', 520, 108, SC.red, 14);
    } else if (step === 2) {
      gradBall(ctx, 140 + splitX, 100, SC.blue);
      gradBall(ctx, 470 + splitX, 100, SC.green);
      label(ctx, '内积 → 0', 560, 108, SC.muted, 14);
    } else {
      gradBall(ctx, 200, 100, SC.blue);
      gradBall(ctx, 530, 100, SC.green);
      label(ctx, '内积 = 0.000', 560, 108, SC.green, 14);
    }
    // term bars
    const bx = 700;
    label(ctx, '一阶', bx, 84, SC.muted, 12);
    const first = step === 3 ? 0 : 0.05;
    barH(ctx, bx + 40, 70, 240, first / 0.05, 22, first === 0 ? SC.green : SC.red);
    label(ctx, first === 0 ? '0.000' : '+0.050', bx + 288, 87, first === 0 ? SC.green : SC.red, 13);
    label(ctx, '二阶', bx, 146, SC.muted, 12);
    barH(ctx, bx + 40, 132, 240, 0.005 / 0.05, 22, SC.orange);
    label(ctx, '0.005', bx + 288, 149, SC.orange, 13);
    label(ctx, step === 3 ? '干扰上界 O(η²)' : '干扰量级 O(η)', bx + 40, 196, step === 3 ? SC.green : SC.red, 14);
    label(ctx, `步骤 ${step} / 3`, 60, 232, SC.muted, 12);
  }, [step]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <button className="chip" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
          上一步
        </button>
        <button className="chip" onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>
          {step === 3 ? '已到最后一步' : '下一步'}
        </button>
        <button className="chip" onClick={() => setStep(1)}>
          重置
        </button>
      </div>
      <div className={`feedback ${STEPS[step - 1].cls}`}>{STEPS[step - 1].text}</div>
    </div>
  );
};
export default M52Ortho;
