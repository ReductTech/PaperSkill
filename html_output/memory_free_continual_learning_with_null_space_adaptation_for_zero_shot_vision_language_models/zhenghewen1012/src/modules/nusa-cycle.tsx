import { useState } from 'react';
import { C, Scene, Panel, Feedback, DataTable, paint, line, text, arrow } from './nusa-kit';

const names = ['读取骨干', '提取尾部', '训练 M', '合并更新', '重新 SVD', '开始新任务'];
const explanations = [
  '读取 W₀ = diag(4, 1)。第一个方向的奇异值为 4，第二个方向为 1。',
  '固定有效秩 r = 1，提取尾部方向 e₂；Uₙ = Vₙ = e₂，M 从 0 开始。',
  '教学更新令 M = 4，得到 ΔW₁ = diag(0, 4)。任务内 Uₙ、Vₙ 继续保持 e₂。',
  'W₁ = W₀ + ΔW₁ = diag(4, 5)。更新写入同一个骨干，第二个方向的值达到 5。',
  '对 W₁ 重新 SVD。奇异值按 5、4 排列，主方向变为 e₂，尾部方向变为 e₁。',
  '第二个任务固定新的 Uₙ = Vₙ = e₁，M 重新初始化为 0，从当前 W₁ 开始学习。'
];

export function NusaCycle() {
  const [step, setStep] = useState(0);
  const merged = step >= 3;
  const newBasis = step >= 4;
  const w = [4, merged ? 5 : 1];
  const m = step === 2 ? '4' : step === 1 || step === 5 ? '0' : '—';
  const tail = step === 0 ? '待提取' : newBasis ? 'e₁' : 'e₂';
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Panel>
      <div role="list" aria-label="任务循环进度" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {names.map((name, i) => <span key={name} role="listitem" aria-current={step === i ? 'step' : undefined} style={{ padding: '7px 10px', border: `1px solid ${i === step ? C.green : C.axis}`, borderRadius: 8, background: i === step ? C.green : '#ffffff', color: i === step ? '#ffffff' : C.muted }}>{i + 1}. {name}</span>)}
      </div>
      <div className="chip-row"><button className="chip" style={{ minHeight: 44 }} disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>上一步</button><button className="chip selected" style={{ minHeight: 44 }} disabled={step === 5} onClick={() => setStep(value => Math.min(5, value + 1))}>下一步</button><button className="chip" style={{ minHeight: 44 }} onClick={() => setStep(0)}>重置循环</button><span>步骤 {step + 1} / 6</span></div>
    </Panel>
    <Scene label="任务更新合并到固定画布，重新分解使尾部方向从 e2 变成 e1" draw={ctx => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
      paint(ctx, 54, 35, 352, 208, merged ? 0.76 : 0, step === 0 || newBasis ? 0 : 0.5);
      if (newBasis) {
        ctx.fillStyle = 'rgba(184,201,167,.60)'; ctx.fillRect(183, 38, 220, 202);
        ctx.strokeStyle = C.dark; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(183, 38, 220, 202); ctx.setLineDash([]);
      }
      if (step === 2) {
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9; ctx.fillRect(229, 141, 130, 69); ctx.globalAlpha = 1;
        line(ctx, 250, 177, 340, 177, C.orange, 16);
        ctx.strokeStyle = C.axis; ctx.strokeRect(229, 141, 130, 69);
      }
      if (newBasis) {
        ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.strokeRect(83, 63, 78, 130);
      } else if (step > 0) {
        ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.strokeRect(249, 139, 117, 78);
      }
      const gx = 514, gy = 72, size = 67;
      [w[0], 0, 0, w[1]].forEach((value, i) => {
        ctx.fillStyle = i === 0 || i === 3 ? merged && i === 3 ? C.green : C.blue : '#ffffff';
        ctx.fillRect(gx + (i % 2) * size, gy + Math.floor(i / 2) * size, size - 5, size - 5);
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(gx + (i % 2) * size, gy + Math.floor(i / 2) * size, size - 5, size - 5);
        text(ctx, String(value), gx + (i % 2) * size + 23, gy + Math.floor(i / 2) * size + 39, 24, value ? '#ffffff' : C.muted);
      });
      const originX = 824, originY = 211;
      line(ctx, originX, originY, 1032, originY, C.axis);
      line(ctx, originX, originY, originX, 27, C.axis);
      arrow(ctx, originX, originY, originX + w[0] * 34, originY, newBasis ? C.green : C.blue);
      arrow(ctx, originX, originY, originX, originY - w[1] * 34, newBasis ? C.blue : C.green);
      text(ctx, String(w[0]), originX + w[0] * 34 + 12, originY + 7, 21, newBasis ? C.green : C.blue);
      text(ctx, String(w[1]), originX - 26, originY - w[1] * 34 + 7, 21, newBasis ? C.blue : C.green);
      text(ctx, merged ? 'W₁' : 'W₀', 558, 251, 20, C.text);
      text(ctx, '方向长度', 882, 251, 18, C.muted);
    }} />
    <Feedback tone="good">{explanations[step]}</Feedback>
    <div className="metrics" aria-live="polite">
      <div className="metric"><div className="l">当前骨干</div><div className="v">diag({w[0]}, {w[1]})</div></div>
      <div className="metric"><div className="l">当前提取的尾部基</div><div className="v">{tail}</div></div>
      <div className="metric"><div className="l">适配系数 M</div><div className="v">{m}</div></div>
      <div className="metric"><div className="l">持久骨干元素</div><div className="v">4</div></div>
    </div>
    <p>二维教学设置：有效秩固定 r = 1，更新缩放为 1；水平轴为 e₁，竖直轴为 e₂。每任务只保留一个当前适配系数，完成后合并到原有 2 × 2 骨干。</p>
    <details><summary>合并与重新分解的矩阵记录</summary>
      <DataTable caption="论文 §3.3 式（4）的二维教学过程" headers={['阶段', '权重 / 更新', '尾部方向']} rows={[
        ['任务 1 开始', 'W₀ = diag(4, 1)', 'e₂'],
        ['任务 1 更新', 'ΔW₁ = diag(0, 4)', 'e₂'],
        ['合并', 'W₁ = diag(4, 5)', '等待重新提取'],
        ['任务 2 开始', 'σ₁ = 5，σ₂ = 4；M = 0', 'e₁']
      ]} />
      <p>任务内使用冻结的基；任务结束后，新的奇异基由已经合并的权重计算。每次任务开始，M 都重新置零。</p>
    </details>
  </div>;
}
