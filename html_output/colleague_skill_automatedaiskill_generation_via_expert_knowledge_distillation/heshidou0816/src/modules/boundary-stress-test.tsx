import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const sources = [
  { id: 'interview', icon: '🎙️', title: '2-hour Interview', note: '“I explain my approach to…”', high: true },
  { id: 'essay', icon: '📕', title: 'First-person Essay', note: 'Written by the person', high: true },
  { id: 'summary', icon: '📰', title: 'Short News Summary', note: '“Sources say…”', high: false },
  { id: 'farm', icon: '🌐', title: 'Content Farm', note: '“10 secrets of…”', high: false },
];

const qualityChecks = ['Mental-model coverage', 'Evidence limits', 'Grounding URLs', 'Internal tensions', 'Copyright safety'];

export const BoundaryStressTest: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [publicResult, setPublicResult] = useState<'pass' | 'thin' | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacy, setPrivacy] = useState({ permission: false, local: false, deletion: false });
  const [localAllowed, setLocalAllowed] = useState(false);

  const toggleSource = (id: string) => {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setPublicResult(null);
  };

  const runQualityCheck = () => {
    const correct = selected.length === 2 && selected.every(id => sources.find(source => source.id === id)?.high);
    setPublicResult(correct ? 'pass' : 'thin');
  };

  const checkPrivacy = () => {
    setPrivacyOpen(true);
    setLocalAllowed(privacy.permission && privacy.local && privacy.deletion);
  };

  return <div className="paper-widget boundary-stress-test">
    <header className="stress-header"><span>SAME SKILL WORKFLOW</span><b>同一个工件，两种完全不同的边界压力</b><p>Public Figure 问“应该相信什么”；Relationship 问“是否允许这样使用”。</p></header>
    <div className="stress-branch-label"><i /><span>DIFFERENT CONSTRAINTS</span><i /></div>

    <div className="stress-grid">
      <section className="public-stress">
        <header><span>🎙️ STRESS TEST ① · PUBLIC FIGURE</span><b>What should the Skill trust first?</b><p>把应优先使用的证据放进 HIGH PRIORITY。</p></header>
        <div className="source-cards">
          {sources.map(source => <button type="button" key={source.id} className={selected.includes(source.id) ? 'selected' : ''} onClick={() => toggleSource(source.id)}>
            <span>{source.icon}</span><b>{source.title}</b><small>{source.note}</small>{selected.includes(source.id) && <i>HIGH PRIORITY</i>}
          </button>)}
        </div>
        <button type="button" className="stress-action" disabled={!selected.length} onClick={runQualityCheck}>RUN EVIDENCE CHECKER</button>
        {publicResult === 'pass' && <div className="quality-result pass"><b>Evidence Quality ↑</b>{qualityChecks.map((item, index) => <span key={item} style={{ animationDelay: `${index * 90}ms` }}>{item}<i>✓</i></span>)}<strong>优先使用第一人称作品和长篇访谈；推断必须清楚标记。</strong></div>}
        {publicResult === 'thin' && <div className="quality-result thin"><b>Confidence ↓</b><span>Evidence too thin.</span><strong>Do not fill the gap with generic persona text.</strong><p>短摘要和内容农场只能作为低优先级线索，不能替代可定位的一手证据。</p></div>}
      </section>

      <section className="relationship-stress">
        <header><span>💬 STRESS TEST ② · RELATIONSHIP</span><b>Are we allowed to use these traces?</b><p>私密痕迹改变的是技术与治理问题，不只是“像不像”。</p></header>
        <div className="private-traces"><span>💬 Private Chat</span><span>💌 Personal Message</span><span>🎙️ Voice Transcript</span></div>
        <button type="button" className="stress-action" onClick={checkPrivacy}>{privacyOpen ? 'RECHECK PRIVACY' : 'BUILD / SHARE'}</button>
        {privacyOpen && <div className={`privacy-gate${localAllowed ? ' allowed' : ''}`}>
          <b>PRIVACY CHECK</b>
          <div className="privacy-status"><span>Consent <i>{privacy.permission ? '✓' : '?'}</i></span><span>Local Control <i>{privacy.local ? '✓' : '?'}</i></span><span>Deletion <i>{privacy.deletion ? '✓' : '?'}</i></span><span>Public Sharing <i>OFF</i></span></div>
          <label><input type="checkbox" checked={privacy.permission} onChange={event => { setPrivacy(current => ({ ...current, permission: event.target.checked })); setLocalAllowed(false); }} /> I have permission to use these traces</label>
          <label><input type="checkbox" checked={privacy.local} onChange={event => { setPrivacy(current => ({ ...current, local: event.target.checked })); setLocalAllowed(false); }} /> Keep this skill local</label>
          <label><input type="checkbox" checked={privacy.deletion} onChange={event => { setPrivacy(current => ({ ...current, deletion: event.target.checked })); setLocalAllowed(false); }} /> Allow deletion at any time</label>
          <strong>{localAllowed ? 'LOCAL USE ALLOWED ✓ · PUBLIC SHARING REMAINS OFF' : 'BLOCKED · Complete every privacy condition first'}</strong>
        </div>}
        <aside><b>Private traces change the technical problem.</b><p>Consent、retention、access control、deletion 与 non-public defaults，必须成为 Skill artifact 本身支持的能力。</p></aside>
      </section>
    </div>
    <footer><b>Same artifact workflow. Different constraints.</b><span>公开证据需要质量与引用边界；私密证据需要同意、控制与删除能力。</span></footer>
  </div>;
};

export default BoundaryStressTest;
