import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawPencil, drawLabel, drawMask } from './studio-kit';

const singularValues = [8, 4, 2, 1];
const energies = singularValues.map(x => x * x);
const total = energies.reduce((sum, energy) => sum + energy, 0);
const cumulative = energies.map((_, i) => energies.slice(0, i + 1).reduce((a, b) => a + b, 0));

export function Chapter2Main() {
  const [threshold, setThreshold] = useState(.85);
  const p = cumulative.findIndex(sum => sum / total + 1e-12 >= threshold) + 1;
  const coverage = cumulative[p - 1] / total * 100;
  return <div>
    <div className="ctrl">
      <label htmlFor="ch2-threshold">保护能量阈值</label>
      <input id="ch2-threshold" type="range" min="0.50" max="1.00" step="0.01" value={threshold} onChange={e => setThreshold(Number(e.target.value))} aria-valuetext={`${(threshold * 100).toFixed(0)}%，保护${p}个方向`} />
      <output className="val" htmlFor="ch2-threshold">{threshold.toFixed(2)}</output>
      <button className="chip" onClick={() => setThreshold(.85)}>恢复0.85</button>
    </div>
    <StudyCanvas ariaLabel={`四个方向的能量为64、16、4、1，已保护前${p}个方向，覆盖${coverage.toFixed(2)}%能量，剩余${4 - p}维。`} draw={(c) => {
      drawPaper(c, 32, 28, 448, 220); drawLabel(c, '受保护轮廓', 55, 58);
      for (let i = 0; i < 4; i++) {
        const y = 92 + i * 40;
        if (i < p) drawMask(c, 70, y - 14, 320, 27);
        c.strokeStyle = i < p ? palette.blue : '#bcc4cc'; c.lineWidth = 7 - i * 1.3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(87, y); c.bezierCurveTo(157, y - 15, 259, y + 14, 375, y); c.stroke();
      }
      drawPencil(c, 397, 92 + (p - 1) * 40, -.4);
      drawLabel(c, '方向能量', 580, 58);
      c.strokeStyle = palette.border; c.lineWidth = 1;
      for (let line = 0; line <= 4; line++) { const y = 228 - line * 40; c.beginPath(); c.moveTo(580, y); c.lineTo(1040, y); c.stroke(); }
      energies.forEach((energy, i) => { const height = energy / 64 * 160; c.fillStyle = i < p ? palette.blue : '#cbd4df'; c.beginPath(); c.roundRect(602 + i * 112, 228 - height, 70, height, Math.min(7, height / 2)); c.fill(); });
    }} />
    <div className="metrics" aria-live="polite">
      <div className="metric"><div className="l">保护维数</div><div className="v">{p} / 4</div></div>
      <div className="metric"><div className="l">实际覆盖能量</div><div className="v">{coverage.toFixed(2)}%</div></div>
      <div className="metric"><div className="l">剩余维数</div><div className="v">{4 - p}</div></div>
    </div>
    <table className="paper"><thead><tr><th>方向</th><th>奇异值</th><th>能量（平方）</th><th>累计占比</th><th>当前状态</th></tr></thead><tbody>
      {singularValues.map((value, i) => <tr key={value} style={{ background: i < p ? '#eaf1f5' : undefined }}><td>u<sub>{i + 1}</sub></td><td>{value}</td><td>{energies[i]}</td><td>{(cumulative[i] / total * 100).toFixed(2)}%</td><td>{i < p ? '保护' : '剩余'}</td></tr>)}
    </tbody></table>
    <div className={`feedback ${p < 4 ? 'good' : ''}`} style={p === 4 ? { color: '#9a4b22', background: '#fff0e6', borderLeftColor: palette.orange } : undefined} role="status" aria-live="polite">
      {p < 4 ? `累计能量第一次达到 ${(threshold * 100).toFixed(0)}% 时，已取 ${p} 个方向。实际覆盖 ${cumulative[p - 1]} ÷ 85 = ${coverage.toFixed(2)}%，还留 ${4 - p} 个正交方向。` : '4个方向全部保护，能量覆盖100%。这个四维教学例的剩余更新空间为0维。'}
    </div>
    <p style={{ fontSize: 13, color: palette.muted }}>四维教学例：奇异值为8、4、2、1，总平方能量为85。论文图1观察到：移除低能量分量后，专门领域数据集比一般领域数据集更敏感。来源：图1、第3.2节。</p>
  </div>;
}
