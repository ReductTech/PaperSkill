import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
const M = [
  [0.9, -0.3, 0.5, -0.1],
  [-0.7, 0.2, -0.4, 0.8],
  [0.1, -0.9, 0.6, -0.2],
  [-0.5, 0.4, 0.3, -0.8],
];
const FB = [
  { text: 'FP16 权重：每个数 16 位。', cls: '' },
  { text: '对称量化：S = max|x|，round 后截断到 b 位。', cls: '' },
  { text: '权重静态 S；激活动态每 token 一个 S；分组则每组一个 S。', cls: 'good' },
];

export const M4Quant: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const maxAbs = 0.9;

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const gx = 80;
    const gy = 52;
    const cell = 42;
    M.forEach((row, r) => {
      row.forEach((v, c) => {
        const shown = step === 0 ? v.toFixed(2) : String(Math.round((v / maxAbs) * 127));
        const hot = step === 2 && r === 1;
        ctx.fillStyle = hot ? 'rgba(47,93,138,0.18)' : ZQ.card;
        ctx.strokeStyle = hot ? ZQ.blue : ZQ.border;
        ctx.lineWidth = hot ? 2.5 : 1.2;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell - 4, cell - 4);
        ctx.strokeRect(gx + c * cell, gy + r * cell, cell - 4, cell - 4);
        ctx.fillStyle = ZQ.ink;
        ctx.font = '12px "Cascadia Code", monospace';
        ctx.fillText(shown, gx + c * cell + 6, gy + r * cell + 26);
      });
    });
    drawSceneLabel(ctx, gx, gy - 12, step === 0 ? 'FP16' : step === 1 ? 'Int8 全局 S' : 'Int8 逐 token S', ZQ.ink, 13);
    if (step >= 1) drawSceneLabel(ctx, 330, 100, 'S = max|x| / 127', ZQ.blue, 14);
    if (step === 2) {
      for (let r = 0; r < 4; r++) drawSceneLabel(ctx, 330, 132 + r * 22, `token ${r + 1}: S${r + 1}`, ZQ.blue, 12);
    }
    drawLegend(ctx, 700, 240, [
      { label: 'FP16', color: ZQ.blue },
      { label: 'Int8', color: ZQ.green },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m4-quant" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 3 步
        </span>
        <button className="tiny" onClick={() => setStep((v) => Math.min(2, v + 1))} disabled={step === 2}>
          下一步 →
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${FB[step].cls}`}>{FB[step].text}</div>
    </div>
  );
};

export default M4Quant;
