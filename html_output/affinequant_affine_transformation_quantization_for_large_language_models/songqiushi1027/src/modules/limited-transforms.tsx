import { useState } from 'react';
import type { WidgetProps } from './registry';
import { MatrixGrid, SegButton, Feedback } from './aqKit';
import type { CellSpec } from './aqKit';

type Kind = 'diag' | 'perm' | 'ortho' | 'affine';

const MATRICES: Record<Kind, CellSpec[][]> = {
  diag: [
    [{ label: 's₁', tone: 'red', on: true }, { label: '0', tone: 'none' }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: 's₂', tone: 'red', on: true }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: 's₃', tone: 'red', on: true }],
  ],
  perm: [
    [{ label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: '1', tone: 'orange', on: true }, { label: '0', tone: 'none' }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }],
  ],
  ortho: [
    [{ label: 'c', tone: 'orange', on: true }, { label: '−s', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: 's', tone: 'orange', on: true }, { label: 'c', tone: 'orange', on: true }, { label: '0', tone: 'none' }],
    [{ label: '0', tone: 'none' }, { label: '0', tone: 'none' }, { label: '1', tone: 'orange', on: true }],
  ],
  affine: [
    [{ label: 'a₁₁', tone: 'green', on: true }, { label: 'a₁₂', tone: 'green', on: true }, { label: 'a₁₃', tone: 'green', on: true }],
    [{ label: 'a₂₁', tone: 'green', on: true }, { label: 'a₂₂', tone: 'green', on: true }, { label: 'a₂₃', tone: 'green', on: true }],
    [{ label: 'a₃₁', tone: 'green', on: true }, { label: 'a₃₂', tone: 'green', on: true }, { label: 'a₃₃', tone: 'green', on: true }],
  ],
};

const META: Record<Kind, { name: string; constraint: string; freedom: number; err: number; why: string; feedback: string; tone: 'red' | 'orange' | 'green' }> = {
  diag: { name: '对角缩放（SmoothQuant）', constraint: 'A = diag(s₁, s₂, …)', freedom: 3, err: 0.88, why: '只有对角可调，不含非对角耦合，低比特下幅度失调难消除。', feedback: '只有对角可调，自由度最低，量化误差大。', tone: 'red' },
  perm: { name: '置换矩阵（RPTQ）', constraint: '每行每列恰好一个 1', freedom: 3, err: 0.82, why: '只能重新排列通道，仍是离散置换，无法连续缩放或旋转。', feedback: '每行每列只一个 1，仍是离散置换。', tone: 'orange' },
  ortho: { name: '正交旋转（QuaRot / SpinQuant）', constraint: 'AᵀA = I', freedom: 3, err: 0.74, why: '只做正交旋转，保范数但不含缩放和平移，自由度受限。', feedback: '正交旋转 AᵀA=I，不含缩放与平移。', tone: 'orange' },
  affine: { name: '一般可逆仿射（AffineQuant）', constraint: 'det(A) ≠ 0（可逆）', freedom: 9, err: 0.12, why: '缩放＋平移＋旋转同时具备，是所有前者的严格超集。', feedback: '一般可逆仿射，自由度最大，量化误差最小。', tone: 'green' },
};

export function LimitedTransforms(_props: WidgetProps) {
  const [kind, setKind] = useState<Kind>('diag');
  const meta = META[kind];
  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="aq-controls" style={{ marginBottom: 18 }}>
          {(['diag', 'perm', 'ortho', 'affine'] as Kind[]).map((k) => (
            <SegButton key={k} active={kind === k} onClick={() => setKind(k)}>{META[k].name.split('（')[0]}</SegButton>
          ))}
        </div>
        <MatrixGrid cells={MATRICES[kind]} size={80} />
        <div className="aq-legend" style={{ marginTop: 18, justifyContent: 'center' }}>
          <span><i className="aq-dot" style={{ background: '#c43f52' }} />对角/置换/正交（受限）</span>
          <span><i className="aq-dot" style={{ background: '#228d5c' }} />一般仿射（自由）</span>
        </div>
        <div className="aq-heading" style={{ marginTop: 22 }}>自由度（示意）：{meta.freedom}</div>
        <div style={{ width: '80%', maxWidth: 520, marginTop: 8 }}>
          <div className="aq-body muted">相对量化误差（示意）</div>
          <div style={{ height: 18, borderRadius: 999, background: '#eef2f7', overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${meta.err * 100}%`, height: '100%', background: kind === 'affine' ? '#228d5c' : '#c43f52', borderRadius: 999, transition: 'width 200ms ease' }} />
          </div>
        </div>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">{meta.name}</div>
        <p className="aq-formula">{meta.constraint}</p>
        <p className="aq-body">{meta.why}</p>
        <p className="aq-note">这些变换都是<b>可逆仿射</b>的严格子集：对角、置换、正交各自只能取仿射里的一小类。</p>
        <Feedback tone={meta.tone}>{meta.feedback}</Feedback>
      </div>
    </div>
  );
}