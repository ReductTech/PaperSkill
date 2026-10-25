import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPole, drawRock, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
const FEEDBACK = [
  { text: '原始：Y = X·W。', cls: '' },
  { text: '激活除以 s、权重乘以 s：X̂ = X/s，Ŵ = sW。', cls: '' },
  { text: 'Y 不变；s 可以离线融进前一层（LayerNorm/线性层），不增加内核调用。', cls: 'good' },
];

export const M4Math: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPole(ctx, 80, 90, 360, 0, { leftRocks: step >= 1 ? 4 : 4, rightRocks: step >= 1 ? 4 : 2 });
    if (step >= 1) {
      for (let i = 0; i < 3; i++) drawRock(ctx, 180 + i * 30, 60 - i * 4, 7, { outlier: false });
    }
    drawSceneLabel(ctx, 80, 70, step === 0 ? 'X' : 'X/s', SQ.blue, 14);
    drawSceneLabel(ctx, 440, 70, step === 0 ? 'W' : 'sW', SQ.blue, 14);
    drawSceneLabel(ctx, 700, 90, step === 0 ? 'Y = X·W' : 'Y 不变', step === 2 ? SQ.green : SQ.muted, 16);
    drawLegend(ctx, 700, 200, [
      { label: '前筐', color: SQ.blue },
      { label: '后筐', color: SQ.orange },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m4-math" ref={ref} width={W} height={H} />
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

export default M4Math;
