import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
const M = [
  [0.9, -0.3, 0.5, -0.1],
  [-0.7, 0.2, -0.4, 0.8],
  [0.1, -0.9, 0.6, -0.2],
  [-0.5, 0.4, 0.3, -0.8],
];
const FEEDBACK = [
  { text: 'FP16 矩阵：每个数都要 16 位。', cls: '' },
  { text: 'absmax：用整张量最大绝对值定一个全局缩放，量化到 Int8。', cls: '' },
  { text: '向量级：每行/每列各一个缩放，反缩放用外积；最多撑到 2.7B。', cls: 'good' },
];

export const M2Quant: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const maxAbs = 0.9;

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const gx = 70;
    const gy = 50;
    const cell = 42;
    M.forEach((row, r) => {
      row.forEach((v, c) => {
        const shown = step === 0 ? v.toFixed(2) : String(Math.round((v / maxAbs) * 127));
        const active = step === 2 && c === 1;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.18)' : LI.card;
        ctx.strokeStyle = active ? LI.blue : LI.border;
        ctx.lineWidth = active ? 2.5 : 1.2;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell - 4, cell - 4);
        ctx.strokeRect(gx + c * cell, gy + r * cell, cell - 4, cell - 4);
        ctx.fillStyle = LI.ink;
        ctx.font = '12px "Cascadia Code", monospace';
        ctx.fillText(shown, gx + c * cell + 6, gy + r * cell + 26);
      });
    });
    drawSceneLabel(ctx, gx, gy - 10, step === 0 ? 'FP16' : step === 1 ? 'Int8 全局缩放' : 'Int8 逐列缩放', LI.ink, 13);
    if (step === 1) drawSceneLabel(ctx, 300, 100, 'scale = max|X| / 127', LI.blue, 14);
    if (step === 2) {
      for (let c = 0; c < 4; c++) {
        drawSceneLabel(ctx, gx + c * cell + 6, gy + 4 * cell + 22, `s${c + 1}`, LI.blue, 12);
      }
      drawSceneLabel(ctx, 300, 100, '每列一个缩放', LI.blue, 14);
    }
    drawLegend(ctx, 640, 240, [
      { label: 'FP16', color: LI.blue },
      { label: 'Int8', color: LI.green },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m2-quant" ref={ref} width={W} height={H} />
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

export default M2Quant;
