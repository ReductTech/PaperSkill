import { useState } from 'react';
import { C, Scene, Chips, Panel, Feedback, DataTable, paint, line, dot, text } from './nusa-kit';

const spectrum = [8, 4, 2, 1, .6, .3, .1, .05];
const energies = spectrum.map(s => s * s);
const totalEnergy = energies.reduce((a, b) => a + b, 0);
const cumulative = energies.map((_, i) => energies.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalEnergy);

export function NusaSpectrum() {
  const [rho, setRho] = useState(.95);
  const [rmax, setRmax] = useState(4);
  const k = cumulative.findIndex(v => v >= rho - 1e-12) + 1;
  const r = Math.min(spectrum.length - k, rmax);
  const kept = energies.slice(k).reduce((a, b) => a + b, 0);
  const usedEnergy = r ? energies.slice(-r).reduce((a, b) => a + b, 0) : 0;
  const selected = spectrum.map((_, i) => i >= spectrum.length - r);
  const reset = () => { setRho(.95); setRmax(4); };
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="ctrl">
      <label htmlFor="nusa-rho">能量阈值 ρ <strong className="val">{(rho * 100).toFixed(1)}%</strong></label>
      <input id="nusa-rho" aria-label="能量阈值 ρ" type="range" min={80} max={100} step={.1} value={Number((rho * 100).toFixed(1))} onChange={e => setRho(Number(e.target.value) / 100)} />
      <button className={`chip ${rho === 1 ? 'selected' : ''}`} style={{ minHeight: 44 }} type="button" aria-pressed={rho === 1} onClick={() => setRho(1)}>100%（边界）</button>
    </div>
    <Chips label="秩上限 rmax" value={String(rmax)} options={[2, 4, 8].map(v => ({ value: String(v), label: String(v) }))} onChange={v => setRmax(Number(v))} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 14, color: C.muted }}><span style={{ color: C.blue }}>主空间</span><span style={{ color: C.green }}>选中尾部</span><span>未选尾部</span><span style={{ color: C.orange }}>累计能量（右轴）</span></div>
    <Scene label={`能量阈值${(rho * 100).toFixed(1)}%，主空间${k}维，尾部${8-k}维，有效更新秩${r}`} draw={ctx => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      text(ctx, '保护区域', 69, 28, 18, C.text); text(ctx, '平方能量', 515, 28, 18, C.text);
      paint(ctx, 67, 56, 344, 180, .45, 0);
      for (let i = 0; i < 8; i++) {
        const x = 79 + i * 40;
        ctx.fillStyle = i < k ? C.light : selected[i] ? C.green : '#fff';
        ctx.globalAlpha = i < k ? .9 : selected[i] ? .43 : .3;
        ctx.fillRect(x, 68, 40, 155); ctx.globalAlpha = 1;
        line(ctx, x, 68, x, 223, '#ffffff', 1);
      }
      line(ctx, 477, 44, 477, 244, C.axis);
      const left = 533, base = 223, height = 164, gap = 55;
      line(ctx, left - 16, base, 992, base, C.axis);
      line(ctx, left - 16, base, left - 16, base - height, C.axis);
      text(ctx, '64', 485, base - height + 6, 14, C.muted); text(ctx, '0', 500, base + 4, 14, C.muted);
      text(ctx, '100%', 1001, base - height + 6, 14, C.orange); text(ctx, '0%', 1001, base + 4, 14, C.orange);
      ctx.setLineDash([5, 5]); line(ctx, left - 16, base - height * rho, 992, base - height * rho, C.orange, 1.5); ctx.setLineDash([]);
      energies.forEach((energy, i) => {
        const x = left + i * gap, color = i < k ? C.blue : selected[i] ? C.green : C.axis;
        const h = height * energy / 64;
        ctx.fillStyle = color; ctx.fillRect(x, base - h, 34, h);
        dot(ctx, x + 17, base - h, 3, color);
        text(ctx, String(i + 1), x + 12, 246, 15, color);
      });
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath();
      cumulative.forEach((v, i) => { const x = left + i * gap + 17, y = base - height * v; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
      cumulative.forEach((v, i) => dot(ctx, left + i * gap + 17, base - height * v, i === k - 1 ? 6 : 3, C.orange));
    }} />
    <Panel><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, width: '100%' }}>
      <div>主空间 k<strong style={{ display: 'block', color: C.blue, fontSize: 26 }}>{k} / 8</strong></div>
      <div>主空间能量<strong style={{ display: 'block', color: C.blue, fontSize: 26 }}>{(cumulative[k - 1] * 100).toFixed(3)}%</strong></div>
      <div>有效秩 r<strong style={{ display: 'block', color: C.green, fontSize: 26 }}>{r}</strong></div>
      <div>选中能量<strong style={{ display: 'block', color: C.green, fontSize: 26 }}>{(usedEnergy / totalEnergy * 100).toFixed(4)}%</strong></div>
    </div></Panel>
    <Feedback tone={r ? 'good' : ''}>{r ? `主空间占 ${k} 维，尾部剩余 ${8 - k} 维；受 rmax = ${rmax} 限制，本轮选用最末 ${r} 个方向。它们的平方能量为 ${usedEnergy.toFixed(4)}，占总能量 ${(usedEnergy / totalEnergy * 100).toFixed(4)}%。` : '当前阈值覆盖全部 8 维，可用更新秩为 0，当前矩阵没有留下更新方向。'}</Feedback>
    <details><summary>展开逐方向数值与选择结果</summary>
      <DataTable headers={['方向 i', 'σᵢ', 'σᵢ²', '累计能量', '归属']} rows={spectrum.map((s, i) => [i + 1, s, energies[i].toFixed(4), `${(cumulative[i] * 100).toFixed(4)}%`, i < k ? '主空间' : selected[i] ? '选中尾部' : '未选尾部'])} caption="教学谱 σ = [8, 4, 2, 1, 0.6, 0.3, 0.1, 0.05]" />
      <p>总平方能量为 {totalEnergy.toFixed(4)}；当前整个尾部能量为 {kept.toFixed(4)}。官方实现先计算尾部维数，再取奇异值序列最后 r 个方向。ρ 控制主空间的能量覆盖，rmax 控制选中方向的最大数量。</p>
    </details>
    <div className="ctrl"><button type="button" className="tiny ghost" style={{ minHeight: 44 }} onClick={reset}>重置阈值与秩</button><span style={{ fontSize: 14, color: C.muted }}>依据：论文式 (1)–(2)、官方 nusa.py 的有效秩与尾部切片。</span></div>
  </div>;
}
