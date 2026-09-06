import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type CorrectionKind = 'capability' | 'behavior';
type SkillVersion = 'v1' | 'v2';
type SkillVariant = 'full' | 'work' | 'persona';
type Phase = 'start' | 'invoked' | 'diagnose' | 'correct' | 'version' | 'history' | 'confirm' | 'deploymentReady';

const lifecycle = [
  { label: 'Create', detail: 'v1 package' },
  { label: 'Inspect', detail: 'sources + artifacts' },
  { label: 'Invoke', detail: 'test the skill' },
  { label: 'Correct', detail: 'patch / behavior record' },
  { label: 'Version', detail: 'v2 + prior state' },
  { label: 'Ready', detail: 'current version selected' },
];
const initialCapabilityFeedback = 'Authentication should be checked first.';
const initialBehaviorFeedback = 'He would usually challenge risky assumptions first.';
const variantLabels: Record<SkillVariant, string> = { full: 'FULL', work: 'WORK ONLY', persona: 'PERSONA ONLY' };

const readVariant = (): SkillVariant => {
  try {
    const value = window.sessionStorage.getItem('colleague-skill:variant');
    return value === 'work' || value === 'persona' ? value : 'full';
  } catch { return 'full'; }
};

export const LifecycleCorrectionLab: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<Phase>('start');
  const [kind, setKind] = useState<CorrectionKind>('capability');
  const [applied, setApplied] = useState(false);
  const [looksRight, setLooksRight] = useState(false);
  const [capabilityFeedback, setCapabilityFeedback] = useState(initialCapabilityFeedback);
  const [behaviorFeedback, setBehaviorFeedback] = useState(initialBehaviorFeedback);
  const [currentVersion, setCurrentVersion] = useState<SkillVersion>('v1');
  const [showCompare, setShowCompare] = useState(false);
  const [rollbackNotice, setRollbackNotice] = useState(false);
  const [variant, setVariant] = useState<SkillVariant>(readVariant);

  useEffect(() => {
    const onVariant = (event: Event) => setVariant((event as CustomEvent<SkillVariant>).detail);
    window.addEventListener('colleague-skill:variant', onVariant);
    return () => window.removeEventListener('colleague-skill:variant', onVariant);
  }, []);

  const activeCount = phase === 'start' || phase === 'invoked' ? 3
    : phase === 'diagnose' || phase === 'correct' ? 4
      : phase === 'deploymentReady' ? 6 : 5;

  const persistCurrentVersion = (version: SkillVersion) => {
    try {
      window.sessionStorage.setItem('colleague-skill:s4-current-version', version);
      window.dispatchEvent(new CustomEvent('colleague-skill:s4-version', { detail: version }));
    } catch { /* Session handoff is an enhancement; the lifecycle remains usable without it. */ }
  };

  const chooseKind = (value: CorrectionKind) => {
    setKind(value);
    setApplied(false);
    setPhase('correct');
  };

  const resetLab = () => {
    setPhase('start');
    setKind('capability');
    setApplied(false);
    setLooksRight(false);
    setCapabilityFeedback(initialCapabilityFeedback);
    setBehaviorFeedback(initialBehaviorFeedback);
    setCurrentVersion('v1');
    setShowCompare(false);
    setRollbackNotice(false);
    persistCurrentVersion('v1');
  };

  const createVersion = () => {
    setCurrentVersion('v2');
    setRollbackNotice(false);
    persistCurrentVersion('v2');
    setPhase('version');
  };

  const confirmRollback = () => {
    setCurrentVersion('v1');
    setRollbackNotice(true);
    setShowCompare(false);
    persistCurrentVersion('v1');
    setPhase('history');
  };

  const markReady = () => {
    persistCurrentVersion(currentVersion);
    setPhase('deploymentReady');
  };

  const deployCurrentVersion = () => {
    persistCurrentVersion(currentVersion);
    const visibleChapter = document.getElementById('chap-5');
    if (visibleChapter) {
      visibleChapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const reveal = document.querySelector('#chap-4 .chap-loader-btn') as HTMLButtonElement | null;
    reveal?.click();
    window.setTimeout(() => document.getElementById('chap-5')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
  };

  const affectedVariants = kind === 'capability' ? 'FULL + WORK ONLY' : 'FULL + PERSONA ONLY';
  const currentVariantUsesCorrection = variant === 'full' || (kind === 'capability' ? variant === 'work' : variant === 'persona');

  return <div className={`paper-widget lifecycle-lab phase-${phase}`}>
    <header className="lifecycle-lab-header">
      <div><span>VERSIONED SKILL LIFECYCLE</span><b>A SKILL IS NEVER REALLY FINISHED</b></div>
      <div className="lifecycle-header-actions"><p>Create → Inspect → Invoke → Correct → Version → Ready</p>{phase !== 'start' && <button type="button" onClick={resetLab}>↺ RESET LAB</button>}</div>
    </header>

    <div className="lifecycle-rail" role="list" aria-label="Skill 生命周期">
      {lifecycle.map((item, index) => <div role="listitem" key={item.label} className={index < activeCount ? 'active' : ''}>
        <span>{index < activeCount ? '●' : '○'}</span><b>{String(index + 1).padStart(2, '0')} · {item.label}</b><small>{item.detail}</small>
      </div>)}
    </div>

    {(phase === 'start' || phase === 'invoked') && <section className="invoke-lab">
      <div className="skill-v1-card"><span>Senior Engineer Skill</span><b>Version: v1</b><strong>{variantLabels[variant]}</strong><small>✓ Packaged in S3</small></div>
      {phase === 'start' && <div className="invoke-empty">
        <p>Skill 已经生成。现在把它放进一次真实的 Code Review。</p>
        <button type="button" className="lifecycle-primary" onClick={() => setPhase('invoked')}>TRY THE SKILL</button>
      </div>}
      {phase === 'invoked' && <div className="invoke-case">
        <article className="review-request"><span>CODE REVIEW</span><b>POST /admin/export</b><code>No authentication<br />No input validation</code></article>
        <article className="wrong-answer"><span>AI · SKILL v1</span><p>“Maybe improve the variable naming first.”</p></article>
        <article className="review-trace"><span>🟠 REVIEW TRACE</span><p>“Authentication must be checked before lower-priority issues.”</p></article>
        <strong className="invoke-question">Does this look right?</strong>
        <div className="invoke-decisions">
          <button type="button" onClick={() => setLooksRight(true)}>✓ Looks right</button>
          <button type="button" className="lifecycle-primary" onClick={() => setPhase('diagnose')}>✎ Correct the Skill</button>
        </div>
        {looksRight && <p className="lifecycle-warning">⚠ 历史 Trace 与回答冲突。生成的第一版工件本来就可能不完整，请检查并纠正。</p>}
      </div>}
    </section>}

    {phase === 'diagnose' && <section className="correction-diagnose">
      <header><span>04 · WHAT IS WRONG?</span><b>Correction 有两条不同的更新路径</b><p>先判断错误发生在“怎么做事”，还是“怎么互动”。</p></header>
      <div>
        <button type="button" onClick={() => chooseKind('capability')}>
          <span>🧠</span><b>Capability Error</b><p>它做事的方法错了。</p><small>应该先检查 authentication，而不是 variable naming。</small><em>影响变体：FULL + WORK ONLY</em>
        </button>
        <button type="button" onClick={() => chooseKind('behavior')}>
          <span>💬</span><b>Behavior Error</b><p>它说话或互动的方式不对。</p><small>“He would not say that.” / “She would push back here.”</small><em>影响变体：FULL + PERSONA ONLY</em>
        </button>
      </div>
    </section>}

    {phase === 'correct' && <section className={`correction-editor correction-${kind}`}>
      <header>
        <div><span>04 · CORRECT</span><b>{kind === 'capability' ? '🧠 Capability → Markdown Patch' : '💬 Behavior → Correction Record'}</b></div>
        <div className="correction-switch"><button type="button" className={kind === 'capability' ? 'active' : ''} onClick={() => chooseKind('capability')}>Capability</button><button type="button" className={kind === 'behavior' ? 'active' : ''} onClick={() => chooseKind('behavior')}>Behavior</button></div>
      </header>

      {kind === 'capability' ? <div className="capability-patch-workspace">
        <article className={applied ? 'patched' : ''}>
          <span>work.md</span><b>## API Review</b>
          {applied ? <ol><li>Check authentication</li><li>Check input validation</li><li>Check rate limiting</li><li>Check response schema</li><li>Review lower-priority issues</li></ol>
            : <ol><li>Check naming</li><li>Check formatting</li><li>Check authentication</li></ol>}
        </article>
        <div className="correction-input">
          <label htmlFor="capability-feedback">Natural Language Feedback</label>
          <textarea id="capability-feedback" value={capabilityFeedback} onChange={event => setCapabilityFeedback(event.target.value)} />
          <div className="patch-flow"><span>Feedback</span><i>↓</i><span>Generate Patch</span><i>↓</i><span>Replace matching section</span></div>
          <button type="button" className="lifecycle-primary" disabled={!capabilityFeedback.trim() || applied} onClick={() => setApplied(true)}>{applied ? 'PATCH APPLIED ✓' : 'GENERATE MARKDOWN PATCH'}</button>
          <small title="匹配二级标题时替换原 section；没有匹配标题时追加内容。">ⓘ Patch 只更新相关 section，不重写整个 Skill。</small>
        </div>
      </div> : <div className="behavior-record-workspace">
        <article className="persona-file"><span>persona.md</span><b>Wrong response</b><p>“Sure! Great idea!”</p></article>
        <div className="correction-input">
          <label htmlFor="behavior-feedback">Natural Language Feedback</label>
          <textarea id="behavior-feedback" value={behaviorFeedback} onChange={event => setBehaviorFeedback(event.target.value)} />
          <button type="button" className="lifecycle-primary" disabled={!behaviorFeedback.trim() || applied} onClick={() => setApplied(true)}>{applied ? 'RECORD CREATED ✓' : 'CREATE CORRECTION RECORD'}</button>
        </div>
        {applied && <article className="correction-record">
          <span>CORRECTION RECORD · {'{scene, wrong, correct}'}</span>
          <div><b>Scene</b><p>Risky technical proposal</p></div>
          <div><b>Wrong</b><p>“Sure! Great idea!”</p></div>
          <div><b>Correct</b><p>{behaviorFeedback}</p></div>
        </article>}
      </div>}

      <div className="update-engine-map">
        <span>USER EXPERIENCE · Correct</span><i>↓</i><b>UPDATE ENGINE</b><div><small className={kind === 'capability' ? 'active' : ''}>Capability Patch</small><small className={kind === 'behavior' ? 'active' : ''}>Behavior Record</small></div><i>↓</i><span>Regenerate</span>
      </div>
      <aside className={`variant-correction-impact${currentVariantUsesCorrection ? ' applies' : ' excluded'}`}>
        <b>这次修改会进入：{affectedVariants}</b>
        <p>当前调用模式是 {variantLabels[variant]}，{currentVariantUsesCorrection ? '会加载这次更改。' : '不会加载这条 Artifact 轨道，但底层工件仍会保留该版本更新。'}</p>
      </aside>
      {applied && <button type="button" className="lifecycle-next" onClick={createVersion}>CREATE VERSION v2 →</button>}
    </section>}

    {phase === 'version' && <section className="version-theater">
      <header><span>05 · VERSION</span><b>Correction 不覆盖 prior state，而是确定一个可选择的当前版本</b></header>
      <div className={`version-transition current-${currentVersion}`}>
        <article className={`version-card ${currentVersion === 'v1' ? 'current' : 'archived'}`}><span>v1</span><b>{currentVersion === 'v1' ? 'CURRENT' : 'ARCHIVED'}</b><small>Correction count · 0</small></article>
        <div><span>Correction</span><i>→</i><span>{kind === 'capability' ? 'Patch' : 'Record'}</span><i>→</i><span>Regenerate</span></div>
        <article className={`version-card ${currentVersion === 'v2' ? 'current' : 'archived'}`}><span>v2</span><b>{currentVersion === 'v2' ? 'CURRENT' : 'ARCHIVED'}</b><small>Correction count · 1</small></article>
      </div>
      <div className="version-metadata"><span>Selected version <b>{currentVersion}</b></span><span>Correction count <b>{currentVersion === 'v2' ? '1' : '0'}</b></span><span>Prior state <b>Preserved</b></span></div>
      <aside className="lifecycle-callout"><b>{currentVersion === 'v2' ? 'v1 没有被覆盖，而是被归档；v2 成为当前版本。' : 'v2 没有被删除，而是被归档；v1 已通过回滚恢复为当前版本。'}</b><p>版本号、纠错次数和回滚历史共同构成 S=(A,M,L) 中的 L — Lifecycle。</p></aside>
      <p className="variant-version-note">{kind === 'capability' ? 'work.md' : 'persona.md'} 的 v2 更新将由 {affectedVariants} 共享；没有重新生成三份互不相关的 Skill。</p>
      {rollbackNotice && <p className="version-selection-note">↺ Rollback 已把 v1 设为候选当前状态；还需要明确确认它是系统接下来要使用的版本。</p>}
      <div className="version-actions">
        <button type="button" className="lifecycle-secondary" onClick={() => setPhase('history')}>EXPLORE VERSION HISTORY →</button>
        <button type="button" className="lifecycle-next" onClick={markReady}>USE {currentVersion} AS CURRENT →</button>
      </div>
    </section>}

    {(phase === 'history' || phase === 'confirm') && <section className="rollback-lab">
      <header><span>05 · VERSION · SIDE OPERATION</span><b>VERSION HISTORY</b><p>History 可以比较或回滚，但不会自动点亮 06 · Ready。</p></header>
      <div className="version-history">
        <div className={currentVersion === 'v2' ? 'current' : ''}><i>●</i><b>v2</b><span>{currentVersion === 'v2' ? 'CURRENT · correction 1' : 'ARCHIVED · correction 1'}</span></div><em />
        <div className={currentVersion === 'v1' ? 'current' : ''}><i>●</i><b>v1</b><span>{currentVersion === 'v1' ? 'CURRENT · original' : 'ARCHIVED · original'}</span></div>
      </div>
      {showCompare && <div className="version-compare" aria-live="polite">
        <div><span>v1 · work.md</span><del>1. Check naming</del><del>2. Check formatting</del></div>
        <div><span>v2 · work.md</span><ins>1. Check authentication</ins><ins>2. Check input validation</ins></div>
      </div>}
      {rollbackNotice && <p className="rollback-notice">✓ v2 remains archived. v1 is now the selected current state.</p>}
      {phase === 'history' ? <div className="history-actions">
        <button type="button" className="lifecycle-secondary" onClick={() => setShowCompare(current => !current)}>{showCompare ? 'CLOSE COMPARE' : 'COMPARE'}</button>
        {currentVersion === 'v2' && <button type="button" className="lifecycle-primary" onClick={() => setPhase('confirm')}>ROLLBACK TO v1</button>}
        <button type="button" className="lifecycle-next" onClick={() => setPhase('version')}>BACK TO VERSION →</button>
      </div>
        : <div className="rollback-confirm"><b>Restore v1?</b><p>v2 不会被删除；它将进入 archived state。</p><div><button type="button" onClick={() => setPhase('history')}>Cancel</button><button type="button" className="lifecycle-primary" onClick={confirmRollback}>CONFIRM ROLLBACK</button></div></div>}
    </section>}

    {phase === 'deploymentReady' && <section className="ready-stage">
      <header><span>06 · READY</span><b>Current version selected</b></header>
      <div className="ready-skill-card"><span>Senior Engineer Skill</span><b>Version {currentVersion}</b><em>{variantLabels[variant]}</em><strong>✓ READY</strong><small>Paper lifecycle: Ready → Install / Share</small></div>
      <aside className="deployment-handoff">
        <div><span>S4 → S5</span><b>The Skill is ready. Where should it go?</b><p>Skill 已经生成、纠错并确定当前版本。接下来，它应该被放在哪里？</p></div>
        <button type="button" onClick={deployCurrentVersion}>DEPLOY CURRENT VERSION →</button>
      </aside>
      <button type="button" className="lifecycle-primary lifecycle-replay" onClick={resetLab}>↺ RUN CORRECTION AGAIN</button>
    </section>}
  </div>;
};

export default LifecycleCorrectionLab;
