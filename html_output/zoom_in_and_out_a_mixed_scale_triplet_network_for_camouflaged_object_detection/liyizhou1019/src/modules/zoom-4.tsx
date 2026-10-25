import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawLeaf, drawSceneLabel, drawLegend, Feedback } from './kit-anchor';

export function Zoom4() {
  const [z, setZ] = useState(0);
  const e = Math.exp(z);
  const a = [1 / (2 + e), 1 / (2 + e), e / (2 + e)];
  const fused = a[0] * .2 + a[1] * .5 + a[2] * .9;
  const colors = [C.blue, C.dark, C.orange];
  return <div>
    <SceneCanvas aria-label={`三尺度注意力权重 ${a.map(v => v.toFixed(3)).join('、')}，融合响应 ${fused.toFixed(3)}，教学示意`} draw={ctx => {
      clearScene(ctx, 1080, 280);
      drawLeaf(ctx, 230, 140, 1.35);
      ctx.save(); ctx.globalAlpha = fused; drawLeaf(ctx, 230, 140, 1.35, true); ctx.restore();
      a.forEach((v, i) => {
        const x = 450 + i * 110;
        ctx.fillStyle = C.light; ctx.globalAlpha = .25; ctx.fillRect(x, 65, 68, 160); ctx.globalAlpha = 1;
        ctx.fillStyle = colors[i]; ctx.fillRect(x, 225 - 160 * v, 68, 160 * v);
      });
      ctx.fillStyle = C.light; ctx.fillRect(850, 80, 150, 145);
      ctx.fillStyle = C.green; ctx.globalAlpha = fused; ctx.fillRect(850, 80, 150, 145); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.strokeRect(850, 80, 150, 145);
      drawSceneLabel(ctx, '尺度权重', 530, 36); drawSceneLabel(ctx, '融合响应', 880, 36);
      drawLegend(ctx, [{ label: '0.5×', color: C.blue }, { label: '1×', color: C.dark }, { label: '1.5×', color: C.orange }]);
    }} />
    <div className="ctrl"><label htmlFor="zoom4-logit">大尺度分数 z <span className="val">{z.toFixed(1)}</span></label><input id="zoom4-logit" type="range" min={-2} max={2} step={.1} value={z} onChange={ev => setZ(Number(ev.target.value))} /></div>
    <div className="ctrl" aria-live="polite" style={{ gap: 22, justifyContent: 'space-between' }}>
      <span>权重：{a.map(v => v.toFixed(3)).join(' / ')}（原始权重和 = 1）</span><span>示例特征：0.2 / 0.5 / 0.9</span><strong>融合值 {fused.toFixed(3)}</strong>
    </div>
    <Feedback tone={z > .05 ? 'good' : 'neutral'}>{Math.abs(z) < .05 ? '三个分数相等，权重各约 1/3；这是教学起点，并不代表真实注意力处处相等。' : z < 0 ? '大尺度分数下降，另外两种尺度的归一化权重一起上升；每个位置的三者之和仍为 1。' : '大尺度权重上升，其余两项同时下降。你改变了跨尺度分配；更大响应不等于更正确的分割。'}</Feedback>
  </div>;
}
