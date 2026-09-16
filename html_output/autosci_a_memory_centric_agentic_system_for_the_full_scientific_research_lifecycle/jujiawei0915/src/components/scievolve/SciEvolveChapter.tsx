import React, { useState } from 'react';
import { ChapterFrame, TeachingSection } from '../rework/LearningFrame';

type EvolutionPath = 'dream' | 'forge' | 'morph';
type MorphMode = 'prune' | 'verification' | 'operator';

const environments = [
  { id: 'user', label: 'User Environment', signals: 'Instructions · Corrections · Research Preferences' },
  { id: 'task', label: 'Task Environment', signals: 'Stage Outcomes · Experimental Evidence · Failure Reasons' },
  { id: 'open', label: 'Open Environment', signals: 'New Papers · Codebases · Venue Expectations' },
];

const loopItems = ['Research', 'Feedback / Traces', 'Signal Repository', 'Recurring Pattern', '/dream · /forge · /morph', 'Versioned Updates', 'Next Research Cycle'];

export function SciEvolveChapter({ onNext }: { onNext: () => void }) {
  const [signalSource, setSignalSource] = useState<string | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [evolutionTriggered, setEvolutionTriggered] = useState(false);
  const [selectedPath, setSelectedPath] = useState<EvolutionPath | null>(null);
  const [dreamRan, setDreamRan] = useState(false);
  const [forgeRan, setForgeRan] = useState(false);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [morphRan, setMorphRan] = useState(false);
  const [morphMode, setMorphMode] = useState<MorphMode>('verification');
  const [loopStep, setLoopStep] = useState(0);

  const patternDetected = feedbackCount >= 3;
  const selectedPathRan = selectedPath === 'dream' ? dreamRan : selectedPath === 'forge' ? forgeRan : selectedPath === 'morph' ? morphRan : false;

  return (
    <ChapterFrame
      section="§8"
      paperSection="论文 §6 SciEvolve: Full-System Evolution"
      title="记住经验，还不算真正的“进化”"
      subtitle="SciEvolve：让反馈开始改变系统本身"
      purpose={<><p>SciMem 已经可以保存科研经验。</p><p>但如果系统总是在同一个地方犯错，<br />只把失败记录下来还不够。</p><p>SciEvolve 要做的是：<br /><strong>把反复出现的反馈，转化为对系统本身的受控更新。</strong></p></>}
      map={[{ id: '6.1', label: '什么会推动系统发生self-evolution？' }, { id: '6.2', label: '反馈如何成为受控更新？' }]}
    >
      <TeachingSection number="6.1" title="什么会推动系统发生self-evolution？">
        <div className="signal-source-lab">
          <div className="environment-signals">{environments.map((environment) => <button type="button" key={environment.id} className={signalSource === environment.id ? 'active' : ''} onClick={() => setSignalSource(environment.id)}><b>{environment.label}</b><small>{environment.signals}</small></button>)}</div>
          <div className={`signal-repository ${signalSource ? 'receiving' : ''}`}><span>SIGNAL REPOSITORY</span><b>{signalSource ? environments.find((item) => item.id === signalSource)?.label : '等待 environment signal'}</b><small>{signalSource ? 'signal → repository' : '选择一个 environment'}</small></div>
        </div>
        <div className="recurring-pattern-lab">
          <div><span>CONCEPTUAL DEMO</span><b>unsupported claim</b><section>{Array.from({ length: feedbackCount }).map((_, index) => <i key={index}>unsupported claim</i>)}</section></div>
          {!patternDetected ? <button type="button" className="primary-action" onClick={() => setFeedbackCount((count) => Math.min(count + 1, 3))}>加入一条 feedback</button> : <button type="button" className="primary-action" onClick={() => setEvolutionTriggered(true)}>Trigger Evolution</button>}
          {feedbackCount === 0 ? <p>单个反馈会被保存，但不会直接触发 system update。</p> : !patternDetected ? <p>反馈先被积累；单条或偶发 signal 不等于系统应立即改变。</p> : <div className="recurring-detected"><b>Recurring Pattern Detected</b><span>这是教学动画，不表示论文规定具体阈值。</span></div>}
        </div>
        <p className="evolve-one-line">反馈先被积累。当某种模式反复出现，SciEvolve 才据此提出相应系统更新。</p>
      </TeachingSection>

      <TeachingSection number="6.2" title="反复出现的反馈，怎样变成受控更新？">
        {evolutionTriggered ? <div className="evolution-path-lab">
          <div className="evolution-path-tabs">{(['dream', 'forge', 'morph'] as EvolutionPath[]).map((path) => <button type="button" key={path} className={selectedPath === path ? 'active' : ''} onClick={() => setSelectedPath(path)}><b>/{path}</b><span>→ {path === 'dream' ? 'SciMem' : path === 'forge' ? 'SciFlow' : 'SciDAG'}</span></button>)}</div>
          {!selectedPath ? <p className="evolution-path-hint">选择一条路径，只查看当前模块的更新方式。</p> : null}
          {selectedPath === 'dream' ? <div className={`evolution-path-detail dream ${dreamRan ? 'ran' : ''}`}><span>/dream → SciMem</span><h3>让越来越大的 Memory 仍然有用</h3><div className="dream-memory-items"><b>Stale Entry</b><b>Redundant Notes</b><b>Related Concept A</b><b>Related Concept B</b></div>{!dreamRan ? <button type="button" className="primary-action" onClick={() => setDreamRan(true)}>Run /dream</button> : <div className="dream-results"><b>Stale Entry → down-weight / archive</b><b>Redundant Notes → compress</b><b>Concept A + B → consolidate</b><b>propose new associations</b></div>}<p>/dream 维护的是 SciMem 的组织与可用性。</p></div> : null}
          {selectedPath === 'forge' ? <div className={`evolution-path-detail forge ${forgeRan ? 'ran' : ''}`}><span>/forge → SciFlow</span><h3>让“失败的教训”推动研究协议更新</h3><div className="forge-traces"><b>Unsupported Claim</b><b>Unsupported Claim</b><b>Review Warning</b><strong>Recurring Pattern: Weak claim-evidence checking</strong></div>{!forgeRan ? <button type="button" className="primary-action" onClick={() => setForgeRan(true)}>Run /forge</button> : <div className="forge-update"><b>Writing Skill v1</b><i>↓ Add stronger claim-evidence checks ↓</i><strong>Writing Skill v2</strong><span>Before: claim → write</span><span>After: claim → evidence check → write</span></div>}<button type="button" className="quiet-action protocol-toggle" onClick={() => setProtocolOpen((open) => !open)}>{protocolOpen ? '收起 protocol 组成' : '查看 skill protocol 组成'}</button>{protocolOpen ? <div className="protocol-detail">Inputs · Required SciMem Context · Execution Steps · Checks · Output Artifacts · Handoff Rules</div> : null}<small>Example based on the paper&apos;s described update mechanism.</small><p>/forge 修改的是研究协议，不只是改一句 Prompt。</p></div> : null}
          {selectedPath === 'morph' ? <div className={`evolution-path-detail morph ${morphRan ? 'ran' : ''}`}><span>/morph → SciDAG</span><h3>让 DAG template 根据反馈被修订</h3><div className="morph-mode-tabs">{([{ id: 'prune', label: 'Prune Branch' }, { id: 'verification', label: 'Add Verification' }, { id: 'operator', label: 'Revise Operator' }] as Array<{ id: MorphMode; label: string }>).map((item) => <button type="button" key={item.id} className={morphMode === item.id ? 'active' : ''} onClick={() => setMorphMode(item.id)}>{item.label}</button>)}</div><div className="morph-template"><b>Template v1</b><i>→</i>{morphMode === 'prune' ? <strong>Prune weak branch</strong> : morphMode === 'verification' ? <strong>Add Verification Node</strong> : <strong>Revise operator role / prompt / tool configuration</strong>}{morphRan ? <em>→ Template v2</em> : null}</div>{!morphRan ? <button type="button" className="primary-action" onClick={() => setMorphRan(true)}>Run /morph</button> : <p>根据重复低质量输出等信号，提出这一项 template update。</p>}</div> : null}
          {selectedPath && selectedPathRan ? <div className="auditable-change-log"><span>VERSIONED · AUDITABLE</span><b>{selectedPath === 'dream' ? 'SciMem organization' : selectedPath === 'forge' ? 'Writing Skill' : 'DAG Template'} v1 → v2</b><p>Reason: recurring feedback pattern</p><small>Change Log 保留更新原因与更新内容；旧版本不会神秘消失。</small></div> : null}
        </div> : <div className="evolution-path-locked"><b>先识别 recurring pattern</b><span>三条 Evolution Path 才会开放。</span></div>}
      </TeachingSection>

      <section className="evolution-loop" aria-label="SciEvolve 闭环">
        <div className="evolution-loop-items">{loopItems.map((item, index) => <React.Fragment key={item}><b className={loopStep === index + 1 ? 'active' : loopStep > index + 1 ? 'done' : ''}>{item}</b>{index < loopItems.length - 1 ? <i>↓</i> : null}</React.Fragment>)}</div>
        {loopStep < loopItems.length ? <button type="button" className="primary-action" onClick={() => setLoopStep((step) => step + 1)}>{loopStep === 0 ? 'Run Evolution Loop' : '推进闭环 →'}</button> : <button type="button" className="quiet-action" onClick={() => setLoopStep(0)}>重新查看闭环</button>}
      </section>

      <div className="chapter-transition"><strong>现在 AutoSci 已经能够：Remember · Execute · Augment · Evolve。</strong><p>这些机制在现实中是否真的有效需要实验验证</p><button type="button" className="primary-action" onClick={onNext}>进入 Case Studies &amp; Evaluation →</button></div>
    </ChapterFrame>
  );
}
