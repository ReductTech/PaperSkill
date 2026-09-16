import { useState } from 'react';
import { ChapterFrame } from '../rework/LearningFrame';

type CaseId = 'gpu' | 'biomedical';

const cases: Record<CaseId, { label: string; runtime: string; details: string[]; note?: string }> = {
  gpu: {
    label: 'GPU Kernel Optimization',
    runtime: '27.3 h',
    details: ['4× NVIDIA A40', 'Triton 3.2.0', 'PyTorch 2.6.0+cu124'],
    note: '正文主要以 GPU Case 展示完整执行过程。',
  },
  biomedical: {
    label: 'Biomedical Drug Discovery',
    runtime: '22.6 h',
    details: ['RTX 4060', 'DeepTernary / PROTAC-STAN', 'Boltz-2 cross-checks'],
  },
};

export function CaseStudiesChapter({ onNext }: { onNext: () => void }) {
  const [selectedCase, setSelectedCase] = useState<CaseId>('gpu');
  const currentCase = cases[selectedCase];

  return (
    <ChapterFrame
      section="§9"
      paperSection="论文 §7 Case Studies and Evaluation"
      title="AutoSci 现实中真的能跑起来了吗？"
      subtitle="从两个端到端 Case Study，看系统到底完成了什么。"
      purpose={<><p>前面讲的是 AutoSci 如何设计。</p><p>这一节开始看证据：<br />这些模块能不能真的组成一轮完整科研过程？</p></>}
      map={[
        { id: '9', label: 'Case Studies' },
        { id: '10', label: 'Conclusion' },
      ]}
      afterMapHeading="9 Case Studies"
    >
      <section className="case-selector" aria-label="Case Study Selector">
        <div className="case-selector-tabs">{(['gpu', 'biomedical'] as CaseId[]).map((caseId) => <button type="button" key={caseId} className={selectedCase === caseId ? 'active' : ''} onClick={() => setSelectedCase(caseId)}>{cases[caseId].label}</button>)}</div>
        <div className="case-overview" key={selectedCase}>
          <span>CASE STUDY</span><h3>{currentCase.label}</h3>
          <div>{currentCase.details.map((detail) => <b key={detail}>{detail}</b>)}</div>
          <strong>Runtime: {currentCase.runtime}</strong>
          {currentCase.note ? <p>{currentCase.note}</p> : null}
        </div>
      </section>

      <section className="evidence-limits" aria-label="Evidence and limitations">
        <div><span>What the evidence shows</span><b>End-to-end research execution</b><b>Structured memory</b><b>Idea screening</b><b>Real experiment execution</b><b>Manuscript-level artifact</b></div>
        <div><span>What remains open</span><b>Only two case studies</b><b>No formal peer review</b><b>Automated review is only a proxy</b><b>General evaluation remains limited</b></div>
      </section>
      <section className="case-final-statement"><strong>AutoSci 证明了这套系统可以跑起来，<br />但还没有充分证明它已经普遍有效。</strong></section>
      <div className="chapter-transition"><button type="button" className="primary-action" onClick={onNext}>进入 Conclusion →</button></div>
    </ChapterFrame>
  );
}
