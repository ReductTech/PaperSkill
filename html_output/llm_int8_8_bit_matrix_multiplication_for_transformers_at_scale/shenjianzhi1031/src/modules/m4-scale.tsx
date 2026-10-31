import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasin, drawGarment, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
const SIZES = ['125M', '1.3B', '2.7B', '6.7B', '13B'];
const FP32 = [25.65, 15.91, 14.43, 13.30, 12.45];
const VEC = [35.84, 16.82, 14.98, 14.13, 16.48];
const LLM = [25.83, 15.93, 14.44, 13.24, 12.45];

export const M4Scale: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const big = idx >= 3;
    drawBasin(ctx, 60, 70, 260, 130, { fill: 0.7 });
    for (let i = 0; i < 5; i++) drawGarment(ctx, 80 + (i % 3) * 78, 90 + Math.floor(i / 3) * 44, 56, 36, {});
    if (big) drawGarment(ctx, 130, 58, 100, 66, { big: true });
    drawSceneLabel(ctx, 60, 60, SIZES[idx], LI.ink, 14);
    // curve
    const x0 = 520;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 60;
    ctx.strokeStyle = LI.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    const px = (i: number) => x0 + (i / (SIZES.length - 1)) * (x1 - x0);
    const py = (v: number) => y0 - ((v - 10) / 30) * (y0 - y1);
    const drawCurve = (vals: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      vals.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.stroke();
    };
    drawCurve(FP32, LI.purple);
    drawCurve(VEC, LI.red);
    drawCurve(LLM, LI.green);
    ctx.fillStyle = LI.orange;
    ctx.beginPath();
    ctx.arc(px(idx), py(VEC[idx]), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px(idx), py(LLM[idx]), 5, 0, Math.PI * 2);
    ctx.fill();
    drawLegend(ctx, x0, 250, [
      { label: '32 位', color: LI.purple },
      { label: 'vector-wise', color: LI.red },
      { label: 'LLM.int8', color: LI.green },
    ]);
  }, W, H);

  const cls = idx >= 3 ? 'bad' : 'good';
  const text =
    idx < 3
      ? '向量级还撑得住。'
      : `到 ${SIZES[idx]}：离群值出现，vector-wise 困惑度 ${VEC[idx]}，LLM.int8 仍 ${LLM[idx]}。`;

  return (
    <div>
      <canvas id="cv-m4-scale" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          模型规模 <span className="val">{SIZES[idx]}</span>
        </label>
        <input type="range" min={0} max={SIZES.length - 1} value={idx} onChange={(e) => setIdx(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M4Scale;
