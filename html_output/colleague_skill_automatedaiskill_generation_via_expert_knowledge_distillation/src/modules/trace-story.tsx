import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge } from './colleague-ui';

type Mode = 'idle' | 'blackbox' | 'skill';
type Probe = 'source' | 'correct' | 'rollback';
type Version = 'v1' | 'v2';

const traces = [
  { id: 'Chat #1', label: 'Chat', icon: '●', tone: 'chat', rule: '先检查 authentication。' },
  { id: 'Email #5', label: 'Email', icon: '✉', tone: 'email', rule: 'P0 时需要直接 escalation。' },
  { id: 'Review #12', label: 'Review', icon: '◆', tone: 'review', rule: '接口必须做输入校验。' },
  { id: 'Incident #3', label: 'Incident', icon: '!', tone: 'incident', rule: 'Rollback 前检查数据一致性。' },
] as const;

const questions: Record<Probe, string> = {
  source: 'Where did this rule come from?',
  correct: 'Can I correct only the review rule?',
  rollback: 'Can I rollback?',
};

const blackboxAnswers: Record<Probe, [string, string]> = {
  source: ['Unknown.', '黑箱没有暴露规则与来源的连接。'],
  correct: ['Not explicit.', '看不到可单独修改的 Review 规则位置。'],
  rollback: ['No visible version state.', '没有可检查的版本或恢复点。'],
};

export const TraceStory: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('idle');
  const [probe, setProbe] = useState<Probe | null>(null);
  const [blackboxReady, setBlackboxReady] = useState(false);
  const [blackboxSettled, setBlackboxSettled] = useState(false);
  const [skillStep, setSkillStep] = useState(0);
  const [version, setVersion] = useState<Version>('v2');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setProbe(null);
    setBlackboxReady(false);
    setBlackboxSettled(false);
    setSkillStep(0);
    const timers: number[] = [];

    if (mode === 'blackbox') {
      timers.push(window.setTimeout(() => setBlackboxReady(true), 720));
      timers.push(window.setTimeout(() => setBlackboxSettled(true), 1650));
    }
    if (mode === 'skill') {
      [280, 1200, 2250, 3300, 4200].forEach((delay, index) => {
        timers.push(window.setTimeout(() => setSkillStep(index + 1), delay));
      });
    }
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [mode]);

  const reset = () => {
    setMode('idle');
    setProbe(null);
    setVersion('v2');
    setSwitching(false);
  };

  const changeVersion = (next: Version) => {
    if (next === version || switching) return;
    setSwitching(true);
    window.setTimeout(() => {
      setVersion(next);
      window.setTimeout(() => setSwitching(false), 90);
    }, 420);
  };

  const choose = (next: Exclude<Mode, 'idle'>) => {
    setVersion('v2');
    setSwitching(false);
    setMode(next);
  };

  return <div className={`paper-widget trace-story-v2 mode-${mode} skill-step-${skillStep}${blackboxReady ? ' blackbox-ready' : ''}${blackboxSettled ? ' blackbox-settled' : ''}`}>
    <header className="story-boundary">
      <StateBadge tone="aux">Conceptual contrast</StateBadge>
      <p>这是工件属性的概念对照：论文批评 opaque prompt / hidden memory 的不可检查性，但没有实验性证明所有既有方法都是黑箱 Prompt。</p>
    </header>

    <section className="story-source-stage" aria-label="四条共同输入痕迹">
      <span className="story-source-label">同一组输入</span>
      <div className="story-traces">
        {traces.map(trace => <div key={trace.id} className={`story-trace story-trace-${trace.tone}`} title={trace.rule}>
          <span className="story-trace-icon" aria-hidden="true">{trace.icon}</span>
          <span><b>{trace.label}</b><small>{trace.id}<br />{trace.rule}</small></span>
        </div>)}
      </div>
    </section>

    {mode === 'idle' && <div className="story-choice-row" role="group" aria-label="选择经验保存方式">
      <button type="button" className="story-choice choice-blackbox" onClick={() => choose('blackbox')}>
        <span>A</span><b>Put everything into a prompt / memory</b><small>把所有痕迹放入隐藏提示词或记忆</small>
      </button>
      <button type="button" className="story-choice choice-skill" onClick={() => choose('skill')}>
        <span>B</span><b>Distill it into an inspectable skill</b><small>用 COLLEAGUE.SKILL 蒸馏为可检查工件</small>
      </button>
    </div>}

    {mode === 'blackbox' && <section className="story-route story-blackbox-route" aria-label="隐藏提示词概念对照">
      <div className="blackbox-ingest" aria-hidden="true">
        <span>WeChat</span><span>Email</span><span>Review</span><span>Incident</span><i>──►</i>
      </div>
      <div className={`story-blackbox${blackboxReady ? ' is-loaded' : ''}`}>
        <span className="blackbox-slit" />
        <b>HIDDEN<br />PROMPT</b>
        <small>{blackboxReady ? '4 traces absorbed' : 'absorbing traces…'}</small>
      </div>
      <p className="route-instruction">不要先接受结论。逐个询问这个工件，看看你能否定位、局部纠正和恢复。</p>
      <div className="story-probes">
        {(Object.keys(questions) as Probe[]).map(key => <button type="button" key={key} className={probe === key ? 'active' : ''} onClick={() => setProbe(key)}>{questions[key]}</button>)}
      </div>
      <div className={`story-answer blackbox-answer${probe ? ' is-visible' : ''}`} aria-live="polite">
        {probe ? <><StateBadge tone="bad">Black box</StateBadge><div><b>{blackboxAnswers[probe][0]}</b><p>{blackboxAnswers[probe][1]}</p></div></> : <span>点击一个问题，观察黑箱能否给出可操作答案。</span>}
      </div>
      <button type="button" className="story-reset" onClick={reset}>↺ 重置演示</button>
    </section>}

    {mode === 'skill' && <section className="story-route story-skill-route" aria-label="COLLEAGUE.SKILL 蒸馏与检查演示">
      <div className="skill-build-progress" aria-label="生成进度">
        {['Trace', 'Distill', '双轨文件', '组装', 'Skill Package'].map((label, index) => <span key={label} className={skillStep >= index + 1 ? 'active' : ''}>{label}</span>)}
      </div>

      <div className="skill-build-grid">
        <div className={`distill-vessel${skillStep >= 1 ? ' is-active' : ''}${skillStep >= 2 ? ' is-complete' : ''}`}>
          <span aria-hidden="true">⚗️</span><b>DISTILL</b><small>{skillStep < 2 ? '正在提炼 Trace…' : 'Capability / Behavior'}</small>
          <i className="bubble bubble-one" /><i className="bubble bubble-two" /><i className="bubble bubble-three" />
        </div>

        <div className={`distill-split${skillStep >= 2 ? ' is-visible' : ''}`} aria-label="能力与行为双轨">
          <div><span>Capability</span><i>──►</i></div>
          <div><span>Behavior</span><i>──►</i></div>
        </div>

        <div className={`skill-package-card${skillStep >= 2 ? ' has-tracks' : ''}${skillStep >= 3 ? ' is-assembled' : ''}${skillStep >= 4 ? ' is-packed' : ''}${version === 'v1' ? ' is-history' : ''}${switching ? ' is-switching' : ''}`}>
          <div className="package-status">
            <b>COLLEAGUE.SKILL</b>
            <span>{version === 'v1' ? '历史版本 v1 · 只读预览' : '当前版本 v2'}</span>
          </div>
          <div className="package-file package-skill"><span>▤</span><b>SKILL.md</b><small>运行入口</small></div>
          <div className="package-connectors" aria-hidden="true"><i>↗</i><i>↖</i></div>
          <div className="package-file package-work"><span>▤</span><b>work.md</b><small>Capability</small></div>
          <div className="package-file package-persona"><span>▤</span><b>persona.md</b><small>Behavior</small></div>
          <div className="package-file package-manifest"><span>{'{}'}</span><b>manifest.json</b><small>安装与入口</small></div>
          <div className="package-file package-meta"><span>{'{}'}</span><b>meta.json</b><small>来源与版本</small></div>
        </div>
      </div>

      <div className={`host-fanout${skillStep >= 5 ? ' is-visible' : ''}`}>
        <div className="host-skill">Skill Package</div><i>──►</i>
        <div><span>Claude Code</span><span>Codex</span><span>Other Hosts</span><span>Gallery <small>条件允许时</small></span></div>
      </div>

      <div className={`skill-inspection${skillStep >= 5 ? ' is-visible' : ''}`}>
        <p className="route-instruction">现在用同样三个问题检查显式工件。</p>
        <div className="story-probes">
          {(Object.keys(questions) as Probe[]).map(key => <button type="button" key={key} className={probe === key ? 'active' : ''} onClick={() => setProbe(key)}>{questions[key]}</button>)}
        </div>

        <div className={`story-answer skill-answer${probe ? ' is-visible' : ''}`} aria-live="polite">
          {!probe && <span>选择问题后，文件包会显示对应的可检查状态。</span>}
          {probe === 'source' && <div className="provenance-demo">
            <StateBadge tone="good">meta.json</StateBadge>
            <div><b>rule: work.auth-input-check</b><code>sources: [Chat #1, Review #12]</code><code>locator: Code Review · 11:26</code><p>“先检查 authentication，并验证接口输入。”</p></div>
          </div>}
          {probe === 'correct' && <div className="correction-demo">
            <StateBadge tone="good">局部补丁</StateBadge>
            <code>{'{ scene: "review-auth",'}</code>
            <code>{'  wrong: "直接拒绝请求",'}</code>
            <code>{'  correct: "先检查 authentication，并解释输入风险" }'}</code>
            <p>只重写 Review 对应规则；Chat、Email 与 Incident 规则保持不变。</p>
          </div>}
          {probe === 'rollback' && <div className="rollback-demo">
            <StateBadge tone={version === 'v1' ? 'aux' : 'good'}>{version === 'v1' ? '历史版本' : '版本状态'}</StateBadge>
            <div className="version-buttons">
              <button type="button" className={version === 'v1' ? 'active' : ''} onClick={() => changeVersion('v1')}><b>v1</b><small>归档 · 09:40</small></button>
              <button type="button" className={version === 'v2' ? 'active' : ''} onClick={() => changeVersion('v2')}><b>v2</b><small>当前 · 18:32</small></button>
            </div>
            <p>{version === 'v1' ? '正在查看历史版本：包内文件已全部切换为归档配色；Incident 的一致性检查尚未加入。' : '当前版本 v2：包含来自 Incident #3 的 Rollback 前一致性检查。'}</p>
          </div>}
        </div>
      </div>
      <button type="button" className="story-reset" onClick={reset}>↺ 重置演示</button>
    </section>}

    {mode === 'idle' && <div className="feedback">两条路径使用完全相同的四条 Trace。请亲自选择，再比较它们能否回答来源、局部纠正和回滚问题。</div>}
  </div>;
};

export default TraceStory;
