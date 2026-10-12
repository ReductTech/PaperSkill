import { useState } from 'react';
import { C, Scene, Panel, Feedback, DataTable, paint, brush, line, text } from './nusa-kit';

export function NusaMatrix() {
  const [m, setM] = useState<number[]>([0, 0, 0, 0]);
  const norm = Math.sqrt(m.reduce((total, value) => total + value * value, 0));
  const delta = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => i >= 2 && j >= 2 ? m[(i - 2) * 2 + j - 2] : 0));
  const cycle = (index: number) => setM(previous => previous.map((value, i) => i === index ? value === 0 ? 1 : value === 1 ? -1 : 0 : value));
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Panel><div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
      <div><strong>点击 M 的四个单元</strong><p>每次依次取 0 → 1 → −1 → 0。</p></div>
      <div role="group" aria-label="更新矩阵 M" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 62px)', gap: 6 }}>
        {m.map((value, i) => <button key={i} className={'chip' + (value !== 0 ? ' selected' : '')} style={{ minHeight: 48, margin: 0, fontVariantNumeric: 'tabular-nums' }} aria-label={`M 第 ${Math.floor(i / 2) + 1} 行第 ${i % 2 + 1} 列，当前 ${value}`} onClick={() => cycle(i)}>{value}</button>)}
      </div>
      <button className="chip" style={{ minHeight: 44 }} onClick={() => setM([0, 0, 0, 0])}>重置 M</button>
    </div></Panel>
    <Scene label="固定遮罩中的四处笔触与四乘四更新矩阵同步变化" draw={(ctx) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      paint(ctx, 90, 35, 350, 200, 0, 0.60);
      for (let i = 0; i < 4; i++) {
        const x = 318 + (i % 2) * 40;
        const y = 149 + Math.floor(i / 2) * 34;
        ctx.fillStyle = m[i] > 0 ? C.green : m[i] < 0 ? C.blue : '#ffffff';
        ctx.fillRect(x, y, 31, 24);
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(x, y, 31, 24);
      }
      if (norm > 0) brush(ctx, 387, 188, -0.5, C.orange);
      const size = 47; const gx = 689; const gy = 39;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const active = i >= 2 && j >= 2;
        const value = delta[i][j];
        ctx.fillStyle = active ? value > 0 ? C.green : value < 0 ? C.blue : '#ffffff' : C.light;
        ctx.fillRect(gx + j * size, gy + i * size, size - 4, size - 4);
        ctx.strokeStyle = active ? C.orange : C.axis; ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(gx + j * size, gy + i * size, size - 4, size - 4);
        text(ctx, String(value), gx + j * size + 16, gy + i * size + 29, 18, value !== 0 ? '#ffffff' : C.muted);
      }
      line(ctx, 491, 139, 611, 139, C.axis, 2);
      text(ctx, '固定遮罩', 220, 263, 18, C.muted);
      text(ctx, 'ΔW', 766, 263, 18, C.text);
    }} />
    <div className="metrics" aria-live="polite">
      <div className="metric"><div className="l">更新范数 ‖ΔW‖F</div><div className="v">{norm.toFixed(3)}</div></div>
      <div className="metric"><div className="l">主空间耦合 ‖UₚᵀΔW‖F</div><div className="v">0</div></div>
      <div className="metric"><div className="l">可训练系数 / 权重元素</div><div className="v">4 / 16</div></div>
    </div>
    <Feedback tone="good">{norm === 0 ? 'M 零初始化，适配分支输出为 0，当前权重保持 W。' : `当前 ‖ΔW‖F = ${norm.toFixed(3)}。四个系数改变右下区域，主空间对应的前两行、前两列始终为 0。`}</Feedback>
    <details><summary>展开教学矩阵与完整更新</summary>
      <p>教学设置：W = diag(8, 4, 0.5, 0.1)，Uₙ = Vₙ = [e₃, e₄]，r = 2，更新缩放取 1。每个 Mᵢⱼ 系数沿 Uₙ 的第 i 个列向量与 Vₙ 的第 j 个列向量组合。</p>
      <DataTable caption="ΔW = Uₙ M Vₙᵀ" headers={['', '列 1', '列 2', '列 3', '列 4']} rows={delta.map((row, i) => [`行 ${i + 1}`, ...row])} />
      <p>论文 §3.2 式（3）：任务内冻结 W、Uₙ、Vₙ，优化器仅更新 M。</p>
    </details>
  </div>;
}
