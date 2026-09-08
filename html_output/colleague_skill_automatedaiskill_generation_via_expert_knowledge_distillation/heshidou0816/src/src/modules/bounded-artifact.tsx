import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge } from './colleague-ui';

type ProfileId = 'colleague' | 'public' | 'relationship';
type ScopeId = 'chats' | 'docs' | 'emails' | 'audio';
type PropertyId = 'portable' | 'inspectable' | 'composable' | 'correctable' | 'governable';
type SkillVariant = 'full' | 'work' | 'persona';

interface Material {
  id: string;
  label: string;
  icon: string;
  scope: ScopeId;
  sensitive?: boolean;
}

const profiles: Array<{ id: ProfileId; icon: string; label: string; desc: string }> = [
  { id: 'colleague', icon: '🧑‍💻', label: 'Colleague', desc: '工作判断与协作规则' },
  { id: 'public', icon: '🎙️', label: 'Public Figure', desc: '可引用的公开表达与决策' },
  { id: 'relationship', icon: '💬', label: 'Relationship', desc: '受同意约束的关系材料' },
];

const scopes: Array<{ id: ScopeId; icon: string; label: string; boundary: string }> = [
  { id: 'chats', icon: '💬', label: 'Chats', boundary: '仅限指定参与者、频道与时间范围' },
  { id: 'docs', icon: '📄', label: 'Documents', boundary: '仅限本人创作、被明确共享或已公开文档' },
  { id: 'emails', icon: '📧', label: 'Emails', boundary: '仅限指定邮箱、主题线程与授权账户' },
  { id: 'audio', icon: '🎙️', label: 'Audio / Transcripts', boundary: '仅限已获录制同意或公开发布的内容' },
];

const materials: Record<ProfileId, Material[]> = {
  colleague: [
    { id: 'code-review', label: 'Code Review Threads', icon: '💻', scope: 'docs' },
    { id: 'design-docs', label: 'Design Docs', icon: '📐', scope: 'docs' },
    { id: 'incident-notes', label: 'Incident Notes', icon: '🚨', scope: 'docs' },
    { id: 'work-chats', label: 'Slack / WeChat Discussions', icon: '💬', scope: 'chats' },
    { id: 'handover', label: 'Handover Notes', icon: '📝', scope: 'docs' },
    { id: 'internal-emails', label: 'Internal Emails', icon: '📧', scope: 'emails', sensitive: true },
  ],
  public: [
    { id: 'interviews', label: 'Interviews', icon: '🎤', scope: 'audio' },
    { id: 'speeches', label: 'Speeches', icon: '🎙️', scope: 'audio' },
    { id: 'essays', label: 'Essays / Articles', icon: '📰', scope: 'docs' },
    { id: 'decisions', label: 'Public Decisions', icon: '🏛️', scope: 'docs' },
    { id: 'first-person', label: 'First-person Writings', icon: '✍️', scope: 'docs' },
    { id: 'public-email-archive', label: 'Email Archive', icon: '📧', scope: 'emails' },
  ],
  relationship: [
    { id: 'chat-history', label: 'Chat History', icon: '💬', scope: 'chats', sensitive: true },
    { id: 'shared-notes', label: 'Shared Notes', icon: '📝', scope: 'docs' },
    { id: 'voice-transcripts', label: 'Voice Transcripts', icon: '🎧', scope: 'audio', sensitive: true },
    { id: 'interaction-logs', label: 'Interaction Logs', icon: '🧭', scope: 'chats', sensitive: true },
    { id: 'personal-messages', label: 'Personal Messages', icon: '💌', scope: 'chats', sensitive: true },
    { id: 'relationship-logs', label: 'Relationship Logs', icon: '🔒', scope: 'docs', sensitive: true },
    { id: 'private-email', label: 'Email Archive', icon: '📧', scope: 'emails', sensitive: true },
  ],
};

const propertyLabels: Array<{ id: PropertyId; label: string; question: string }> = [
  { id: 'portable', label: 'Portable', question: '它能不能被不同 Agent Host 直接安装和调用？' },
  { id: 'inspectable', label: 'Inspectable', question: '我能不能直接看到 Skill 里面到底写了什么？' },
  { id: 'composable', label: 'Composable', question: '我能不能只调用我需要的那一部分？' },
  { id: 'correctable', label: 'Correctable', question: '如果 Skill 理解错了，能不能修正，并保留版本历史？' },
  { id: 'governable', label: 'Governable', question: '它能不能在明确规则下被审查、分享、保留或删除？' },
];

const skillVariants: Array<{ id: SkillVariant; label: string; subtitle: string; artifact: string; omitted: string; use: string }> = [
  { id: 'full', label: 'FULL', subtitle: 'Capability + Persona', artifact: 'work.md + persona.md', omitted: '不省略 Artifact 轨道', use: '同时需要专业方法与受约束的互动方式' },
  { id: 'work', label: 'WORK ONLY', subtitle: 'Capability only', artifact: 'work.md', omitted: '不调用 persona.md', use: '只调用流程、规则、判断标准与工作方法' },
  { id: 'persona', label: 'PERSONA ONLY', subtitle: 'Restricted behavior only', artifact: 'persona.md', omitted: '不调用 work.md', use: '只调用表达偏好、互动规则与行为约束' },
];

const emptyPrivacy = { rights: false, local: false, noShare: false };

export const BoundedArtifact: React.FC<WidgetProps> = () => {
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<ScopeId[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState(emptyPrivacy);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [built, setBuilt] = useState(false);
  const [property, setProperty] = useState<PropertyId | null>(null);
  const [tested, setTested] = useState<PropertyId[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<SkillVariant>('full');

  const activeProfile = profiles.find(item => item.id === profile);
  const availableMaterials = useMemo(() => profile ? materials[profile].filter(item => selectedScopes.includes(item.scope)) : [], [profile, selectedScopes]);
  const selectedMaterialData = useMemo(() => profile ? materials[profile].filter(item => selectedMaterials.includes(item.id)) : [], [profile, selectedMaterials]);
  const hasSensitive = selectedMaterialData.some(item => item.sensitive);
  const privacyComplete = privacy.rights && privacy.local && privacy.noShare;
  const canBuild = Boolean(profile && selectedScopes.length && selectedMaterials.length && (!hasSensitive || privacyComplete));

  useEffect(() => {
    if (!isBuilding) return undefined;
    setBuildStage(1);
    const timers = [
      window.setTimeout(() => setBuildStage(2), 720),
      window.setTimeout(() => setBuildStage(3), 1650),
      window.setTimeout(() => setBuildStage(4), 2550),
      window.setTimeout(() => {
        const payload = {
          profile: activeProfile ? { id: activeProfile.id, icon: activeProfile.icon, label: activeProfile.label } : null,
          scopes: scopes.filter(item => selectedScopes.includes(item.id)).map(item => ({ id: item.id, icon: item.icon, label: item.label })),
          materials: selectedMaterialData.map(item => ({ id: item.id, icon: item.icon, label: item.label })),
          governance: { rightsConfirmed: privacy.rights, localOnly: privacy.local, noShareByDefault: privacy.noShare, sensitive: hasSensitive },
        };
        try {
          window.sessionStorage.setItem('colleague-skill:s2-build', JSON.stringify(payload));
          window.sessionStorage.setItem('colleague-skill:variant', selectedVariant);
          window.dispatchEvent(new CustomEvent('colleague-skill:s2-built', { detail: payload }));
          window.dispatchEvent(new CustomEvent('colleague-skill:variant', { detail: selectedVariant }));
        } catch { /* Session state is an enhancement; the artifact still builds without it. */ }
        setBuilt(true);
        setIsBuilding(false);
      }, 3300),
    ];
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [isBuilding]);

  const chooseProfile = (id: ProfileId) => {
    setProfile(id);
    setSelectedScopes([]);
    setSelectedMaterials([]);
    setPrivacy(emptyPrivacy);
    setBuilt(false);
    setBuildStage(0);
    setProperty(null);
    setTested([]);
  };

  const toggleScope = (id: ScopeId) => {
    const next = selectedScopes.includes(id) ? selectedScopes.filter(item => item !== id) : [...selectedScopes, id];
    setSelectedScopes(next);
    if (profile) {
      const allowed = new Set(materials[profile].filter(item => next.includes(item.scope)).map(item => item.id));
      setSelectedMaterials(current => current.filter(item => allowed.has(item)));
    }
    setPrivacy(emptyPrivacy);
    setBuilt(false);
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setBuilt(false);
  };

  const build = () => {
    if (!canBuild) return;
    setProperty(null);
    setTested([]);
    setBuilt(false);
    setBuildStage(0);
    setIsBuilding(true);
  };

  const testProperty = (id: PropertyId) => {
    setProperty(id);
    setTested(current => current.includes(id) ? current : [...current, id]);
  };

  const selectVariant = (variant: SkillVariant) => {
    setSelectedVariant(variant);
    try {
      window.sessionStorage.setItem('colleague-skill:variant', variant);
      window.dispatchEvent(new CustomEvent('colleague-skill:variant', { detail: variant }));
    } catch { /* Variant persistence only connects later tutorial chapters. */ }
  };

  const activeVariant = skillVariants.find(item => item.id === selectedVariant) || skillVariants[0];

  return <div className={`paper-widget bounded-artifact-v2 build-stage-${buildStage}${isBuilding ? ' is-building' : ''}${built ? ' is-built' : ''}`}>
    {!built && <section className={`guided-builder${isBuilding ? ' is-building' : ''}`}>
      <div className="guided-progress" aria-label="构造步骤">
        <span className={profile ? 'done' : 'active'}>1 · p</span>
        <i>→</i><span className={selectedScopes.length ? 'done' : profile ? 'active' : ''}>2 · c</span>
        <i>→</i><span className={selectedMaterials.length ? 'done' : selectedScopes.length ? 'active' : ''}>3 · D</span>
      </div>

      <section className="s2-step-card step-profile">
        <header><span>p</span><div><b>Profile</b><small>选择任务所需的轻量画像，不创建完整身份模型。</small></div></header>
        <div className="profile-options" role="group" aria-label="选择画像类型">
          {profiles.map(item => <button type="button" key={item.id} className={profile === item.id ? 'active' : ''} onClick={() => chooseProfile(item.id)} aria-pressed={profile === item.id}>
            <span>{item.icon}</span><b>{item.label}</b><small>{item.desc}</small>
          </button>)}
        </div>
      </section>

      <section className={`s2-step-card step-scope${!profile ? ' is-locked' : ''}`}>
        <header><span>c</span><div><b>Source scope</b><small>{profile ? '勾选内容类型，同时明确每种来源的权利与范围边界。' : '先完成 p，来源范围才会解锁。'}</small></div></header>
        {profile && <div className="scope-options">
          {scopes.map(item => <label key={item.id} className={selectedScopes.includes(item.id) ? 'active' : ''}>
            <input type="checkbox" checked={selectedScopes.includes(item.id)} onChange={() => toggleScope(item.id)} />
            <span>{item.icon}</span><b>{item.label}</b><small>{item.boundary}</small>
          </label>)}
        </div>}
      </section>

      <section className={`s2-step-card step-materials${!selectedScopes.length ? ' is-locked' : ''}`}>
        <header><span>D</span><div><b>Materials</b><small>{selectedScopes.length ? `只显示落在当前 p=${activeProfile?.label} 与 c 范围内的候选材料。` : '先选择至少一种 source scope。'}</small></div></header>
        {selectedScopes.length > 0 && <>
          <div className="material-options">
            {availableMaterials.length ? availableMaterials.map(item => <label key={item.id} className={`${selectedMaterials.includes(item.id) ? 'active' : ''}${item.sensitive ? ' sensitive' : ''}`}>
              <input type="checkbox" checked={selectedMaterials.includes(item.id)} onChange={() => toggleMaterial(item.id)} />
              <span>{item.icon}</span><b>{item.label}</b>{item.sensitive && <small>敏感材料 · 需要确认</small>}
            </label>) : <p className="material-empty">当前 source scope 下没有适合该画像的候选材料。请返回调整 c。</p>}
          </div>
          <p className="scope-filter-note">范围过滤已生效：未勾选的 Chats、Emails、Documents 或 Audio 不会出现在 D 中。</p>
        </>}
      </section>

      {hasSensitive && <section className="privacy-confirmation" aria-label="隐私确认">
        <header><span>🔐</span><div><b>Privacy Confirmation</b><small>敏感材料不能被静默蒸馏。三个条件必须全部确认。</small></div></header>
        <label><input type="checkbox" checked={privacy.rights} onChange={event => setPrivacy(current => ({ ...current, rights: event.target.checked }))} /> I confirm I have the right to use these materials</label>
        <label><input type="checkbox" checked={privacy.local} onChange={event => setPrivacy(current => ({ ...current, local: event.target.checked }))} /> Use locally only</label>
        <label><input type="checkbox" checked={privacy.noShare} onChange={event => setPrivacy(current => ({ ...current, noShare: event.target.checked }))} /> Do not publish or share by default</label>
      </section>}

      <div className="build-gate">
        <button type="button" onClick={build} disabled={!canBuild || isBuilding}>BUILD PERSON-GROUNDED SKILL</button>
        {!canBuild && <p>{!profile ? '先选择 p-profile。' : !selectedScopes.length ? '再定义 c-source scope。' : !selectedMaterials.length ? '从范围内选择至少一项 D-material。' : '敏感材料的 Privacy Confirmation 尚未全部完成。'}</p>}
      </div>
    </section>}

    {(isBuilding || built) && <section className={`build-theater build-stage-${buildStage}${built ? ' is-built' : ''}`} aria-live="polite">
      <div className="build-stage-label">{buildStage === 1 ? 'Step 1 · p、c、D 收拢为输入 token' : buildStage === 2 ? 'Step 2 · 在范围约束内蒸馏材料' : buildStage === 3 ? 'Step 3 · 形成 Person-Grounded Skill' : 'Step 4 · 展开可维护的 A / M / L'}</div>
      <div className="pcd-token-row">
        <span><b>p</b><small>{activeProfile?.icon} {activeProfile?.label}</small></span>
        <span><b>c</b><small>{selectedScopes.length} source boundaries</small></span>
        <span><b>D</b><small>{selectedMaterials.length} selected materials</small></span>
      </div>
      <div className="material-fragments" aria-hidden="true">
        {selectedMaterialData.slice(0, 6).map(item => <span key={item.id}>{item.icon}</span>)}
      </div>
      <div className="s2-distiller"><span aria-hidden="true">⚗️</span><b>Distilling…</b><small>只处理 p、c、D 允许的内容</small></div>
      <div className="skill-core"><b>S</b><span>Person-Grounded Skill</span></div>
      <div className="aml-stack">
        <div><b>A</b><span>Artifact</span><small>可读文件与入口</small></div>
        <div><b>M</b><span>Metadata</span><small>来源、安装与边界</small></div>
        <div><b>L</b><span>Lifecycle</span><small>版本、纠正与回滚</small></div>
      </div>
      <div className="s2-result-formula">S = (A, M, L)</div>
      <p className="s2-result-note">输出不是“目标人物本身”，而是一个结构化、可维护的 Skill Package。</p>
    </section>}

    {built && <section className="artifact-test-lab">
      <header className="artifact-causal-bridge">
        <StateBadge tone="good">Skill 已生成</StateBadge>
        <div><b>现在检查：它是否真的是一个好 Skill？</b><span>Let's test the artifact.</span></div>
      </header>

      <div className="property-test-strip" role="group" aria-label="点亮五项工件属性">
        {propertyLabels.map(item => <button type="button" key={item.id} className={`${property === item.id ? 'active' : ''}${tested.includes(item.id) ? ' tested' : ''}`} onClick={() => testProperty(item.id)}>
          <span>{tested.includes(item.id) ? '✓' : '○'}</span><b>{item.label}</b>
        </button>)}
      </div>

      <div className={`property-test-detail${property ? ' is-visible' : ''}`}>
        {!property && <div className="property-empty"><span>选择一个灰色属性开始测试</span><p>每次点击都会展开一个可操作的工件证据。</p></div>}

        {property === 'portable' && <div className="property-demo portable-demo">
          <div className="property-question"><b>Can this skill move across different agent hosts?</b><p>它能不能被不同 Agent Host 直接安装和调用？</p></div>
          <div className="portable-map"><span className="demo-skill-box">S</span><i>↘</i><div><b>Codex</b><b>Claude Code</b><b>Other skill hosts</b></div></div>
        </div>}

        {property === 'inspectable' && <div className="property-demo inspectable-demo">
          <div className="property-question"><b>Can I see what is inside the skill?</b><p>我能不能直接看到 Skill 里面到底写了什么？</p></div>
          <div className="inspect-tree"><b>A</b><span>├─ work.md</span><span>└─ persona.md</span><b>M</b><span>└─ metadata.json</span><b>L</b><span>└─ version history</span></div>
        </div>}

        {property === 'composable' && <div className="property-demo composable-demo">
          <div className="property-question"><b>Can I use only the part I need?</b><p>我能不能只调用我需要的那一部分？</p></div>
          <div className="variant-composer">
            <div className="variant-source"><b>同一份 Person-Grounded Skill</b><span>work.md + persona.md + metadata + lifecycle</span></div>
            <div className="variant-choice-row" role="group" aria-label="选择 Skill 组合模式">
              {skillVariants.map(item => <button type="button" key={item.id} className={selectedVariant === item.id ? 'active' : ''} onClick={() => selectVariant(item.id)} aria-pressed={selectedVariant === item.id}>
                <b>{item.label}</b><small>{item.subtitle}</small>
              </button>)}
            </div>
            <div className="variant-detail" aria-live="polite">
              <header><b>{activeVariant.label}</b><span>{activeVariant.subtitle}</span></header>
              <div className="variant-file-scope">
                <span className={selectedVariant !== 'persona' ? 'included' : 'omitted'}><b>work.md</b><small>{selectedVariant !== 'persona' ? '调用' : '不调用'}</small></span>
                <span className={selectedVariant !== 'work' ? 'included' : 'omitted'}><b>persona.md</b><small>{selectedVariant !== 'work' ? '调用' : '不调用'}</small></span>
                <span className="retained"><b>M + L</b><small>始终保留</small></span>
              </div>
              <p><b>Artifact：</b>{activeVariant.artifact}；{activeVariant.omitted}。</p>
              <p><b>适合：</b>{activeVariant.use}。</p>
            </div>
            <aside>三个变体不是三个不同的目标人物，也不是重新蒸馏三次；它们是同一 Skill 在不同调用范围下的组合方式。Metadata、来源边界、权利状态与 Lifecycle 始终保留。</aside>
          </div>
        </div>}

        {property === 'correctable' && <div className="property-demo correctable-demo">
          <div className="property-question"><b>If the skill is wrong, can it be corrected and versioned?</b><p>如果 Skill 理解错了，能不能修正，并保留版本历史？</p></div>
          <div className="correction-map"><blockquote>“He would not say that.”</blockquote><span>↓ correction patch ↓</span><div><b>v1</b><i>→</i><b>v2</b></div></div>
        </div>}

        {property === 'governable' && <div className="property-demo governable-demo">
          <div className="property-question"><b>Can this skill be controlled, reviewed, shared, or deleted under clear rules?</b><p>它能不能在明确规则下被审查、分享、保留或删除？</p></div>
          <div className="governance-checks">
            <span>Source Rights <b>✓</b></span><span>Source Boundary <b>✓</b></span><span>Consent <b>✓</b></span>
            <span>Sharing Policy <b>Local Only</b></span><span>Deletion <b>✓</b></span><span>Rollback <b>✓</b></span>
          </div>
        </div>}
      </div>

      <div className="artifact-test-footer">
        <span>{tested.length}/5 properties tested</span>
        <button type="button" onClick={() => { setBuilt(false); setBuildStage(0); setProperty(null); setTested([]); }}>↺ 重新构造 p、c、D</button>
      </div>
    </section>}
  </div>;
};

export default BoundedArtifact;
