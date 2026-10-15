import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawSample, drawSceneLabel, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
const FEEDBACK = [
  { text: '先载入一个 Transformer 块（6 层）。', cls: '' },
  { text: '用 128 段 2048 token 的通用文本跑一遍，收集每层输入 X。', cls: '' },
  { text: '用输入累加 Hessian：H = 2XXᵀ，并加上阻尼 λI。', cls: '' },
  { text: '这一层的「地面软硬」就准备好了，可以开始逐列铺砖。', cls: 'good' },
];

export const M2Calib: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPath(ctx, 50, 80, 8, 44, 10, (i) => ({ filled: i < step * 2, highlight: step >= 3 }));
    // softness shading under the path
    if (step >= 3) {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? GQ.orange : GQ.stoneEdge;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(50 + i * 54, 130, 44, 8);
        ctx.globalAlpha = 1;
      }
    }
    drawSample(ctx, 50 + (step / 3) * 500, 30, 64, 32);
    // Hessian grid
    const gx = 620;
    const gy = 60;
    const cell = 22;
    const filled = Math.round((step / 3) * 60);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const idx = r * 6 + c;
        ctx.fillStyle = idx < filled ? GQ.blue : GQ.border;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell - 2, cell - 2);
      }
    }
    drawSceneLabel(ctx, gx, gy - 8, 'Hessian', GQ.ink, 13);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m2-calib" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 4 步
        </span>
        <button className="tiny" onClick={() => setStep((v) => Math.min(3, v + 1))} disabled={step === 3}>
          下一步 →
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${FEEDBACK[step].cls}`}>{FEEDBACK[step].text}</div>
    </div>
  );
};

export default M2Calib;
