// Refinement 2026-10-22. Qualitative mechanism comparison based on Fig. 1, §3.2 and Fig. 9.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
const modes = [
  { name: '级联交互', route: ['空间 S', '时间 T', '空间 S', '时间 T'], problem: '空间和时间反复交替建模。作者在 Figure 9 中观察到 MS-GCN 的不同类别特征随层数加深趋于相近，动作边界更难区分；论文把这一现象称为过平滑。', verdict: '信息交流充分，却可能削弱细粒度差别。', style: 'bad' },
  { name: '单次交互', route: ['空间 S', '时间 T'], problem: '只在前面提取一次空间特征，后面只做时间建模，可以减少反复混合。但深层时间表示无法持续获得不同空间线索，作者认为交互又不够充分。', verdict: '减少反复混合，也可能限制后续信息交流。', style: '' },
  { name: 'DeST解耦', route: ['空间 S → 分组', 'Ŝ₁ → T₁', 'Ŝ₂ → T₂', 'Ŝ₃ → T₃'], problem: '一次空间建模产生不同子特征，分别注入不同时间层。空间信息持续参与，时间主干继续建模，而不是重复堆叠空间—时间块。', verdict: '一次提取空间线索，多层自适应交互。', style: 'good' },
];
export const DestCoupling: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0); const [compared, setCompared] = useState(false);
  const current = modes[mode];
  return <div className="dest-refined">
    <div className="ctrl">{modes.map((m, i) => <button key={m.name} className={'chip' + (mode === i ? ' active' : '')} aria-pressed={mode === i} onClick={() => setMode(i)}>{m.name}</button>)}<button className="chip" onClick={() => setCompared(s => !s)}>{compared ? '只看当前方式' : '开始同步对照'}</button></div>
    <div className="dest-coupling-panel">{modes.map((m, i) => (compared || mode === i) && <div key={m.name} className={'dest-comparison-row' + (mode === i ? ' is-focus' : '')}><strong>{m.name}</strong><div className="dest-route">{m.route.map((label, j) => <span key={j}>{label}</span>)}</div><p>{m.verdict}</p></div>)}</div>
    <div className={'feedback ' + current.style} aria-live="polite">{current.problem}</div>
    <p className="module-note">结构关系依据 Figure 1、§3.2；过平滑的定性证据见 Figure 9。此处没有绘制虚构的模型预测或训练曲线；示意层数不代表完整实现。</p>
  </div>;
};
