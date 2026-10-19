import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawLeaf, drawSceneLabel, Feedback } from './kit-anchor';

export function Zoom7() {
  const [p, setP] = useState(.5);
  const ual = 4 * p * (1 - p), bce = -Math.log(p);
  const feedback = p < .25 ? '这是自信但错误的前景判断：UAL 可能很小，BCE 仍然很大。' : p > .75 ? '在真实标签为前景时，走向 1 同时降低 BCE 与 UAL；正确方向来自标签监督。' : '接近 0.5 时 UAL 较大；它惩罚模糊，却不能独自决定前景还是背景。';
  return <div>
    <SceneCanvas aria-label={`标签为前景。概率 ${p.toFixed(2)}，UAL ${ual.toFixed(3)}，BCE ${bce.toFixed(3)}。横轴概率 0 到 1，纵轴损失 0 到 5；UAL 关于 0.5 对称，BCE 随概率增大而降低。`} draw={ctx => {
      clearScene(ctx, 1080, 280); drawLeaf(ctx, 210, 140, 1.3);
      ctx.save(); ctx.globalAlpha = p; drawLeaf(ctx, 210, 140, 1.3, true); ctx.restore();
      const gray = Math.round(p * 255); ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.beginPath(); ctx.ellipse(210, 140, 25, 50, -.35, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.dark; ctx.stroke();
      const X = (v: number) => 470 + v * 540, Y = (v: number) => 235 - v * 40;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(470, Y(i)); ctx.lineTo(1010, Y(i)); ctx.stroke(); }
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(470, 30); ctx.lineTo(470, 235); ctx.lineTo(1010, 235); ctx.stroke();
      for (const [fn, color] of [[(v: number) => 4 * v * (1 - v), C.green], [(v: number) => -Math.log(v), C.blue]] as const) {
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 1; i < 100; i++) { const v = i / 100; i === 1 ? ctx.moveTo(X(v), Y(fn(v))) : ctx.lineTo(X(v), Y(fn(v))); } ctx.stroke();
      }
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(p), 30); ctx.lineTo(X(p), 235); ctx.stroke(); ctx.setLineDash([]);
      [[ual, C.green], [bce, C.blue]].forEach(([v, color]) => { ctx.fillStyle = color as string; ctx.beginPath(); ctx.arc(X(p), Y(v as number), 6, 0, Math.PI * 2); ctx.fill(); });
      drawSceneLabel(ctx, 'UAL', 735, 173, C.green); drawSceneLabel(ctx, 'BCE', 512, 85, C.blue);
    }} />
    <div className="ctrl"><label htmlFor="zoom7-probability">预测前景概率 p <span className="val">{p.toFixed(2)}</span></label><input id="zoom7-probability" type="range" min={.01} max={.99} step={.01} value={p} onChange={e => setP(Number(e.target.value))} /></div>
    <div className="ctrl" aria-live="polite" style={{ justifyContent: 'space-between' }}><span>真实标签：前景 g=1</span><strong style={{ color: C.green }}>UAL {ual.toFixed(3)}</strong><strong style={{ color: C.blue }}>BCE {bce.toFixed(3)}</strong><span>横轴 p：0—1 · 纵轴损失：0—5</span></div>
    <Feedback tone={p < .25 ? 'bad' : p > .75 ? 'good' : 'neutral'}>{feedback}{Math.abs(p - .5) < .001 ? ' 恰好 p=0.5 时，UAL 对 p 的导数为 0。' : ''}</Feedback>
  </div>;
}
