import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSceneLabel, Feedback, Chips } from './kit-anchor';

const cases = [[.1, 0], [.1, 1], [.9, 0], [.9, 1]];
export function Zoom7b() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [p, g] = cases[caseIndex];
  const ual = 4 * p * (1 - p), bce = -g * Math.log(p) - (1 - g) * Math.log(1 - p);
  const correct = caseIndex === 0 || caseIndex === 3;
  return <div>
    <SceneCanvas aria-label={`预测概率 ${p}，真实标签 ${g}。${correct ? '方向正确' : '方向错误'}。UAL ${ual.toFixed(3)}，BCE ${bce.toFixed(3)}。`} draw={ctx => {
      clearScene(ctx, 1080, 280);
      [p, g].forEach((v, i) => {
        const gray = Math.round(v * 255); ctx.fillStyle = `rgb(${gray},${gray},${gray})`; ctx.fillRect(100 + i * 240, 75, 140, 140);
        ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.strokeRect(100 + i * 240, 75, 140, 140);
      });
      ctx.strokeStyle = correct ? C.green : C.red; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      if (correct) { ctx.moveTo(270, 143); ctx.lineTo(283, 156); ctx.lineTo(307, 128); } else { ctx.moveTo(272, 130); ctx.lineTo(302, 160); ctx.moveTo(302, 130); ctx.lineTo(272, 160); } ctx.stroke();
      [ual, bce].forEach((v, i) => {
        const x = 680 + i * 170; ctx.fillStyle = C.light; ctx.globalAlpha = .3; ctx.fillRect(x, 55, 95, 175); ctx.globalAlpha = 1;
        ctx.fillStyle = i ? C.blue : C.purple; ctx.fillRect(x, 230 - v / 3 * 175, 95, v / 3 * 175);
      });
      drawSceneLabel(ctx, '预测与标签', 200, 35); drawSceneLabel(ctx, '损失拆解', 750, 35);
    }} />
    <div className="ctrl" aria-label="选择像素算例"><Chips options={['p=0.1，背景', 'p=0.1，前景', 'p=0.9，背景', 'p=0.9，前景']} value={caseIndex} onChange={setCaseIndex} /></div>
    <div className="ctrl" aria-live="polite" style={{ justifyContent: 'space-between' }}><span>左：预测 p={p} · 右：标签 g={g}</span><span style={{ color: C.purple }}>UAL {ual.toFixed(3)}</span><span style={{ color: C.blue }}>BCE {bce.toFixed(3)}</span><strong>总损失 {(ual + bce).toFixed(3)}</strong><span>λ=1，仅用于此处算例</span></div>
    <Feedback tone={correct ? 'good' : 'bad'}>{correct ? '这次概率方向与标签一致。UAL 是 0.360，BCE 为 0.105，合计约 0.465。' : '这次很自信，但方向错了。UAL 仍是 0.360，BCE 升为 2.303，合计约 2.663。'}</Feedback>
  </div>;
}
