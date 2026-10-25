import { useState } from 'react';
import { C, Scene, Panel, Feedback, DataTable, text, line } from './nusa-kit';

export function NusaObjective() {
  const [step, setStep] = useState(0);
  let u = 0;
  const history: number[][] = [];
  for (let i = 0; i <= step; i += 1) {
    const p = 1 / (1 + Math.exp(-u));
    history.push([u, p, p - 0.9, -0.9 * Math.log(p) - 0.1 * Math.log(1 - p)]);
    if (i < step) u -= 0.4 * (p - 0.9);
  }
  const [logit, p, gradient, loss] = history[step];
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <p>二维教学计算：两个类别的 logits 为 [u, 0]，第一类为目标。标签平滑 ε = 0.2，将目标分布设为 [0.9, 0.1]；学习率 η = 0.4。</p>
    <div className="controls"><button className="tiny" disabled={step === 8} onClick={() => setStep(s => Math.min(8, s + 1))}>更新一步</button> <button className="tiny ghost" onClick={() => setStep(0)}>重置</button> <strong>第 {step} / 8 步</strong></div>
    <Scene label="交叉熵教学计算：左侧 logit，右侧两个类别概率与目标概率" draw={(ctx) => {
      text(ctx, 'logits', 100, 38, 18); text(ctx, '概率', 590, 38, 18);
      line(ctx, 80, 235, 440, 235, C.axis); line(ctx, 570, 235, 980, 235, C.axis);
      [logit, 0].forEach((value, i) => { const x = 140 + i * 160; ctx.fillStyle = i === 0 ? C.orange : C.blue; ctx.fillRect(x, 235 - value * 105, 84, Math.max(2, value * 105)); text(ctx, value.toFixed(3), x, Math.max(70, 220 - value * 105), 18); });
      [p, 1-p].forEach((value, i) => { const x = 640 + i * 190; ctx.fillStyle = i === 0 ? C.green : C.blue; ctx.fillRect(x, 235 - value * 185, 90, value * 185); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.setLineDash([6,5]); ctx.strokeRect(x-5, 235 - (i === 0 ? .9 : .1)*185, 100, (i === 0 ? .9 : .1)*185); ctx.setLineDash([]); text(ctx, value.toFixed(3), x, 220 - value * 185, 18); });
    }}/>
    <Panel><span>u = {logit.toFixed(4)}</span><span>p₁ = {p.toFixed(4)}</span><span>∂ℒ/∂u = {gradient.toFixed(4)}</span><span>ℒ = {loss.toFixed(4)}</span></Panel>
    <Feedback tone="good">{step === 0 ? '零初始化时 p₁ = p₂ = 0.5，交叉熵为 0.6931。' : `第 ${step} 步后，目标类别概率升至 ${(p*100).toFixed(2)}%，交叉熵降至 ${loss.toFixed(4)}。`} 下一步按 u ← u − 0.4(p₁ − 0.9) 更新。</Feedback>
    <Panel><span style={{color:C.green}}>类别 1</span><span style={{color:C.blue}}>类别 2</span><span style={{color:C.orange}}>平滑目标</span></Panel>
    <p>实际模型通过图文相似度计算 logits，再沿固定奇异基把梯度传给 M。</p>
    <details><summary>梯度和实际训练设置</summary><p>ℒ = −0.9 ln p₁ − 0.1 ln(1−p₁)，∂ℒ/∂u = p₁−0.9。论文采用 AdamW；本交互采用标量梯度下降展示一次分类更新。</p><DataTable headers={['设置', 'Full-shot MTIL']} rows={[["优化器", "AdamW"],["学习率 / 权重衰减", "3×10⁻⁴ / 10⁻²"],["训练步数 / batch", "1000 / 16"],["warmup / dropout", "5% / 0.25"],["标签平滑", "0.2"]]} caption="论文 Appendix A.2；官方代码 src/trainer.py"/></details>
  </div>;
}
