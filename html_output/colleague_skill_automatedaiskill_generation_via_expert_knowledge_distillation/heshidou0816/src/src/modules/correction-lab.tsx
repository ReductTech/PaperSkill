import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MiniFile, StateBadge } from './colleague-ui';

type Kind = 'work' | 'behavior';
type Version = 1 | 2 | 3;
const copy = {
  work: {
    wrong: 'Always rollback immediately.',
    correct: 'Rollback only after checking data consistency.',
    record: 'Markdown patch · Incident Handling',
  },
  behavior: {
    wrong: 'Bluntly reject junior engineers.',
    correct: 'Explain the risk and offer an alternative.',
    record: '{ scene, wrong, correct }',
  },
};

export const CorrectionLab: React.FC<WidgetProps> = () => {
  const [kind, setKind] = useState<Kind>('work');
  const [version, setVersion] = useState<Version>(1);
  const [applied, setApplied] = useState(false);
  const item = copy[kind];
  const apply = () => { setApplied(true); setVersion(2); };
  const setKindAndReset = (next: Kind) => { setKind(next); setApplied(false); setVersion(1); };
  const displayed = version === 1 ? item.wrong : item.correct;

  return <div className="paper-widget correction-lab">
    <div className="ctrl correction-kind" role="group" aria-label="纠正类型">
      <button className={`chip ${kind === 'work' ? 'active' : ''}`} onClick={() => setKindAndReset('work')}>工作规则纠正</button>
      <button className={`chip ${kind === 'behavior' ? 'active' : ''}`} onClick={() => setKindAndReset('behavior')}>行为纠正</button>
    </div>
    <div className="correction-grid">
      <section className={`wrong-rule ${version === 1 ? 'is-wrong' : 'is-correct'}`}>
        <header><StateBadge tone={version === 1 ? 'bad' : 'good'}>{version === 1 ? '错误规则' : `当前 v${version}`}</StateBadge><b>{kind === 'work' ? 'Incident Handling' : 'Review Interaction'}</b></header>
        <blockquote>{displayed}</blockquote>
        {version === 1 && <div className="correction-proposal"><span>改成</span><b>{item.correct}</b><button onClick={apply}>应用纠正</button></div>}
        {version > 1 && <div className="regenerated-files"><MiniFile name="SKILL.md" active tone="green" /><MiniFile name={kind === 'work' ? 'work_skill.md' : 'persona_skill.md'} active tone={kind === 'work' ? 'green' : 'purple'} /><MiniFile name="manifest.json" active tone="orange" /><MiniFile name="meta.json" active tone="blue" /></div>}
      </section>
      <section className="archive-panel">
        <b>归档与纠正记录</b>
        <div className="archive-record"><span>{applied ? '✓' : '○'}</span><div><b>{item.record}</b><small>{applied ? 'v1 已归档，纠正计数 +1' : '等待提交纠正'}</small></div></div>
        <div className="archive-record muted"><span>↶</span><div><b>Rollback point</b><small>{applied ? 'v1 可恢复' : '尚无新版本'}</small></div></div>
      </section>
    </div>
    <div className="version-timeline" role="group" aria-label="版本时间线">
      {([1, 2, 3] as Version[]).map(v => <button key={v} disabled={v > 1 && !applied} className={version === v ? 'active' : ''} onClick={() => setVersion(v)}><span>v{v}</span><small>{v === 1 ? '原版' : v === 2 ? '纠正版' : '示例后续版'}</small></button>)}
    </div>
    <div className={`feedback ${version === 1 ? 'bad' : 'good'}`}>{version === 1 ? '第一版可能有错；显式纠正入口让问题有可修改的位置。' : version === 2 ? 'v2 已生成，v1 仍可回滚；派生文件已同步再生成。' : '你正在检查后续版本。回滚恢复内容，但仍需要人工复核纠正是否引入偏差。'}</div>
    <p className="boundary-note">边界：论文证明系统支持纠正与回滚，不保证每次纠正都改善技能；编辑者偏差和回归仍可能发生。</p>
  </div>;
};

export default CorrectionLab;
