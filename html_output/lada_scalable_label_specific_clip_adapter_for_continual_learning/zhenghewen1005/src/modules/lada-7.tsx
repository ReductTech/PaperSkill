import { useMemo, useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, drawAlbum, drawCard, line, text } from './lada-kit';

function gaussianSamples(seed: number) {
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state + 1) / 4294967297; };
  return Array.from({ length: 60 }, () => {
    const component = random() < .6 ? 0 : 1;
    const radius = Math.sqrt(-2 * Math.log(random()));
    const angle = 2 * Math.PI * random();
    return { component, ex: radius * Math.cos(angle), ey: radius * Math.sin(angle) };
  });
}

export function Lada7() {
  const [mode, setMode] = useState('center');
  const [sigma, setSigma] = useState(.25);
  const [seed, setSeed] = useState(1);
  const samples = useMemo(() => gaussianSamples(seed), [seed]);
  const distributed = mode === 'distribution';
  const groupOne = samples.filter(p => p.component === 0).length;
  const rms = Math.sqrt(samples.reduce((sum, p) => sum + sigma * sigma * (p.ex * p.ex + p.ey * p.ey), 0) / samples.length);
  return <div className="lada-seven" onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-seven .lada-seven-controls{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:14px 0}.lada-seven label{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.lada-seven input{width:min(220px,65vw);accent-color:#228d5c}.lada-seven button{border:1px solid #b8c6b0;border-radius:9px;padding:9px 15px;background:#fff;color:#27446e;cursor:pointer}.lada-seven details{margin-top:16px}.lada-seven summary{cursor:pointer;color:#27446e}.lada-seven p{line-height:1.8}.lada-seven .lada-seven-legend{font-size:13px;color:#586354;line-height:1.7}`}</style>
    <Chips label="旧类特征" value={mode} onChange={setMode} options={[{ value: 'center', label: '仅中心' }, { value: 'distribution', label: '分布保留' }]} />
    <div className="lada-seven-controls">
      <label>分布尺度 σ <input aria-label="分布尺度σ" type="range" min="0.05" max="0.6" step="0.01" value={sigma} onChange={e => setSigma(Number(e.target.value))} /><output>{sigma.toFixed(2)}</output></label>
      <button onClick={() => { setMode('distribution'); setSeed(v => v + 1); }}>重新采样</button>
    </div>
    <Scene label="二维球形高斯教学示例：图鉴代表照片及对应的两个原型中心、采样范围与增强特征" draw={(ctx, w, h) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      drawAlbum(ctx, w * .035, h * .20, w * .30, h * .57);
      const centers = [-.65, .65];
      const plotX = w * .67, plotY = h * .50, scale = Math.min(w * .32 / 3.2, h * .43 / 3.2);
      line(ctx, w * .37, plotY, w * .97, plotY, C.line);
      line(ctx, plotX, h * .10, plotX, h * .89, C.line);
      text(ctx, '原型图鉴', w * .185, h * .13, 13, C.muted, 'center');
      text(ctx, distributed ? '分布采样' : '原型中心', plotX, h * .07, 13, C.muted, 'center');
      centers.forEach((p, j) => {
        const color = j === 0 ? C.blue : C.purple;
        const x = plotX + p * scale;
        ctx.save(); ctx.globalAlpha = .10; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, plotY, sigma * 2 * scale, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .55; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(x, plotY, sigma * 2 * scale, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });
      if (distributed) samples.forEach((p, index) => {
        const color = p.component === 0 ? C.blue : C.purple;
        ctx.globalAlpha = .66; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(plotX + (centers[p.component] + sigma * p.ex) * scale, plotY - sigma * p.ey * scale, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        if (index < 10) { const bx = w * (.105 + p.component * .15), by = h * .47; drawCard(ctx, bx + sigma * p.ex * w * .045, by + sigma * p.ey * h * .16, Math.min(22, w * .045), 1, color, p.ex * .08); }
      });
      centers.forEach((p, j) => {
        const color = j === 0 ? C.blue : C.purple;
        drawCard(ctx, w * (.105 + j * .15), h * .47, Math.min(43, w * .085), 1, color);
        ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(plotX + p * scale, plotY, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }} />
    <p className="lada-seven-legend">教学示例：同一旧类别的两个成分，中心分别为 (−0.65, 0)、(0.65, 0)，蓝色权重 0.6，紫色权重 0.4。圆形虚线半径为 2σ。</p>
    <Readout items={[{ label: '平均方差 Tr(Σ)/d', value: (sigma * sigma).toFixed(4) }, { label: '参与训练的特征', value: distributed ? '60 个采样特征' : '2 个原型中心' }, { label: '采样批次', value: `#${seed}` }, { label: distributed ? '本批两成分样本数' : '混合权重 π', value: distributed ? `${groupOne} / ${60 - groupOne}` : '0.6 / 0.4' }]} />
    <Feedback>{distributed ? `围绕两个中心按 σ=${sigma.toFixed(2)} 采样，本批特征到各自中心的均方根距离为 ${rms.toFixed(3)}。中心保留，类内变化进入训练，标签保持为同一旧类别。` : `两个固定中心携带旧类标签参与训练。当前保存尺度 σ=${sigma.toFixed(2)}；虚线圈显示其分布范围，切换“分布保留”后在这一范围附近产生增强特征。`}</Feedback>
    <details><summary>查看采样机制与公式</summary><p>GMM 为每个旧类别保留 λ₂ 个成分的混合权重 πₗ、均值 pₗ 与协方差 Σₗ。先按混合权重选择成分，再取 ε ∼ N(0, I)，构造 p̃ₗ = pₗ + ε√(Tr(Σₗ)/d)。尺度由各维方差的平均值决定，增强使用各向同性扰动。</p><p>本例 d=2，Σₗ=σ²I。60 个样本由固定批次种子生成：调节 σ 会缩放同一组噪声，重新采样会产生下一组噪声。</p></details>
    <Source page={5} label="§3.2，Eq. 9–11 · DPT；二维分布为教学示例" />
  </div>;
}
