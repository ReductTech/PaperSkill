import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const IDX: number[][] = [
  [0, 2, 3, 1],
  [1, 0, 2, 3],
  [3, 3, 1, 0],
  [2, 1, 0, 2],
];
const GRAD: number[][] = [
  [0.5, -0.3, 0.8, 0.2],
  [-0.6, 0.4, -0.2, 0.9],
  [0.3, 0.7, -0.5, 0.1],
  [-0.4, 0.6, 0.2, -0.7],
];
const COLORS = [DC.blue, DC.green, DC.orange, DC.purple];

const FEEDBACK = [
  '每个连接各自有一个梯度，颜色表示它属于哪个中心。',
  '把同一索引的梯度相加：同一簇共用一个和。',
  '用这个和对中心值做一次梯度更新，所有成员一起变好。',
];

export const M7Gradient: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const sums = [0, 0, 0, 0];
  IDX.flat().forEach((v, i) => {
    const r = Math.floor(i / 4);
    const c = i % 4;
    sums[v] += GRAD[r][c];
  });

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawSceneLabel(ctx, 60, 44, '梯度矩阵', DC.ink, 14);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = IDX[r][c];
        ctx.fillStyle = COLORS[v];
        ctx.globalAlpha = step === 0 ? 0.85 : 0.35;
        ctx.fillRect(60 + c * 70, 60 + r * 48, 62, 42);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '13px "Cascadia Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(GRAD[r][c].toFixed(1), 60 + c * 70 + 31, 86 + r * 48);
        ctx.textAlign = 'left';
      }
    }
    drawSceneLabel(ctx, 400, 44, '中心梯度累加', DC.ink, 14);
    const maxAbs = Math.max(...sums.map(Math.abs), 1);
    sums.forEach((s, j) => {
      const y = 70 + j * 44;
      const ratio = (Math.abs(s) / maxAbs) * (step >= 1 ? 1 : 0.15);
      drawBar(ctx, 400, y, 300, 20, ratio, COLORS[j]);
      drawSceneLabel(ctx, 710, y + 15, `${s.toFixed(1)}`, COLORS[j], 13);
    });
    if (step === 2) {
      drawSceneLabel(ctx, 400, 250, '中心值已更新', DC.green, 14);
    }
  }, W, H);

  return (
    <div>
      <canvas id="cv-m7-gradient" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 3 步
        </span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={step === 2}>
          下一步 →
        </button>
      </div>
      <div className="feedback">{FEEDBACK[step]}</div>
    </div>
  );
};

export default M7Gradient;
