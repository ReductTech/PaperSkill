import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type SkillVersion = 'v1' | 'v2';
type SkillVariant = 'full' | 'work' | 'persona';
type Route = 'local' | 'agent' | 'gallery' | null;
type AgentStage = 'manifest' | 'checked' | 'installed';
type GalleryStage = 'gate' | 'scanned' | 'published';

interface S2Build {
  profile?: { id?: string; icon?: string; label?: string } | null;
  scopes?: Array<{ id?: string; label?: string }>;
  materials?: Array<{ id?: string; label?: string }>;
  governance?: { rightsConfirmed?: boolean; localOnly?: boolean; noShareByDefault?: boolean; sensitive?: boolean };
}

const variants: Array<{ id: SkillVariant; label: string; scope: string }> = [
  { id: 'full', label: 'FULL', scope: 'Capability + Persona' },
  { id: 'work', label: 'WORK ONLY', scope: 'Capability only' },
  { id: 'persona', label: 'PERSONA ONLY', scope: 'Restricted behavior only' },
];

const readVariant = (): SkillVariant => {
  try {
    const value = window.sessionStorage.getItem('colleague-skill:variant');
    return value === 'work' || value === 'persona' ? value : 'full';
  } catch { return 'full'; }
};

const readVersion = (): SkillVersion => {
  try { return window.sessionStorage.getItem('colleague-skill:s4-current-version') === 'v2' ? 'v2' : 'v1'; }
  catch { return 'v1'; }
};

const readS2Build = (): S2Build => {
  try {
    const raw = window.sessionStorage.getItem('colleague-skill:s2-build');
    return raw ? JSON.parse(raw) as S2Build : {
      profile: { id: 'colleague', icon: '🧑‍💻', label: 'Colleague' },
      scopes: [{ id: 'docs', label: 'Documents' }],
      materials: [{ id: 'design-docs', label: 'Design Docs' }],
      governance: { rightsConfirmed: true, localOnly: false, noShareByDefault: false, sensitive: false },
    };
  } catch { return {}; }
};

export const DeploymentLab: React.FC<WidgetProps> = () => {
  const [version, setVersion] = useState<SkillVersion>(readVersion);
  const [s2Build, setS2Build] = useState<S2Build>(readS2Build);
  const [route, setRoute] = useState<Route>(null);
  const [agentStage, setAgentStage] = useState<AgentStage>('manifest');
  const [galleryStage, setGalleryStage] = useState<GalleryStage>('gate');
  const [claimOpen, setClaimOpen] = useState(false);
  const [variant, setVariant] = useState<SkillVariant>(readVariant);

  useEffect(() => {
    const onVersion = (event: Event) => setVersion((event as CustomEvent<SkillVersion>).detail);
    const onS2 = (event: Event) => setS2Build((event as CustomEvent<S2Build>).detail);
    const onVariant = (event: Event) => setVariant((event as CustomEvent<SkillVariant>).detail);
    window.addEventListener('colleague-skill:s4-version', onVersion);
    window.addEventListener('colleague-skill:s2-built', onS2);
    window.addEventListener('colleague-skill:variant', onVariant);
    return () => {
      window.removeEventListener('colleague-skill:s4-version', onVersion);
      window.removeEventListener('colleague-skill:s2-built', onS2);
      window.removeEventListener('colleague-skill:variant', onVariant);
    };
  }, []);

  const blocked = useMemo(() => {
    const profilePrivate = s2Build.profile?.id === 'relationship';
    const governance = s2Build.governance;
    return Boolean(profilePrivate || governance?.localOnly || governance?.noShareByDefault || (governance?.sensitive && !governance?.rightsConfirmed));
  }, [s2Build]);

  const chooseRoute = (next: Exclude<Route, null>) => {
    setRoute(next);
    setAgentStage('manifest');
    setGalleryStage('gate');
    setClaimOpen(false);
  };

  const onDrop = (event: React.DragEvent, next: Exclude<Route, null>) => {
    event.preventDefault();
    chooseRoute(next);
  };

  const resetLab = () => {
    setVersion(readVersion());
    setS2Build(readS2Build());
    setRoute(null);
    setAgentStage('manifest');
    setGalleryStage('gate');
    setClaimOpen(false);
    setVariant(readVariant());
  };

  const chooseVariant = (next: SkillVariant) => {
    setVariant(next);
    setRoute(null);
    setAgentStage('manifest');
    setGalleryStage('gate');
    setClaimOpen(false);
    try {
      window.sessionStorage.setItem('colleague-skill:variant', next);
      window.dispatchEvent(new CustomEvent('colleague-skill:variant', { detail: next }));
    } catch { /* The deployment lab still works with local state. */ }
  };

  const activeVariant = variants.find(item => item.id === variant) || variants[0];
  const entrypoint = variant === 'work' ? 'work_skill.md' : variant === 'persona' ? 'persona_skill.md' : 'SKILL.md';

  return <div className="paper-widget deployment-lab">
    <header className="deployment-lab-header">
      <div><span>DEPLOYMENT LAB</span><b>Keep it local, install it into an agent, or publish it under explicit boundaries.</b></div>
      {route && <button type="button" onClick={resetLab}>↺ RESET LAB</button>}
    </header>

    <section className="deployment-origin">
      <div className="deployment-skill-card" draggable onDragStart={event => event.dataTransfer.setData('text/plain', version)}>
        <span>Senior Engineer Skill</span><b>Version {version}</b><em>{activeVariant.label}</em><strong>READY ✓</strong><small>Drag me or choose a route</small>
      </div>
      <div className="deployment-variant-picker">
        <span>DEPLOY WHICH COMPOSITION?</span>
        <div>{variants.map(item => <button type="button" key={item.id} className={variant === item.id ? 'active' : ''} onClick={() => chooseVariant(item.id)}><b>{item.label}</b><small>{item.scope}</small></button>)}</div>
      </div>
      <p>这是 S4 确定的当前版本。切换变体只改变安装或发布时暴露的 Artifact 范围，不重新生成 Skill；Metadata 与 Lifecycle 始终同行。</p>
    </section>

    <div className="deployment-routes" role="group" aria-label="选择 Skill 部署路线">
      <button type="button" className={route === 'local' ? 'active' : ''} onClick={() => chooseRoute('local')} onDragOver={event => event.preventDefault()} onDrop={event => onDrop(event, 'local')}><span>💻</span><b>STAY LOCAL</b><small>Keep it private</small></button>
      <button type="button" className={route === 'agent' ? 'active' : ''} onClick={() => chooseRoute('agent')} onDragOver={event => event.preventDefault()} onDrop={event => onDrop(event, 'agent')}><span>🤖</span><b>INSTALL TO AGENT</b><small>Check compatibility</small></button>
      <button type="button" className={route === 'gallery' ? 'active' : ''} onClick={() => chooseRoute('gallery')} onDragOver={event => event.preventDefault()} onDrop={event => onDrop(event, 'gallery')}><span>🌐</span><b>PUBLISH TO GALLERY</b><small>Pass a publication gate</small></button>
    </div>

    {!route && <div className="deployment-empty"><b>Choose a destination</b><p>点击路线，或把上方 Skill 拖入其中一个区域。</p></div>}

    {route === 'local' && <section className="deployment-result local-result">
      <header><span>💻 MY COMPUTER</span><b>LOCAL VAULT</b></header>
      <div className="deployment-transfer"><span>{activeVariant.label} · {version}</span><i>↓</i><b>LOCAL DEPLOYMENT</b></div>
      <div className="local-checks"><span>Private <b>✓</b></span><span>Editable <b>✓</b></span><span>Correctable <b>✓</b></span><span>Rollback <b>✓</b></span><span>Deletable <b>✓</b></span></div>
      <blockquote><b>Not every Skill needs to be shared.</b><p>一个 Skill 可以一直只属于本地用户。</p></blockquote>
    </section>}

    {route === 'agent' && <section className="deployment-result agent-result">
      <header><span>🤖 AGENT HOST</span><b>INSTALL CURRENT VERSION</b></header>
      <div className={`agent-install-flow agent-${agentStage}`}>
        <span>Skill {version}</span><i>→</i><span>manifest.json</span><i>→</i><span>Compatibility Check</span><i>→</i><span>Install</span>
      </div>
      <div className="manifest-card"><span>manifest.json</span><code>entrypoint: {entrypoint}<br />composition: {variant}<br />runtimes: codex, claude-code<br />version: {version}</code></div>
      {agentStage === 'manifest' && <button type="button" className="deployment-action" onClick={() => setAgentStage('checked')}>RUN COMPATIBILITY CHECK →</button>}
      {agentStage !== 'manifest' && <div className="compatibility-checks"><span>Codex <b>✓</b></span><span>Claude Code <b>✓</b></span><span>Other skill hosts <b>manifest required</b></span></div>}
      {agentStage === 'checked' && <button type="button" className="deployment-action" onClick={() => setAgentStage('installed')}>INSTALL →</button>}
      {agentStage === 'installed' && <div className="installed-host"><span>CODEX</span><b>{activeVariant.label} · Senior Engineer Skill {version}</b><strong>READY TO INVOKE ✓</strong></div>}
    </section>}

    {route === 'gallery' && <section className="deployment-result gallery-result">
      <header><span>🌐 GALLERY</span><b>PUBLICATION GATE</b><p>公开分发不是默认终点。先用 S2 的 p、c、D 与治理状态检查发布权利。</p></header>
      <div className="s2-boundary-receipt"><span>S2 SOURCE RECEIPT</span><b>{s2Build.profile?.icon || '🧑‍💻'} {s2Build.profile?.label || 'Colleague'}</b><small>{s2Build.materials?.map(item => item.label).join(' · ') || 'Design Docs'}</small></div>
      {galleryStage === 'gate' && <button type="button" className="deployment-action" onClick={() => setGalleryStage('scanned')}>RUN PUBLICATION GATE →</button>}
      {galleryStage !== 'gate' && <div className={`publication-gate ${blocked ? 'blocked' : 'passed'}`}>
        <span>Source Rights <b>{s2Build.governance?.rightsConfirmed === false ? '⚠' : '✓'}</b></span>
        <span>Source Boundary <b>✓</b></span>
        <span>Metadata <b>✓</b></span>
        <span>Disclaimer <b>✓</b></span>
        <span>{s2Build.profile?.id === 'relationship' ? 'Consent' : 'Sharing Permission'} <b>{blocked ? '⚠' : '✓'}</b></span>
        <span>Sharing Policy <b>{blocked ? 'PRIVATE' : 'PUBLIC ALLOWED'}</b></span>
        <strong>{blocked ? 'PUBLISHING BLOCKED' : 'ALL CHECKS PASSED'}</strong>
      </div>}
      {galleryStage === 'scanned' && !blocked && <button type="button" className="deployment-action publish-action" onClick={() => setGalleryStage('published')}>PUBLISH →</button>}
      {galleryStage === 'scanned' && blocked && <aside className="publishing-blocked"><b>Consent unresolved. Publishing blocked.</b><p>Governable 的价值在这里变成真实约束：私密来源、Local Only 或默认不分享会阻止进入公开层。</p></aside>}

      {galleryStage === 'published' && <>
        <div className="gallery-published"><span>{activeVariant.label} · {version}</span><i>→</i><b>GALLERY · PUBLISHED ✓</b></div>
        <section className="public-surface">
          <header><span>FIGURE 4 · REPORTED COUNTERS</span><b>PUBLIC DEPLOYMENT SURFACE</b></header>
          <div className="public-counter-grid">
            <article><span>REPOSITORY</span><b>~18.5k</b><small>GitHub stars</small><b>~1.8k</b><small>forks</small><b>104</b><small>commits</small></article>
            <article><span>GALLERY</span><b>215</b><small>skills</small><b>55</b><small>Meta-skills</small><b>165</b><small>contributors</small></article>
            <article><span>AGGREGATE REACH</span><b>&gt;100k</b><small>cumulative gallery stars</small></article>
          </div>
          <div className={`claim-boundary-card${claimOpen ? ' is-open' : ''}`}>
            <button type="button" onClick={() => setClaimOpen(current => !current)}><span>Does this mean the Skill faithfully represents the target person?</span><b>{claimOpen ? 'NO.' : 'REVEAL CLAIM BOUNDARY →'}</b></button>
            {claimOpen && <div><p>These figures demonstrate a public deployment/distribution surface, not task performance, behavioral fidelity, or adoption quality.</p><strong>这些数字证明的是“这套 Artifact 能形成公开部署与分发生态”，而不是“它已经证明能够忠实呈现目标人物的行为或专业能力”。</strong></div>}
          </div>
        </section>
      </>}
    </section>}
  </div>;
};

export default DeploymentLab;
