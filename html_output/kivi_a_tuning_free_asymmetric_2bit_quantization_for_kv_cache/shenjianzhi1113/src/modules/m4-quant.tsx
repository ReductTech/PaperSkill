import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
const VALS = [0.12, 0.18, 0.15, 0.9, 0.2, 0.16, 0.14, 0.11];
const FB = [
  { text: '一组 8 个值，含一个离群值。', cls: '' },
  { text: '非对称：z = min，s = (max − min) / (2^B − 1)。', cls: '' },
  { text: '取整后反量化：X\' = Q(X)·s + z；离群值仍占大范围。', cls: 'good' },
];

export const M4Quant: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const mn = Math.min(...VALS);
  const mx = Math.max(...VALS);
  const s = (mx - mn) / 3;

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 90;
    const y0 = 200;
    const bw = 54;
    VALS.forEach((v, i) => {
      const bh = (v / 1) * 140;
      ctx.fillStyle = v > 0.5 ? KV.red : KV.blue;
      ctx.fillRect(x0 + i * 62, y0 - bh, bw, bh);
      const label = step === 0 ? v.toFixed(2) : String(Math.round((v - mn) / s));
      drawSceneLabel(ctx, x0 + i * 62 + 6, y0 + 18, label, KV.ink, 12);
    });
    ctx.strokeStyle = KV.orange;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x0 - 10, y0 - (mn / 1) * 140);
    ctx.lineTo(x0 + 8 * 62, y0 - (mn / 1) * 140);
    ctx.moveTo(x0 - 10, y0 - (mx / 1) * 140);
    ctx.lineTo(x0 + 8 * 62, y0 - (mx / 1) * 140);
    ctx.stroke();
    ctx.setLineDash([]);
    if (step >= 1) drawSceneLabel(ctx, 640, 90, `z = ${mn.toFixed(2)}`, KV.orange, 14);
    if (step >= 1) drawSceneLabel(ctx, 640, 120, `s = ${s.toFixed(3)}`, KV.orange, 14);
    if (step === 2) drawSceneLabel(ctx, 640, 160, 'B = 2 → 4 个档位', KV.green, 13);
    drawSceneLabel(ctx, 90, 40, step === 0 ? '原始 FP16' : '量化后整数', KV.ink, 13);
    drawLegend(ctx, 640, 230, [
      { label: '普通', color: KV.blue },
      { label: '离群', color: KV.red },
      { label: 'min/max', color: KV.orange },
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
