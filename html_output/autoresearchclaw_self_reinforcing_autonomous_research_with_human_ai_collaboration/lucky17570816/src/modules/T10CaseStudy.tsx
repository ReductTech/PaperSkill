import { useState, type CSSProperties } from 'react';
import { Reveal } from '../lib/useInViewReveal';

export type T10Mode = 'full-auto' | 'warning' | 'copilot' | 'conclusion';

const steps: Array<{ id: T10Mode; label: string }> = [
  { id: 'full-auto', label: '1 · Full-Auto' }, { id: 'warning', label: '2 · Semantic Collapse' }, { id: 'copilot', label: '3 · CoPilot' }, { id: 'conclusion', label: '4 · Takeaway' },
];

export function T10CaseStudy() {
  const [mode, setMode] = useState<T10Mode>('full-auto');
  return <Reveal className={`t10-case-study mode-${mode}`} aria-labelledby="t10-title">
    <div className="case-heading"><span>Case Study · Topic T10</span><h3 id="t10-title">执行成功，不等于科学比较成功</h3><p>小样本模型选择中的交叉验证策略比较。</p></div>
    <div className="case-steps" role="tablist" aria-label="T10 案例步骤">{steps.map((step) => <button key={step.id} role="tab" aria-selected={mode === step.id} aria-controls="t10-case-screen" onClick={() => setMode(step.id)}>{step.label}</button>)}</div>
    <div className="case-screen" id="t10-case-screen" tabIndex={0}>
      <article className="auto-panel"><header><span>Full-Auto</span><b>运行完成 ✓</b></header><div className="flat-bars">{Array.from({ length: 8 }, (_, index) => <i key={index}><span>CV-{index + 1}</span><b /></i>)}</div><small>8 种策略均输出相同的 zero-bias 结果</small></article>
      <div className="case-divider"><i>⇄</i><strong>{mode === 'warning' ? 'SEMANTIC\nCOLLAPSE' : '实验语义\n高杠杆介入'}</strong><span>{mode === 'warning' ? '数值真实，但无法回答比较问题' : 'CoPilot 在实验语义、时间预算、主张边界处介入'}</span></div>
      <article className="copilot-panel"><header><span>CoPilot</span><b>可比较证据 ✓</b></header><div className="contrast-lines">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ '--offset': `${16 + ((index * 11) % 64)}%` } as CSSProperties}><span>pipeline {index + 1}</span><b /></i>)}</div><small>9 条 pipeline 出现可区分的非零对比；图形仅表达差异，非论文未报告数值。</small></article>
    </div>
    <div className="case-conclusion" role="status" aria-live="polite"><b>Execution success ≠ scientific success</b><span>{mode === 'conclusion' ? 'CoPilot 的价值在于：让实验回答原本的研究问题，而非只产出一个完成的文件。' : '点击步骤，观看从“看似完成”到“可进行科学比较”的转折。'}</span></div>
  </Reveal>;
}
