import React, { useState } from 'react';
import { ReadingMap, TeachingSection } from '../rework/LearningFrame';

const longTermEntities = ['Topic', 'Paper', 'Foundation', 'Concept', 'Method', 'People'];
const activeEntities = ['Idea', 'Experiment', 'Manuscript', 'Review'];
const nodeDescriptions: Record<string, string> = {
  Topic: '领域范围与高层观察',
  Paper: '结构化论文阅读记录',
  Foundation: '较稳定的背景知识',
  Concept: '可复用的科学概念',
  Method: '可复用技术方法及其作用',
  People: '研究人员相关信息',
};
const lifecycle: Record<string, string[]> = {
  Idea: ['proposed', 'testing', 'tested', 'validated / failed'],
  Experiment: ['planned', 'running', 'completed / abandoned'],
  Manuscript: ['drafting', 'revised', 'submitted', 'final'],
  Review: ['received feedback', 'rebuttal / revision', 'final decision'],
};

export function SciMemIntro({ onNext }: { onNext: () => void }) {
  const [memoryRegion, setMemoryRegion] = useState<'long-term' | 'active' | null>(null);
  const [graphBuilt, setGraphBuilt] = useState(false);
  const [node, setNode] = useState<string | null>(null);
  const [relation, setRelation] = useState<string | null>(null);
  const [activeEntity, setActiveEntity] = useState<string | null>(null);
  const [researchUpdated, setResearchUpdated] = useState(false);

  const projectItems = researchUpdated
    ? [['Idea A', 'validated'], ['Experiment #1', 'completed'], ['Experiment #2', 'completed'], ['Manuscript', 'revised'], ['Review', '尚未进入']]
    : [['Idea A', 'testing'], ['Experiment #1', 'completed'], ['Experiment #2', 'running'], ['Manuscript', 'drafting'], ['Review', '尚未进入']];

  return (
    <section className="learning-chapter scimem-chapter">
      <div className="learning-chapter-header">
        <span className="paper-section-tag">论文 §3 SciMem: Schema-Governed Research Memory</span>
        <div className="learning-section-number">§3</div>
        <h1>一套科研记忆，为什么要分成两部分？</h1>
        <p>长期知识要积累，当前项目状态也要随时更新。</p>
      </div>
      <aside className="chapter-purpose" aria-label="本节作用">
        <div className="chapter-purpose-label">本节作用</div>
        <div><p>AutoSci 要跨项目持续工作，首先必须解决一个问题：</p><p>科研中既有应该长期保存的知识，也有只属于当前项目、不断变化的研究状态。</p><p>SciMem 因此把记忆分成两个区域：<strong>Long-Term Knowledge Memory</strong> 和 <strong>Active Research Memory</strong>。</p></div>
      </aside>
      <ReadingMap section="§3" items={[
        { id: '3.1', label: '两种记忆分别负责什么？' },
        { id: '3.2', label: 'Long-Term Knowledge: 长期知识如何变成关系网' },
        { id: '3.3', label: 'Active Research Memory: 当前研究如何记录状态' },
        { id: '3.4', label: '经验怎样在两种记忆之间流动？' },
        { id: '3.5', label: '哪些内容有资格真正写进SciMem？' },
      ]} />

      <TeachingSection number="3.1" title="两种记忆分别负责什么？">
        <div className="memory-region-compare">
          <button type="button" className={`memory-region long-term ${memoryRegion === 'long-term' ? 'active' : ''}`} aria-expanded={memoryRegion === 'long-term'} onClick={() => setMemoryRegion('long-term')}>
            <span>LONG-TERM</span><strong>Long-Term Knowledge Memory</strong><em>“我已经知道什么”</em>
            {memoryRegion === 'long-term' ? <><div className="memory-entity-chips">{longTermEntities.map((item) => <b key={item}>{item}</b>)}</div><small>跨项目保留、逐步积累的科研知识。</small></> : null}
          </button>
          <button type="button" className={`memory-region active-memory ${memoryRegion === 'active' ? 'active' : ''}`} aria-expanded={memoryRegion === 'active'} onClick={() => setMemoryRegion('active')}>
            <span>ACTIVE</span><strong>Active Research Memory</strong><em>“我现在正在做什么”</em>
            {memoryRegion === 'active' ? <><div className="memory-entity-chips">{activeEntities.map((item) => <b key={item}>{item}</b>)}</div><small>当前项目中正在变化的研究对象和状态。</small></> : null}
          </button>
        </div>
        <div className="scimem-statement"><strong>Long-Term 负责“知道什么”，Active 负责“正在做什么”。</strong></div>
      </TeachingSection>

      <TeachingSection number="3.2" title="Long-Term Knowledge: 长期知识如何变成关系网？">
        <p className="section-lead">真正重要的是：知识之间有什么关系。</p>
        {!graphBuilt ? (
          <div className="flat-notes-stage">
            <div><span>Flat Notes</span><p>有内容，但关系很弱。</p></div>
            <div className="flat-note-cards">{['Paper A', 'Paper B', 'Paper C', 'Method X', 'Concept Y'].map((item) => <b key={item}>{item}</b>)}</div>
            <button type="button" className="primary-action" onClick={() => setGraphBuilt(true)}>建立关系</button>
          </div>
        ) : (
          <div className="knowledge-graph-stage" key="knowledge-graph">
            <div className="graph-map" aria-label="类型化科研关系图">
              <svg viewBox="0 0 760 360" aria-hidden="true"><path d="M380 61 L208 142 M380 61 L382 142 M380 61 L550 142 M208 190 L290 273 M382 190 L290 273 M382 190 L468 273 M550 190 L468 273 M208 190 L560 282" /></svg>
              {['Topic', 'Paper', 'Concept', 'Method', 'Foundation', 'People'].map((item) => <button key={item} type="button" className={`graph-node node-${item.toLowerCase()} ${node === item ? 'active' : ''}`} onClick={() => setNode(item)}>{item}</button>)}
            </div>
            <div className="graph-relation-controls"><span>typed relations</span>{['Paper → Concept', 'Paper → Method', 'Foundation → Concept'].map((item) => <button type="button" key={item} className={relation === item ? 'active' : ''} onClick={() => setRelation(item)}>{item}</button>)}</div>
            {node ? <div className="scimem-inline-detail"><b>{node}</b><span>{nodeDescriptions[node]}</span></div> : null}
            {relation ? <div className="scimem-inline-detail relation-detail"><b>{relation}</b><span>关系也有类型。</span><i>introduce</i><i>critique</i><i>apply</i><i>extend</i><i>ground</i></div> : null}
            <div className="semantic-properties"><div><b>Semantic Addressability</b><span>可以按实体类型和关系直接找到科研对象。</span></div><div><b>Incremental Extensibility</b><span>随着新文献和新项目加入，记忆可以持续扩展。</span></div></div>
          </div>
        )}
        <div className="scimem-statement"><strong>SciMem的关键，不是把更多笔记放进去，而是让知识可以被重新找到、理解和关联。</strong></div>
      </TeachingSection>

      <TeachingSection number="3.3" title="Active Research Memory:当前研究如何记录状态">
        <p className="section-lead">Active Research Memory 记录的是正在变化的科研状态。</p>
        <div className="active-memory-lab">
          <div className="active-entity-tabs">{activeEntities.map((item) => <button type="button" key={item} className={activeEntity === item ? 'active' : ''} onClick={() => setActiveEntity(item)}>{item}</button>)}</div>
          {activeEntity ? <div className="lifecycle-path" key={activeEntity}><b>{activeEntity}</b><div>{lifecycle[activeEntity].map((state, index) => <React.Fragment key={state}><span>{state}</span>{index < lifecycle[activeEntity].length - 1 ? <i>→</i> : null}</React.Fragment>)}</div></div> : null}
          <div className={`research-progress-board ${researchUpdated ? 'updated' : ''}`}>
            <span>MINI RESEARCH PROJECT</span>
            <div>{projectItems.map(([item, state]) => <p key={item}><b>{item}</b><em>{state}</em></p>)}</div>
            <button type="button" className="primary-action" onClick={() => setResearchUpdated(true)} disabled={researchUpdated}>{researchUpdated ? '研究状态已更新' : '更新一次研究状态'}</button>
          </div>
        </div>
        <div className="scimem-statement"><strong>系统不应该靠聊历史聊天记录来猜项目做到哪一步了。</strong><p>Active Research Memory 把当前项目变成可恢复、可检查的结构化状态。</p></div>
      </TeachingSection>

      <div className="chapter-transition"><strong>当前状态有变化后，可复用经验也需要持续积累。</strong><p>接下来，看看SciMem如何互相更新。</p><button type="button" className="primary-action" onClick={onNext}>进入 Memory Flow →</button></div>
    </section>
  );
}
