import React, { useState } from 'react';
import { ChapterFrame, TeachingSection } from '../rework/LearningFrame';

type StageId = 'literature' | 'ideation' | 'experiment' | 'writing' | 'rebuttal';

const stages: Array<{ id: StageId; title: string; role: string; read?: string; write: string }> = [
  { id: 'literature', title: 'Literature', role: '建立知识基础。', write: '外部文献与结构化知识 → Long-Term Knowledge Memory' },
  { id: 'ideation', title: 'Ideation', role: '基于已有知识提出研究方向。', read: 'Long-Term Knowledge Memory', write: 'Idea' },
  { id: 'experiment', title: 'Experiment', role: '把选中的 Idea 变成实验与证据。', read: 'selected Idea', write: 'Experiment + evidence' },
  { id: 'writing', title: 'Writing', role: '把证据组织成论文。', read: 'provenance + evidence chains', write: 'Manuscript' },
  { id: 'rebuttal', title: 'Rebuttal', role: '处理审稿反馈。', read: 'Manuscript · Review records · Prior rebuttal lessons', write: 'new Review records' },
];

export function SciFlowLifecycle({ onNext }: { onNext: () => void }) {
  const [selectedStage, setSelectedStage] = useState<StageId>('literature');
  const selected = stages.find((item) => item.id === selectedStage) ?? stages[0];

  return (
    <ChapterFrame
      section="§6"
      paperSection="论文 §4 SciFlow: Memory-Grounded Research Lifecycle"
      title="有了记忆以后，科研怎么真正跑起来？"
      subtitle="SciMem 负责“记住”，SciFlow 负责“执行”。"
      purpose={<><p>SciMem 已经解决了：<br />科研知识和项目状态如何被保存。</p><p>接下来还需要回答：<br />一个完整科研项目，如何被持续、可恢复地执行？</p><p><strong>SciFlow 就是 AutoSci 的 research lifecycle executor。</strong></p></>}
      map={[{ id: '4.1', label: '科研生命周期的五个阶段' }, { id: '4.2', label: 'Harness 如何保证长期执行' }]}
    >
      <TeachingSection number="4.1" title="科研生命周期的五个阶段">
        <div className="sciflow-lifecycle-lab" aria-label="五阶段科研生命周期">
          <div className="sciflow-stage-order"><span>研究顺序</span><small>不是阶段间的直接信息交接</small></div>
          <div className="sciflow-stage-track">
            {stages.map((stage, index) => <React.Fragment key={stage.id}>
              <button type="button" className={selectedStage === stage.id ? 'active' : ''} aria-pressed={selectedStage === stage.id} onClick={() => setSelectedStage(stage.id)}><span>{index + 1}</span><b>{stage.title}</b></button>
              {index < stages.length - 1 ? <i aria-hidden="true">→</i> : null}
            </React.Fragment>)}
          </div>
          <div className="sciflow-selected-stage" key={selected.id}>
            <div className="selected-stage-card"><span>CURRENT STAGE</span><b>{selected.title}</b><p>{selected.role}</p></div>
            <div className={`sciflow-memory-io ${selected.read ? 'has-read' : 'write-only'}`}>
              {selected.read ? <div className="memory-read"><span>SciMem → {selected.title}</span><b>Read</b><small>{selected.read}</small></div> : <div className="memory-read muted"><span>外部文献 → {selected.title}</span><b>Source</b><small>建立可写入的阅读材料</small></div>}
              <div className="shared-scimem"><span>SCIMEM</span><b>Shared Research Memory</b><small>结构化研究状态与知识</small></div>
              <div className="memory-write"><span>{selected.title} → SciMem</span><b>Write</b><small>{selected.write}</small></div>
            </div>
          </div>
        </div>
        <div className="sciflow-statement"><strong>科研生命周期通过 SciMem 交接。</strong><span>SciMem 保存状态，SciFlow 推进流程。</span></div>
      </TeachingSection>

      <div className="chapter-transition sciflow-lifecycle-transition"><strong>接下来看看：它们如何通过Harnesss Guarantees长时间、可恢复地执行。</strong><button type="button" className="primary-action" onClick={onNext}>了解 Harness →</button></div>
    </ChapterFrame>
  );
}
