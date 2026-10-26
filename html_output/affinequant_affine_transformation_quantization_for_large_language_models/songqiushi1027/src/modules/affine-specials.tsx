import { useState } from 'react';
import type { WidgetProps } from './registry';
import { MatrixGrid, SegButton, Feedback } from './aqKit';
import type { CellSpec } from './aqKit';

type Constraint = 'none' | 'diag' | 'perm' | 'rownorm';

const MATRICES: Record<Constraint, CellSpec[][]> = {
  none: [
    [{ label: 'a₁₁', tone: 'green', on: true }, { label: 'a₁₂', tone: 'green', on: true }, { label: 'a₁₃', tone: 'green', on: true }],
    [{ label: 'a₂₁', tone: 'green', on: true }, { label: 'a₂₂', tone: 'green', on: true }, { label: 'a₂₃', tone: 'green', on: true }],
    [{ label: 'a₃₁', tone: 'green', on: true }, { label: 'a₃₂', tone: 'green', on: true }, { label: 'a₃₃', tone: 'green', on: true }],
  ],
  diag: [
    [{ label: 's₁', tone: 'orange', on: true }, { label: '0', tone: 'none' }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: 's₂', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: 's₃', tone: 'orange', on: true }],
  ],
  perm: [
    [{ label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: '1', tone: 'orange', on: true }, { label: '0', tone: 'none' }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }],
  ],
  rownorm: [
    [{ label: 'c', tone: 'orange', on: true }, { label: '−s', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: 's', tone: 'orange', on: true }, { label: 'c', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }],
  ],
};

const META: Record<Constraint, { name: string; desc: string; feedback: string; tone: 'green' | 'orange' }> = {
  none: { name: 'AffineQuant', desc: '无额外约束：一般可逆仿射，自由度最大。', feedback: '全部保留 = AffineQuant（最一般）', tone: 'green' },
  diag: { name: 'OmniQuant', desc: '只保留对角（可学习 scale + shift）。', feedback: '只保留对角 = OmniQuant（scale + shift）', tone: 'orange' },
  perm: { name: 'RPTQ', desc: '每行每列恰好一个 1 的置换矩阵。', feedback: '置换矩阵 = RPTQ', tone: 'orange' },
  rownorm: { name: 'SpinQuant / QuaRot', desc: '逐行范数归一（正交旋转，保范数）。', feedback: '逐行范数归一（旋转）= SpinQuant / QuaRot', tone: 'orange' },
};

export function AffineSpecials(_props: WidgetProps) {
  const [constraint, setConstraint] = useState<Constraint>('none');
  const meta = META[constraint];
  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="aq-controls" style={{ marginBottom: 18 }}>
          {(['none', 'diag', 'perm', 'rownorm'] as Constraint[]).map((k) => (
            <SegButton key={k} active={constraint === k} onClick={() => setConstraint(k)}>{META[k].name.split('/')[0]}</SegButton>
          ))}
        </div>
        <MatrixGrid cells={MATRICES[constraint]} size={104} />
        <div className="aq-legend" style={{ marginTop: 18 }}>
          <span><i className="aq-dot" style={{ background: '#228d5c' }} />一般仿射（本方法）</span>
          <span><i className="aq-dot" style={{ background: '#f07e47' }} />受约束的特例</span>
        </div>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">退化为 {meta.name}</div>
        <p className="aq-body">{meta.desc}</p>
        <p className="aq-note">切换约束观察矩阵结构：对角、置换、逐行归一都是<b>一般仿射的受约束特例</b>。</p>
        <Feedback tone={meta.tone}>{meta.feedback}</Feedback>
      </div>
    </div>
  );
}