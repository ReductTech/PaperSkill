import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCube, drawArrow, drawBar, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const PPL = [6.57, 6.57, 5.75];
const FB = [
  { text: 'Post-RoPE：相邻通道被旋转混合，离群不再固定。', cls: 'bad' },
  { text: 'Pre-RoPE：先按通道量化，保住离群结构。', cls: '' },
  { text: '反量化后再施加 RoPE：改善 0.82 PPL。', cls: 'good' },
];
const VALS = [0.9, 0.2, 0.85, 0.18, 0.15, 0.22, 0.12, 0.2];

export const M4PreRope: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 80;
    const y0 = 200;
    VALS.forEach((v, i) => {
      const mixed = step === 0 && i % 2 === 1;
      const bh = (mixed ? 0.55 : v) * 140;
      ctx.fillStyle = v > 0.6 ? KQ.red : KQ.blue;
      ctx.fillRect(x0 + i * 64, y0 - bh, 48, bh);
      if (i < 4 && step > 0) drawArrow(ctx, x0 + i * 64 + 48, y0 - 20, x0 + (i + 1) * 64, y0 - 20, KQ.orange);
    });
    drawSceneLabel(ctx, x0, 40, step === 0 ? 'Post-RoPE（混装后压）' : 'Pre-RoPE（先压再混装）', KQ.ink, 13);
    drawBar(ctx, 720, 100, 280, 22, PPL[step] / 8, step === 2 ? KQ.green : KQ.red);
    drawSceneLabel(ctx, 720, 90, `PPL ${PPL[step]}`, KQ.ink, 12);
    drawSceneLabel(ctx, 80, 240, FB[step].text, step === 2 ? KQ.green : KQ.ink, 13);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m4-prerope" ref={ref} width={W} height={H} />
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

export default M4PreRope;
