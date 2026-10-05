import { useState, type CSSProperties } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, line, roundRect, text } from './lada-kit';

const EXAMPLES = {
  A: [[0.9, 0.7, 0.2], [0.6, 0.5, 0.4]],
  B: [[0.5, 0.4, 0.2], [0.9, 0.8, 0.3]],
} as const;

const styles = `
.lada-four { color: #24352d; }
.lada-four-top { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
.lada-four-note { color:#61716b; font-size:12px; letter-spacing:.02em; margin:0; }
.lada-four-slider { display:grid; grid-template-columns:auto minmax(110px,1fr) 42px; align-items:center; gap:14px; padding:13px 16px; border:1px solid #dce5d9; border-radius:12px; background:#fbfcf8; margin:12px 0; }
.lada-four-slider label { font-size:14px; font-weight:650; }
.lada-four-slider input { width:100%; min-width:0; accent-color:#27446e; cursor:pointer; }
.lada-four-slider output { font-variant-numeric:tabular-nums; font-size:18px; font-weight:700; text-align:right; color:#27446e; }
.lada-four-scale { display:flex; justify-content:space-between; gap:10px; font-size:12px; color:#61716b; margin:7px 0 16px; }
.lada-four-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin:16px 0; }
.lada-four-group { border:1px solid #dce5d9; border-radius:12px; padding:14px; background:#fff; min-width:0; }
.lada-four-group h4 { display:flex; justify-content:space-between; gap:8px; font-size:14px; margin:0 0 10px; color:var(--lada-four-color); }
.lada-four-group h4 span { font-weight:500; font-size:12px; }
.lada-four-group table { border-collapse:collapse; width:100%; font-size:12px; font-variant-numeric:tabular-nums; }
.lada-four-group th { text-align:right; font-weight:500; color:#61716b; padding:0 0 7px; }
.lada-four-group th:first-child,.lada-four-group td:first-child { text-align:left; }
.lada-four-group td { border-top:1px solid #edf0e9; padding:9px 0; text-align:right; white-space:nowrap; }
.lada-four-group td strong { font-weight:650; color:var(--lada-four-color); }
.lada-four-total { display:flex; justify-content:space-between; align-items:baseline; gap:8px; border-top:1px solid #dce5d9; padding-top:11px; margin-top:2px; font-size:13px; }
.lada-four-total strong { color:var(--lada-four-color); font-size:20px; font-variant-numeric:tabular-nums; }
.lada-four-calc { font-size:12px; margin:13px 0 0; color:#61716b; line-height:1.65; }
@media(max-width:560px) { .lada-four-grid { grid-template-columns:1fr; } .lada-four-slider { gap:9px; padding:11px; } .lada-four-scale { font-size:11px; } }
`;

export function LadaFour() {
  const [sample, setSample] = useState<'A' | 'B'>('A');
  const [beta, setBeta] = useState(2);
  const products = EXAMPLES[sample];
  const contributions = products.map(group => group.map(a => Math.exp(-beta * (1 - a))));
  const sums = contributions.map(group => group.reduce((sum, value) => sum + value, 0));
  const max = Math.max(...sums);
  const denominator = sums.reduce((sum, value) => sum + Math.exp(value - max), 0);
  const probs = sums.map(value => Math.exp(value - max) / denominator);
  const winner = sums[0] >= sums[1] ? 0 : 1;
  const labels = ['类别一', '类别二'];
  const colors = [C.blue, C.green];

  return <div className="lada-four" onKeyDown={event => event.stopPropagation()}>
    <style>{styles}</style>
    <div className="lada-four-top">
      <Chips label="固定内积样本" options={[{ value:'A', label:'样本 A' }, { value:'B', label:'样本 B' }]} value={sample} onChange={value => setSample(value as 'A' | 'B')} />
      <p className="lada-four-note">教学示例 · 每类 3 个记忆向量</p>
    </div>
    <div className="lada-four-slider">
      <label htmlFor="lada-four-beta">指数锐度 β</label>
      <input id="lada-four-beta" type="range" min="0.5" max="10" step="0.1" value={beta} onChange={event => setBeta(Number(event.target.value))} onKeyDown={event => event.stopPropagation()} />
      <output htmlFor="lada-four-beta">{beta.toFixed(1)}</output>
    </div>
    <Scene label={`样本 ${sample} 的六个指数贡献，β 为 ${beta.toFixed(1)}，${labels[winner]}合计最高。`} height={280} draw={(ctx, w, h) => {
      const base = h * 0.81;
      const chartHeight = h * 0.55;
      const groupWidth = w * 0.4;
      for (let group = 0; group < 2; group++) {
        const left = w * (group === 0 ? 0.07 : 0.55);
        roundRect(ctx, left - w * 0.015, h * 0.17, groupWidth + w * 0.03, h * 0.7, 12, '#fafdF7', group === winner ? colors[group] : C.line);
        text(ctx, labels[group], left + groupWidth / 2, h * 0.115, 14, colors[group], 'center');
        for (let tick = 0; tick <= 4; tick++) {
          const y = base - chartHeight * tick / 4;
          line(ctx, left, y, left + groupWidth, y, C.line, tick === 0 ? 1.5 : 0.7);
        }
        contributions[group].forEach((value, index) => {
          const barWidth = groupWidth * 0.16;
          const x = left + groupWidth * (0.14 + index * 0.3);
          roundRect(ctx, x, base - chartHeight, barWidth, chartHeight, 5, '#e8eee3');
          roundRect(ctx, x, base - chartHeight * value, barWidth, Math.max(1.5, chartHeight * value), 5, colors[group]);
          line(ctx, x + barWidth / 2, base + 6, x + barWidth / 2, base + 12, colors[group], 2);
        });
      }
    }} />
    <div className="lada-four-scale"><span>纵轴：单个记忆的激活，0–1</span><span>每组三项按记忆 1 → 3 排列</span></div>
    <Readout items={[
      { label:'类别一 softmax', value:`${(probs[0] * 100).toFixed(1)}%` },
      { label:'类别二 softmax', value:`${(probs[1] * 100).toFixed(1)}%` },
      { label:'最高分候选', value:labels[winner] },
    ]} />
    <div className="lada-four-grid">
      {products.map((group, j) => <section className="lada-four-group" key={j} style={{ '--lada-four-color':colors[j] } as CSSProperties}>
        <h4>{labels[j]}<span>{winner === j ? '当前最高分' : '同一候选集合'}</span></h4>
        <table aria-label={`${labels[j]}的三个记忆贡献`}>
          <thead><tr><th scope="col">记忆</th><th scope="col">内积</th><th scope="col">指数项</th><th scope="col">贡献</th></tr></thead>
          <tbody>{group.map((a, l) => <tr key={l}>
            <td>{l + 1}</td><td>{a.toFixed(1)}</td><td>e<sup>−{(beta * (1 - a)).toFixed(2)}</sup></td><td><strong>{contributions[j][l].toFixed(4)}</strong></td>
          </tr>)}</tbody>
        </table>
        <div className="lada-four-total"><span>三项相加 z<sub>{j + 1}</sub></span><strong>{sums[j].toFixed(4)}</strong></div>
      </section>)}
    </div>
    <Feedback tone="good">β = {beta.toFixed(1)} 时，“{labels[winner]}”的合计分数为 {sums[winner].toFixed(4)}。最相近记忆的贡献保留得更多，低匹配项衰减更快。</Feedback>
    <p className="lada-four-calc">每项贡献 = exp[−β × (1 − 内积)]；类别概率 = exp(该类合计分数) / 两类指数分数之和。</p>
    <Source page={4} label="公式 6 · 指数映射与按类聚合" />
  </div>;
}
