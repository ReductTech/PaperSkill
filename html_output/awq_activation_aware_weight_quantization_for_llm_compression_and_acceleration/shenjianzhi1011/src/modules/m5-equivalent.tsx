import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFader, drawGrid, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const S = [1, 2, 1.5, 1];
const FEEDBACK = [
  { text: '原始：y = W x，四条通道一起参与。', cls: '' },
  { text: '把显著通道的权重放大 s 倍：w → w·s。', cls: '' },
  { text: '输出 y 不变，但显著权重的相对量化误差变小了。', cls: 'good' },
];

export const M5Equivalent: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: 4 faders
    S.forEach((base, i) => {
      const salient = i === 0;
      const level = step === 0 ? base * 0.4 : salient ? base * 0.4 + 0.3 : base * 0.4;
      drawFader(ctx, 90 + i * 70, 40, 150, Math.min(1, level), { salient: salient && step >= 1 });
    });
    drawSceneLabel(ctx, 90, 30, '通道', AQ.ink, 13);
    // right: W grid + scale marks + output
    drawGrid(ctx, 520, 60, 900, 200, 4, 4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const salient = c === 0;
        ctx.fillStyle = salient && step >= 1 ? AQ.orange : step >= 1 && salient ? AQ.orange : AQ.blue;
        ctx.globalAlpha = salient && step >= 1 ? 1 : 0.35;
        ctx.fillRect(524 + c * 95, 64 + r * 35, 88, 30);
        ctx.globalAlpha = 1;
      }
    }
    drawSceneLabel(ctx, 520, 50, 'W', AQ.ink, 14);
    drawSceneLabel(ctx, 930, 130, step === 2 ? 'y 不变' : 'y = W x', step === 2 ? AQ.green : AQ.muted, 15);
    if (step === 2) drawSceneLabel(ctx, 930, 160, '误差↓', AQ.green, 14);
    drawLegend(ctx, 520, 240, [
      { label: '显著', color: AQ.orange },
      { label: '其他', color: AQ.blue },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m5-equivalent" ref={ref} width={W} height={H} />
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
      <div className={`feedback ${FEEDBACK[step].cls}`}>{FEEDBACK[step].text}</div>
    </div>
  );
};

export default M5Equivalent;
