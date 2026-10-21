import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTile, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
const FEEDBACK = [
  { text: '选一个权重，把它四舍五入到最近的格点。', cls: '' },
  { text: '量出它的误差，除以该位置的 [H_F⁻¹]_qq。', cls: '' },
  { text: '其余权重沿 H⁻¹ 的对应列一起移动，输出几乎不变。', cls: 'good' },
];

export const M5Compensate: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 6; i++) {
      const dy = step >= 2 && i > 0 ? Math.sin((i / 5) * Math.PI) * (i % 2 === 0 ? -8 : 8) : 0;
      drawTile(ctx, 90 + i * 90, 80 + dy, 56, { filled: i > 0, highlight: i === 0, snap: i === 0 && step >= 1 });
    }
    if (step >= 1) {
      drawSceneLabel(ctx, 90, 70, '误差 ÷ [H⁻¹]_qq', GQ.orange, 13);
    }
    if (step >= 2) {
      ctx.strokeStyle = GQ.blue;
      ctx.lineWidth = 2.5;
      for (let i = 1; i < 6; i++) {
        const x = 90 + i * 90 + 28;
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, 80 + Math.sin((i / 5) * Math.PI) * (i % 2 === 0 ? -8 : 8));
        ctx.stroke();
      }
      drawSceneLabel(ctx, 650, 200, '沿 H⁻¹ 分摊', GQ.blue, 13);
    }
    drawLegend(ctx, 90, 240, [
      { label: '被量化', color: GQ.orange },
      { label: '补偿', color: GQ.blue },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m5-compensate" ref={ref} width={W} height={H} />
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

export default M5Compensate;
