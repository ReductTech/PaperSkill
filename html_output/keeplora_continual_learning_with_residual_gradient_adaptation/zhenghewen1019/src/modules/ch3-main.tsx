import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawMask, drawLabel } from './studio-kit';

const stages = ['预训练', '任务一', '任务二', '空间已满'];
const descriptions = [
  '先保护预训练主方向e₁。当前Q只有1列，另外3个正交方向可用于更新。',
  '任务一的特征在e₂方向带来新信息，把e₂加入旧任务基M。预训练方向e₁继续保留。',
  '任务二补入e₃，旧任务基变成[e₂,e₃]。还剩e₄这1个方向。',
  'e₄也加入后，Q覆盖整个四维空间，满足保护条件的更新只能为零。',
];

export function Chapter3Main() {
  const [stage, setStage] = useState(0);
  const k = stage + 1;
  const symbols = Array.from({ length: k }, (_, i) => `e${['₁', '₂', '₃', '₄'][i]}`);
  return <div>
    <div className="ctrl" role="group" aria-label="保护基增长阶段">
      {stages.map((name, i) => <button key={name} className={`chip ${stage === i ? 'selected' : ''}`} aria-pressed={stage === i} onClick={() => setStage(i)}>{name}</button>)}
      <button className="chip" disabled={stage === 3} style={stage === 3 ? { opacity: .4, cursor: 'not-allowed' } : undefined} onClick={() => setStage(s => Math.min(3, s + 1))}>下一步</button>
      <button className="chip" onClick={() => setStage(0)}>重置</button>
    </div>
    <StudyCanvas ariaLabel={`保护基Q含${k}个正交方向，分别为${symbols.join('、')}；剩余${4 - k}维。`} draw={(c) => {
      drawPaper(c, 32, 28, 448, 220); drawLabel(c, '逐层保留', 55, 58);
      for (let i = 0; i < 4; i++) {
        const y = 89 + i * 42;
        c.strokeStyle = i === 0 ? palette.blue : '#adb9c2'; c.lineWidth = 3; c.beginPath(); c.moveTo(81, y); c.bezierCurveTo(180, y - 15, 272, y + 15, 406, y); c.stroke();
        if (i < k) drawMask(c, 64, y - 14, 360, 28);
      }
      drawLabel(c, '正交基列', 580, 58);
      for (let col = 0; col < 4; col++) {
        const x = 593 + col * 111;
        c.fillStyle = col < k ? (col === 0 ? '#e6edf6' : '#e8f0e5') : '#f2f3ef';
        c.beginPath(); c.roundRect(x, 77, 85, 165, 8); c.fill();
        c.strokeStyle = col < k ? palette.dark : palette.border; c.setLineDash(col < k ? [] : [4, 4]); c.stroke(); c.setLineDash([]);
        for (let row = 0; row < 4; row++) {
          c.beginPath(); c.arc(x + 42.5, 99 + row * 40, 10, 0, Math.PI * 2);
          c.fillStyle = col < k && row === col ? (col === 0 ? palette.blue : palette.green) : '#d6dcd9'; c.fill();
        }
      }
    }} />
    <div className="metrics" aria-live="polite">
      <div className="metric"><div className="l">Q的形状</div><div className="v">4 × {k}</div></div>
      <div className="metric"><div className="l">剩余维数</div><div className="v">{4 - k}</div></div>
      <div className="metric"><div className="l">基矩阵标量数</div><div className="v">{4 * k}</div></div>
    </div>
    <p className="algo-formula">Q = [{symbols.join(', ')}]，Wₚ = [e₁]，M = {k === 1 ? '空' : `[${symbols.slice(1).join(', ')}]`}</p>
    <table className="paper"><caption style={{ textAlign: 'left', padding: '8px 0', color: palette.blue }}>当前统一保护基 Q</caption><thead><tr><th>输入坐标</th>{symbols.map((symbol, i) => <th key={symbol}>{symbol} · {i === 0 ? '预训练' : '旧任务'}</th>)}</tr></thead><tbody>
      {[0, 1, 2, 3].map(row => <tr key={row}><th>第{row + 1}维</th>{symbols.map((symbol, col) => <td key={symbol} style={{ color: row === col ? palette.green : palette.muted, fontWeight: row === col ? 700 : 400 }}>{row === col ? 1 : 0}</td>)}</tr>)}
    </tbody></table>
    <div className={`feedback ${k < 4 ? 'good' : ''}`} style={k === 4 ? { color: '#9a4b22', background: '#fff0e6', borderLeftColor: palette.orange } : undefined} role="status" aria-live="polite">{descriptions[stage]}</div>
    <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', color: palette.blue }}>新方向怎样加入？</summary><p>实际算法先收集当前任务特征，减去已被Q覆盖的分量，再对剩余特征做奇异值分解。新增的左奇异向量与已有基正交，才加入M。教学例按e₂、e₃、e₄各加一列；一般模型按特征能量阈值决定新增列数。</p></details>
    <p style={{ fontSize: 13, color: palette.muted }}>本例e₁=(1,0,0,0)ᵀ，依次类推。每列长度为1，不同列内积为0。基矩阵存储量为4k个标量，最多16个；来源：第3.2节、式3—4。</p>
  </div>;
}
