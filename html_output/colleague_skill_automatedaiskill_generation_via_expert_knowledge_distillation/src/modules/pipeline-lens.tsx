import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge } from './colleague-ui';

type ProfileId = 'colleague' | 'public' | 'relationship';
type Track = 'capability' | 'behavior';
type SkillVariant = 'full' | 'work' | 'persona';

interface BuildSummary {
  profile: { id: ProfileId; icon: string; label: string } | null;
  scopes: Array<{ id: string; icon: string; label: string }>;
  materials: Array<{ id: string; icon: string; label: string }>;
}

const fallback: BuildSummary = {
  profile: { id: 'colleague', icon: '🧑‍💻', label: 'Colleague' },
  scopes: [{ id: 'docs', icon: '📄', label: 'Documents' }],
  materials: [
    { id: 'review', icon: '🟠', label: 'Code Review Threads' },
    { id: 'incident', icon: '🚨', label: 'Incident Notes' },
    { id: 'chat', icon: '💬', label: 'Slack / WeChat Discussions' },
  ],
};

const stages = [
  { number: '01', label: 'COLLECT + PARSE' },
  { number: '02', label: 'PRESET ROUTER' },
  { number: '03', label: 'DUAL DISTILL' },
  { number: '04', label: 'ARTIFACT WRITER' },
  { number: '05', label: 'PRODUCTIZATION' },
];

const presetRules: Record<ProfileId, { icon: string; label: string; rules: string[] }> = {
  colleague: { icon: '🧑‍💻', label: 'Colleague', rules: ['Work traces', 'Enterprise / local', 'Organizational access', 'Internal boundary'] },
  public: { icon: '🎙️', label: 'Public Figure', rules: ['Public evidence', 'First-person sources', 'Citation discipline', 'No private inference'] },
  relationship: { icon: '💬', label: 'Relationship', rules: ['Private traces', 'Consent required', 'Local control', 'Non-public default'] },
};

const dualCards = [
  { id: 'auth', text: '先检查 authentication', correct: 'capability' as Track },
  { id: 'escalate', text: 'P0 直接 escalation', correct: 'capability' as Track },
  { id: 'rollback', text: 'Rollback 前检查一致性', correct: 'capability' as Track },
  { id: 'conclusion', text: '回答问题时先给结论', correct: 'behavior' as Track },
  { id: 'uncertain', text: '对不确定问题明确保留', correct: 'behavior' as Track },
  { id: 'tone', text: 'Code Review 语气简短直接', correct: 'behavior' as Track },
];

const governance = [
  ['Local-first Storage', 'Collector + Parser'],
  ['Source Boundary', 'Preset Router'],
  ['Provenance + Evidence', 'Dual Distill'],
  ['Correction · Version · Rollback', 'Artifact Writer'],
  ['Optional Gallery', 'Productization'],
] as const;

const traceFormats = [
  { icon: '💬', label: 'thread_reply_09:12' },
  { icon: '↪️', label: 'quoted_message' },
  { icon: '📎', label: 'attachment.md' },
  { icon: '🧵', label: 'nested_thread_export' },
  { icon: '📧', label: 'forwarded_chain.eml' },
  { icon: '📝', label: 'inline_comment' },
  { icon: '🕘', label: 'timestamped_note' },
  { icon: '🔖', label: 'flagged_excerpt' },
  { icon: '📄', label: 'raw_document_page' },
  { icon: '💻', label: 'review_diff_hunk' },
  { icon: '⚠️', label: 'incident_fragment' },
  { icon: '🗂️', label: 'legacy_export.txt' },
] as const;

const packageVariants: Array<{ id: SkillVariant; label: string; scope: string }> = [
  { id: 'full', label: 'FULL', scope: 'work.md + persona.md' },
  { id: 'work', label: 'WORK ONLY', scope: 'work.md' },
  { id: 'persona', label: 'PERSONA ONLY', scope: 'persona.md' },
];

const readSummary = (): BuildSummary => {
  try {
    const raw = window.sessionStorage.getItem('colleague-skill:s2-build');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as BuildSummary;
    return parsed.profile && parsed.materials?.length ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readVariant = (): SkillVariant => {
  try {
    const value = window.sessionStorage.getItem('colleague-skill:variant');
    return value === 'work' || value === 'persona' ? value : 'full';
  } catch { return 'full'; }
};

export const PipelineLens: React.FC<WidgetProps> = () => {
  const [summary, setSummary] = useState<BuildSummary>(fallback);
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [normalized, setNormalized] = useState(false);
  const [presetPreview, setPresetPreview] = useState<ProfileId>('colleague');
  const [routerApplied, setRouterApplied] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Track>>({});
  const [distillChecked, setDistillChecked] = useState(false);
  const [distilled, setDistilled] = useState(false);
  const [writerPhase, setWriterPhase] = useState(0);
  const [mapped, setMapped] = useState(false);
  const [host, setHost] = useState<string | null>(null);
  const [variant, setVariant] = useState<SkillVariant>(readVariant);

  useEffect(() => {
    const value = readSummary();
    setSummary(value);
    setPresetPreview(value.profile?.id || 'colleague');
    const onVariant = (event: Event) => setVariant((event as CustomEvent<SkillVariant>).detail);
    window.addEventListener('colleague-skill:variant', onVariant);
    return () => window.removeEventListener('colleague-skill:variant', onVariant);
  }, []);

  useEffect(() => {
    if (writerPhase !== 1 && writerPhase !== 2) return undefined;
    const timer = window.setTimeout(
      () => setWriterPhase(phase => Math.min(3, phase + 1)),
      writerPhase === 1 ? 650 : 700,
    );
    return () => window.clearTimeout(timer);
  }, [writerPhase]);

  const markComplete = (index: number) => {
    setCompleted(items => items.includes(index) ? items : [...items, index]);
  };

  const maxUnlocked = Math.min(4, completed.length);
  const activeProfile = summary.profile?.id || 'colleague';
  const previewRules = presetRules[presetPreview];
  const normalizedNames = summary.materials.length ? summary.materials : fallback.materials;
  const rawFragments = useMemo(() => traceFormats.map((format, index) => {
    const source = normalizedNames[index % normalizedNames.length];
    return {
      id: `${source.id}-${index}`,
      icon: format.icon,
      label: format.label,
      sourceLabel: source.label,
      sourceIcon: source.icon,
    };
  }), [normalizedNames]);
  const assignmentCount = Object.keys(assignments).length;
  const assignmentsCorrect = useMemo(() => dualCards.every(card => assignments[card.id] === card.correct), [assignments]);

  const assign = (id: string, track: Track) => {
    setAssignments(currentAssignments => ({ ...currentAssignments, [id]: track }));
    setSelectedCard(null);
    setDistillChecked(false);
  };

  const validateDistill = () => {
    setDistillChecked(true);
    if (!assignmentsCorrect) return;
    setDistilled(true);
    markComplete(2);
  };

  const chooseVariant = (next: SkillVariant) => {
    setVariant(next);
    setHost(null);
    try {
      window.sessionStorage.setItem('colleague-skill:variant', next);
      window.dispatchEvent(new CustomEvent('colleague-skill:variant', { detail: next }));
    } catch { /* Later chapters still fall back to FULL. */ }
  };

  const activeVariant = packageVariants.find(item => item.id === variant) || packageVariants[0];

  return <div className="paper-widget expert-workbench">
    <header className="workbench-header">
      <div><span>PERSON-GROUNDED DISTILLATION WORKBENCH</span><b>亲手跑一次 Pipeline</b></div>
      <p>不是重画 Figure 1。每完成一站，用右下角 NEXT 进入下一步。</p>
    </header>

    <div className="workbench-stages" role="group" aria-label="五阶段工作台">
      {stages.map((stage, index) => {
        const locked = index > maxUnlocked;
        return <button type="button" key={stage.number} disabled={locked} className={`${current === index ? 'active' : ''}${completed.includes(index) ? 'complete' : ''}`} onClick={() => setCurrent(index)}>
          <span>{completed.includes(index) ? '✓' : stage.number}</span><b>{stage.label}</b><small>{locked ? 'LOCKED' : completed.includes(index) ? 'DONE' : current === index ? 'RUNNING' : 'READY'}</small>
        </button>;
      })}
    </div>

    <section className={`workbench-body${completed.includes(current) && current < stages.length - 1 ? ' has-next' : ''}`}>
      {current === 0 && <div className="station station-intake">
        <header><StateBadge tone="current">01</StateBadge><div><b>Trace Intake · Collector + Parser</b><p>Two material sources can contain many messy trace fragments.</p><small>S2 选择的是材料范围，不是 Trace 条数。先收集散乱记录，再解析成统一格式。</small></div></header>
        <div className={`heterogeneous-traces${normalized ? ' is-normalized' : ''}`}>
          {rawFragments.map((fragment, index) => <div key={fragment.id} className={`hetero-trace trace-shape-${index}`}>
            <span>{fragment.icon}</span><b>{fragment.label}</b><small>{fragment.sourceIcon} {fragment.sourceLabel}</small>
          </div>)}
          <div className={`knowledge-directory${normalized ? ' is-visible' : ''}`}>
            <b>COLLECTOR · {rawFragments.length} fragments captured from {normalizedNames.length} material sources</b>
            <strong>PARSER · local knowledge/{summary.profile?.id || 'person'}/records</strong>
            {rawFragments.slice(0, 6).map((fragment, index) => <code key={fragment.id}>├── trace_{String(index + 1).padStart(3, '0')}.json · {fragment.label}</code>)}
            <code>└── … {rawFragments.length - 6} more normalized records</code>
            <span>Source boundary retained ✓</span>
          </div>
        </div>
        <button type="button" className="station-action" onClick={() => { setNormalized(true); markComplete(0); }} disabled={normalized}>{normalized ? 'COLLECTED + PARSED ✓' : 'RUN COLLECTOR + PARSER'}</button>
        <aside className="station-note">Collector 负责把范围内的碎片收进来；Parser 负责统一结构，同时保留每条记录的来源边界。</aside>
      </div>}

      {current === 1 && <div className="station station-router">
        <header><StateBadge tone="current">02</StateBadge><div><b>Preset Router</b><p>同一台蒸馏机器，不同的证据规则。</p><small>Preset 不改变 Skill 的基本结构；它改变数据边界、Prompt、Consent 与运行规则。</small></div></header>
        <div className="preset-routes">
          <span>Incoming</span><i>→</i>
          <div>{(Object.keys(presetRules) as ProfileId[]).map(id => <button type="button" key={id} className={`${presetPreview === id ? 'preview' : ''}${activeProfile === id ? 'from-s2' : ''}`} onClick={() => setPresetPreview(id)}>
            <span>{presetRules[id].icon}</span><b>{presetRules[id].label}</b>{activeProfile === id && <small>S2 SELECTED ✓</small>}
          </button>)}</div>
        </div>
        <div className="preset-parameters"><b>{previewRules.icon} {previewRules.label} configuration</b>{previewRules.rules.map(rule => <span key={rule}>{rule}</span>)}</div>
        <div className="router-actions"><button type="button" onClick={() => setPresetPreview(activeProfile)}>恢复 S2 Preset</button><button type="button" className="station-action" disabled={routerApplied} onClick={() => { setPresetPreview(activeProfile); setRouterApplied(true); markComplete(1); }}>APPLY S2 PRESET</button></div>
        <aside className="station-note">三种 Profile 不是三套系统，而是同一个 Pipeline 加不同 Preset Configuration。</aside>
      </div>}

      {current === 2 && <div className="station station-distill">
        <header><StateBadge tone="current">03</StateBadge><div><b>Dual Distill</b><p>把判断拖到“怎么做事”，把表达偏好拖到“怎么互动”。</p><small>拖拽卡片；移动端也可以先点卡片，再点目标轨道。</small></div></header>
        <div className="dual-source-cards">
          {dualCards.filter(card => !assignments[card.id]).map(card => <button type="button" draggable key={card.id} className={selectedCard === card.id ? 'selected' : ''} onDragStart={event => event.dataTransfer.setData('text/plain', card.id)} onClick={() => setSelectedCard(card.id)}>{card.text}</button>)}
          {!dualCards.some(card => !assignments[card.id]) && <span>所有卡片已进入轨道，准备验证。</span>}
        </div>
        <div className="dual-track-zones">
          {(['capability', 'behavior'] as Track[]).map(track => <button type="button" key={track} className={`dual-zone zone-${track}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); assign(event.dataTransfer.getData('text/plain'), track); }} onClick={() => selectedCard && assign(selectedCard, track)}>
            <span>{track === 'capability' ? '🧠' : '💬'}</span><b>{track === 'capability' ? 'CAPABILITY TRACK' : 'BEHAVIOR TRACK'}</b><small>{track === 'capability' ? 'How they WORK' : 'How they INTERACT'}</small>
            <div>{dualCards.filter(card => assignments[card.id] === track).map(card => <i key={card.id} onClick={event => { event.stopPropagation(); setSelectedCard(card.id); setAssignments(currentAssignments => { const next = { ...currentAssignments }; delete next[card.id]; return next; }); }}>{card.text}</i>)}</div>
          </button>)}
        </div>
        <button type="button" className="station-action" disabled={assignmentCount < dualCards.length || distilled} onClick={validateDistill}>DISTILL &amp; VERIFY</button>
        {distillChecked && !assignmentsCorrect && <p className="distill-error">还有卡片放错轨道：工作判断属于 Capability，表达和互动偏好属于 Behavior。</p>}
        {distilled && <div className="distill-result">
          <div><b>Capability</b><span>Responsibilities · Workflows · Technical standards · Review criteria · Decision heuristics · Lessons</span></div>
          <div><b>Behavior</b><span>Expression preferences · Interaction rules · Behavior constraints · Correction records</span></div>
                  <strong>Knowing how the target person works is not the same as copying how they sound.</strong>
          <p>“怎么做事”和“怎么说话”必须分开。</p>
          <small>Capability + Behavior → FULL · Capability → WORK ONLY · Behavior → PERSONA ONLY<br />这也解释了前面为什么 Skill 可以被拆开调用。</small>
        </div>}
      </div>}

      {current === 3 && <div className="station station-writer">
        <header><StateBadge tone="current">04</StateBadge><div><b>Artifact Writer</b><p>Capability 与 Behavior 最后存到哪里？</p><small>文件按依赖关系分层生成，而不是一次全部堆出来。</small></div></header>
        <div className={`writer-scene writer-phase-${writerPhase}${mapped ? ' is-mapped' : ''}`}>
          <div className="writer-tracks"><span>Capability</span><span>Behavior</span></div>
          <div className="writer-core">ARTIFACT WRITER</div>
          <div className="writer-files">
            <div className="file-level level-one"><b>work.md</b><b>persona.md</b></div>
            <div className="file-level level-two"><b>work_skill.md</b><b>persona_skill.md</b></div>
            <div className="file-level level-three"><b>SKILL.md</b><b>manifest.json</b><b>meta.json</b></div>
          </div>
          <div className="aml-remap">
            <div><b>A · ARTIFACT</b><span>SKILL.md · work.md · persona.md · work_skill.md · persona_skill.md</span></div>
            <div><b>M · METADATA</b><span>manifest.json · meta.json</span></div>
            <div><b>L · LIFECYCLE</b><span>version · correction count · rollback state · provenance</span></div>
            <strong>S = (A, M, L)</strong>
          </div>
        </div>
        {writerPhase === 0 && <button type="button" className="station-action" onClick={() => setWriterPhase(1)}>PACKAGE THE SKILL</button>}
        {writerPhase >= 3 && !mapped && <button type="button" className="station-action" onClick={() => { setMapped(true); markComplete(3); }}>MAP TO S = (A, M, L)</button>}
        {mapped && <aside className="station-note success">S2 的 A/M/L 是抽象定义；这些文件与生命周期状态是它的工程实现。</aside>}
      </div>}

      {current === 4 && <div className="station station-product">
        <header><StateBadge tone="current">05</StateBadge><div><b>Productization</b><p>先从同一蒸馏结果选择调用范围，再进入 Agent Host。</p><small>变体只改变加载的 Artifact 范围；Metadata 与 Lifecycle 始终保留，Gallery 仍是可选路径。</small></div></header>
        <div className="productization-map">
          <div className="product-source-package"><b>SAME DISTILLED ARTIFACT</b><span>work.md · persona.md</span><small>metadata + lifecycle retained</small></div>
          <i>→</i>
          <div className="package-mode-picker">
            <span>PACKAGE MODE</span>
            <div>{packageVariants.map(item => <button type="button" key={item.id} className={variant === item.id ? 'active' : ''} onClick={() => chooseVariant(item.id)}><b>{item.label}</b><small>{item.scope}</small></button>)}</div>
            <p><b>{activeVariant.label}</b> 只决定本次调用入口；Pipeline 没有重新运行。</p>
          </div>
          <i>→</i>
          <div className="host-options">{['Codex', 'Claude Code', 'Other Agent Hosts'].map(item => <button type="button" key={item} className={host === item ? 'active' : ''} onClick={() => setHost(item)}>{item}</button>)}<span>Gallery <small>OPTIONAL</small></span></div>
        </div>
        <button type="button" className="station-action" disabled={!host || completed.includes(4)} onClick={() => markComplete(4)}>INSTALL TO SELECTED HOST</button>
        {completed.includes(4) && <div className="pipeline-complete-message"><b>Governability is not a final checkbox. It is built into the pipeline.</b><p>“可治理”不是最后加的一张许可证，而是从输入到分发始终存在的边界。</p></div>}
      </div>}

      {completed.includes(current) && current < stages.length - 1 && <button type="button" className="station-next" onClick={() => setCurrent(current + 1)}>
        NEXT <span aria-hidden="true">→</span>
      </button>}
    </section>

    <div className="workbench-governance" aria-label="贯穿五阶段的治理轨">
      <div className="governance-title"><span>GOVERNANCE RAIL</span><b>不是第六个 Stage</b></div>
      <div>{governance.map(([label, stage], index) => <span key={label} className={completed.includes(index) ? 'active' : ''}><i>{completed.includes(index) ? '✓' : '○'}</i><b>{label}</b><small>{stage}</small></span>)}</div>
    </div>

    <div className={`feedback ${completed.includes(4) ? 'good' : ''}`}>{completed.includes(4) ? '五个阶段已跑通；S2 的 Portable、Inspectable、Composable、Correctable 与 Governable 现在都有了工程原因。' : `当前进度 ${completed.length}/5：完成当前动作后，点击右下角 NEXT 继续。`}</div>
  </div>;
};

export default PipelineLens;
