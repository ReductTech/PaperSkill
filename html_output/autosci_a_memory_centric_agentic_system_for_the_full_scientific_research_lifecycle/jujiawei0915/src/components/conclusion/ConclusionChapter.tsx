import React from 'react';
import { ChapterFrame } from '../rework/LearningFrame';

const modules = [
  { name: 'SciMem', action: 'Remember' },
  { name: 'SciFlow', action: 'Execute' },
  { name: 'SciDAG', action: 'Augment' },
  { name: 'SciEvolve', action: 'Evolve' },
];

export function ConclusionChapter() {
  return (
    <ChapterFrame
      section="10 Conclusion"
      paperSection="论文 §9 Conclusion"
      title="AutoSci 最终说明了什么？"
      subtitle="从“自动完成一次研究”，走向“持续运行的科研系统”。"
      purpose={<p>讲解本文的核心结论以及局限性</p>}
      map={[]}
      showReadingMap={false}
    >
      <section className="conclusion-module-summary" aria-label="AutoSci 四个核心模块">
        <div className="conclusion-module-grid">{modules.map((module) => <div key={module.name}><b>{module.name}</b><span>{module.action}</span></div>)}</div>
        <strong>Persistent Research Environment</strong>
      </section>

      <section className="conclusion-contribution">
        <strong>AutoSci 把自动科研从“一次任务”，<br />重新定义成了一个能够执行、记忆并跨项目进化的长期系统问题。</strong>
        <span>Execute · Remember · Evolve Across Projects</span>
      </section>

      <section className="conclusion-limits" aria-label="Conclusion limitations">
        <div className="conclusion-evidence">
          <span>What AutoSci Has Shown</span>
          <b>Full research lifecycle</b><b>Structured persistent memory</b><b>DAG-based multi-agent augmentation</b><b>Versioned system evolution</b><b>Reviewable paper-level artifacts</b>
        </div>
        <div className="conclusion-open">
          <span>What Remains Open</span>
          <b>Not yet a science-specialized agent foundation</b><b>Evaluation remains underdeveloped</b><b>Only limited end-to-end case studies</b><b>Automated review is only a proxy</b><b>More systematic skill-level benchmarks are still needed</b>
        </div>
      </section>

      <section className="conclusion-closing">
        <strong>能跑完整科研流程，是 AutoSci 的起点；<br />如何证明它长期、普遍、可靠地做得更好，仍需下一步研究。</strong>
      </section>
    </ChapterFrame>
  );
}
