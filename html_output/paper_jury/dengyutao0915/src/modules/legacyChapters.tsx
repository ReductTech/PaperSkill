// ============================================================
// 旧版教程（paperjury_tutorial）剩余 8 个章节模块的全量移入。
// 与新版模板模块主题相同，但保留旧版独立交互形态，作为各章补充模块挂载。
// 组件：视角切换 / 架构对比 / 审稿人数 / 路由模拟 / 陪审团投票 /
//       守卫链步进 / 轮次收敛 / 消融瀑布图
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { setupChartCanvas } from './legacyChart';

/* ---------------- Ch1: 表面完成 vs 实际健全（点击切换） ---------------- */
export function LegacySurfaceVsSoundView() {
  const [view, setView] = useState<'surface' | 'sound'>('surface');

  return (
    <div>
      <div className="module-hint">点击切换两种视角，观察同一篇论文的不同面貌</div>
      <div className="btn-group">
        <button className={`btn ${view === 'surface' ? 'active' : ''}`} onClick={() => setView('surface')}>
          表面视角：看起来完成
        </button>
        <button className={`btn ${view === 'sound' ? 'active' : ''}`} onClick={() => setView('sound')}>
          批判视角：论证健全吗？
        </button>
      </div>
      <div style={{ padding: '20px', background: view === 'surface' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', transition: 'all 0.3s' }}>
        {view === 'surface' ? (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a', marginBottom: '12px' }}>✓ 文字流畅，格式规范</div>
            <ul style={{ fontSize: '14px', color: '#374151', lineHeight: 2, margin: 0, paddingLeft: '20px' }}>
              <li>✓ 摘要结构完整，关键词清晰</li>
              <li>✓ 表格排版整齐，数字对齐</li>
              <li>✓ 参考文献格式统一</li>
              <li>✓ 每一节内部逻辑自洽</li>
            </ul>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
              "这篇论文看起来已经完成了。"
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>⚠ 跨章节矛盾浮现</div>
            <ul style={{ fontSize: '14px', color: '#374151', lineHeight: 2, margin: 0, paddingLeft: '20px' }}>
              <li style={{ color: '#dc2626' }}>✗ 消融表宣称最佳结果，但3页后分域表中基线方法数字更高</li>
              <li style={{ color: '#dc2626' }}>✗ 引言声称的贡献，实验部分并未完全验证</li>
              <li style={{ color: '#dc2626' }}>✗ 两个章节对同一概念的定义不一致</li>
              <li>⚠ 每个表格内部一致，但放在一起就冲突</li>
            </ul>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
              "问题不在表面，而在跨章节的证据矛盾里。"
            </div>
          </div>
        )}
      </div>
      <div className="module-feedback info">
        {view === 'surface'
          ? '当前视角：只看表面。文字流畅≠论证健全，就像外墙粉刷一新的大楼可能承重墙已开裂。'
          : '当前视角：批判审视。发现了消融表与分域表的跨章节矛盾——这正是需要预提交强化的原因。'}
      </div>
    </div>
  );
}

/* ---------------- Ch3: 谁握法槌？两种架构对比（点击切换） ---------------- */
export function LegacyGavelComparison() {
  const [mode, setMode] = useState<'model' | 'deterministic'>('model');

  return (
    <div>
      <div className="module-hint">点击切换两种架构，观察裁决和编辑的可靠性差异</div>
      <div className="btn-group">
        <button className={`btn ${mode === 'model' ? 'active' : ''}`} onClick={() => setMode('model')}>
          模型中心：LLM 握法槌
        </button>
        <button className={`btn ${mode === 'deterministic' ? 'active' : ''}`} onClick={() => setMode('deterministic')}>
          确定性中心：代码握法槌
        </button>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: mode === 'model' ? '#fef2f2' : '#f9fafb', borderRadius: '8px', border: mode === 'model' ? '2px solid #dc2626' : '1px solid #e5e7eb', transition: 'all 0.3s' }}>
          <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '8px' }}>{mode === 'model' ? '🔨' : '📖'}</div>
          <div style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: mode === 'model' ? '#dc2626' : '#6b7280' }}>
            语义模型（LLM）
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            {mode === 'model' ? '阅读 + 裁决 + 编辑 + 停止判定' : '仅阅读、判断、起草'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: mode === 'deterministic' ? '#f0fdf4' : '#f9fafb', borderRadius: '8px', border: mode === 'deterministic' ? '2px solid #16a34a' : '1px solid #e5e7eb', transition: 'all 0.3s' }}>
          <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '8px' }}>{mode === 'deterministic' ? '⚖️' : '⚙️'}</div>
          <div style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: mode === 'deterministic' ? '#16a34a' : '#6b7280' }}>
            确定性编排（代码）
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            {mode === 'deterministic' ? '状态/路由/停止/精确一次应用' : '仅辅助工具'}
          </div>
        </div>
      </div>
      <div className={`module-feedback ${mode === 'model' ? 'danger' : 'success'}`}>
        {mode === 'model'
          ? '⚠ 风险：模型既提案又认证完成=利益冲突。LLM-as-Judge已知存在评分偏见和位置偏见，换个prompt裁决就变。'
          : '✓ PaperJury方案：模型做最难的阅读，但法槌（裁决权）和橡皮（编辑权）交给确定性代码。"The model still does the hard reading; it no longer holds the gavel or the eraser."'}
      </div>
    </div>
  );
}

/* ---------------- Ch5: 审稿人数调节器（滑块） ---------------- */
export function LegacyReviewerCount() {
  const [n, setN] = useState(3);

  const coverage = n === 2 ? 78 : n === 3 ? 89 : 94;
  const cost = n === 2 ? 4.2 : n === 3 ? 6.8 : 9.5;
  const risk = n === 2 ? '较高' : n === 3 ? '中等' : '较低';

  return (
    <div>
      <div className="module-hint">拖动滑块调节审稿人数 N（范围 2-4，默认 3），观察覆盖度和成本的变化</div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '48px', fontWeight: 800, color: '#2563eb' }}>N = {n}</div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>位整体审稿人</div>
      </div>
      <div className="slider-group">
        <div className="slider-label">
          <span>审稿人数 N</span>
          <span className="value">{n} 人</span>
        </div>
        <input type="range" min="2" max="4" step="1" value={n} onChange={(e) => setN(Number(e.target.value))} />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>预计覆盖度</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{coverage}%</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: '#ffedd5', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Token 成本(M)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>{cost}</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>漏检风险</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{risk}</div>
        </div>
      </div>
      <div className="module-feedback info">
        {n === 2 && 'N=2：成本最低，但两位审稿人可能有共同盲区，覆盖度不足。'}
        {n === 3 && 'N=3（默认）：覆盖度与成本的最佳平衡点。论文实验使用3位审稿人。'}
        {n === 4 && 'N=4：覆盖度最高，但成本增加40%，边际收益递减。'}
      </div>
    </div>
  );
}

/* ---------------- Ch6: 问题路由模拟器（点击选择） ---------------- */
interface LegacyIssue {
  id: string;
  text: string;
  type: 'mechanical' | 'minor' | 'major';
  route: 'polish' | 'trial';
}

const LEGACY_ISSUES: LegacyIssue[] = [
  { id: '1', text: '参考文献格式不统一，有的缺页码', type: 'mechanical', route: 'polish' },
  { id: '2', text: '第3节一个术语定义与第5节不一致', type: 'minor', route: 'polish' },
  { id: '3', text: '消融实验中基线方法的数字与分域表矛盾', type: 'major', route: 'trial' },
  { id: '4', text: '引言声称的贡献在实验中未完全验证', type: 'major', route: 'trial' },
  { id: '5', text: '一个公式的下标写错了', type: 'mechanical', route: 'polish' },
  { id: '6', text: '相关工作遗漏了一篇重要的对比方法', type: 'minor', route: 'polish' },
];

const LEGACY_TYPE_LABELS = {
  mechanical: '机械性',
  minor: '次要实质性',
  major: '实质性重大',
} as const;

export function LegacyRoutingSimulator() {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleSelect = (id: string) => {
    setSelected(id);
    setRevealed((prev) => ({ ...prev, [id]: true }));
  };

  const selectedIssue = LEGACY_ISSUES.find((i) => i.id === selected);

  return (
    <div>
      <div className="module-hint">点击问题卡片，查看它被路由到 polish（快速处理）还是 trial（开庭审判）</div>
      <div style={{ marginBottom: '16px' }}>
        {LEGACY_ISSUES.map((issue) => (
          <div
            key={issue.id}
            className={`issue-card ${selected === issue.id ? 'selected' : ''}`}
            onClick={() => handleSelect(issue.id)}
          >
            <span className={`issue-type ${issue.type}`}>{LEGACY_TYPE_LABELS[issue.type]}</span>
            {issue.text}
            {revealed[issue.id] && (
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: issue.route === 'trial' ? '#fee2e2' : '#f0fdf4', fontSize: '13px', fontWeight: 600, color: issue.route === 'trial' ? '#dc2626' : '#16a34a' }}>
                {issue.route === 'trial' ? '⚖️ → 路由至：正当程序审判（due-process trial）' : '🔧 → 路由至：快速处理（polish path）'}
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedIssue && (
        <div className="module-feedback info">
          {selectedIssue.type === 'mechanical' && '机械性问题（格式、拼写）→ 低成本polish路径，不需要开庭审判。'}
          {selectedIssue.type === 'minor' && '次要实质性问题 → polish路径处理，节约审判资源。'}
          {selectedIssue.type === 'major' && '可争议的实质性重大问题 → 必须进入正当程序审判，因为第一判断出错的后果最严重。'}
        </div>
      )}
    </div>
  );
}

/* ---------------- Ch7: 陪审团投票模拟器（滑块 + 投票可视化） ---------------- */
export function LegacyJuryVote() {
  const [jurySize, setJurySize] = useState(5);
  const [guiltyVotes, setGuiltyVotes] = useState(3);

  const quorum = Math.ceil(0.8 * jurySize);
  const surviving = jurySize;
  const majorityThreshold = 0.6 * surviving;
  const notGuiltyVotes = surviving - guiltyVotes;

  const quorumMet = surviving >= quorum;
  const guiltyMajority = guiltyVotes > majorityThreshold;
  const notGuiltyMajority = notGuiltyVotes > majorityThreshold;

  let verdict: string;
  let verdictColor: string;
  if (!quorumMet) {
    verdict = '未达法定人数 → 升级到12人陪审团';
    verdictColor = '#ea580c';
  } else if (guiltyMajority) {
    verdict = 'valid-fixable（成立且可机修）或 author-required（成立需作者）';
    verdictColor = '#16a34a';
  } else if (notGuiltyMajority) {
    verdict = 'invalid-drop（无效驳回）';
    verdictColor = '#dc2626';
  } else {
    verdict = '未达绝对多数 → 升级到12人陪审团';
    verdictColor = '#ea580c';
  }

  return (
    <div>
      <div className="module-hint">调节陪审团规模和投票分布，观察 quorum + majority 裁决规则</div>
      <div className="slider-group">
        <div className="slider-label">
          <span>陪审团规模</span>
          <span className="value">{jurySize} 人</span>
        </div>
        <input type="range" min="5" max="12" step="1" value={jurySize} onChange={(e) => { const v = Number(e.target.value); setJurySize(v); setGuiltyVotes(Math.min(guiltyVotes, v)); }} />
      </div>
      <div className="slider-group">
        <div className="slider-label">
          <span>投票"指控成立"的人数</span>
          <span className="value">{guiltyVotes} / {jurySize}</span>
        </div>
        <input type="range" min="0" max={jurySize} step="1" value={guiltyVotes} onChange={(e) => setGuiltyVotes(Number(e.target.value))} />
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Array.from({ length: guiltyVotes }).map((_, i) => (
          <div key={`g${i}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓</div>
        ))}
        {Array.from({ length: notGuiltyVotes }).map((_, i) => (
          <div key={`n${i}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 }}>✗</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px', padding: '10px 14px', background: quorumMet ? '#f0fdf4' : '#fef2f2', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>法定人数 quorum ≥ ceil(0.8×{jurySize}) = {quorum}</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: quorumMet ? '#16a34a' : '#dc2626' }}>{surviving >= quorum ? '✓ 达到' : '✗ 未达'}</div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', padding: '10px 14px', background: guiltyMajority || notGuiltyMajority ? '#f0fdf4' : '#fef2f2', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>绝对多数 {'>'} 60% = {majorityThreshold.toFixed(1)}票</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: guiltyMajority || notGuiltyMajority ? '#16a34a' : '#dc2626' }}>
            {guiltyMajority ? '✓ 成立方' : notGuiltyMajority ? '✓ 驳回方' : '✗ 均未达'}
          </div>
        </div>
      </div>

      <div className="module-feedback" style={{ background: `${verdictColor}15`, color: verdictColor }}>
        <strong>裁决结果：</strong>{verdict}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        三向结果：invalid-drop（驳回）/ valid-fixable（成立可修）/ author-required（成立需作者）。问题有效性 ≠ 机器可编辑性。
      </div>
    </div>
  );
}

/* ---------------- Ch8: 守卫链步进演示（P2 步进） ---------------- */
interface LegacyGuardStep {
  name: string;
  desc: string;
  pass: boolean;
  detail: string;
}

const LEGACY_GUARD_STEPS: LegacyGuardStep[] = [
  { name: '1. 锚点检查', desc: '验证补丁是否在指定的 anchor 范围内', pass: true, detail: '补丁范围与 anchor-bounded diff 一致，未越界。' },
  { name: '2. 交叉引用检查', desc: '检查是否破坏 \\ref / \\cite 等引用', pass: true, detail: '所有交叉引用仍然有效，无断裂引用。' },
  { name: '3. 语义审计', desc: 'RISKY 补丁触发 meaning-audit（冻结锚点四态）', pass: false, detail: '⚠ 补丁悄悄改变了邻近句子的主张！冻结主张主线检测到 claim-level 漂移。' },
  { name: '4. 编译检查', desc: 'LaTeX 编译是否通过', pass: true, detail: '编译通过，无 undefined control sequence。' },
];

export function LegacyGuardChain() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const next = () => {
    if (currentStep < LEGACY_GUARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
      if (currentStep + 1 >= LEGACY_GUARD_STEPS.length) setCompleted(true);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setCompleted(false);
  };

  const allPass = LEGACY_GUARD_STEPS.slice(0, currentStep).every((s) => s.pass);
  const failedStep = LEGACY_GUARD_STEPS.slice(0, currentStep).find((s) => !s.pass);

  return (
    <div>
      <div className="module-hint">点击"下一步"，观察补丁经过守卫链的每一步检查</div>
      <div className="step-indicator">
        {LEGACY_GUARD_STEPS.map((_, i) => (
          <div
            key={i}
            className={`step-dot ${i < currentStep ? (LEGACY_GUARD_STEPS[i].pass ? 'done' : 'active') : i === currentStep ? 'active' : ''}`}
            style={i < currentStep && !LEGACY_GUARD_STEPS[i].pass ? { background: '#dc2626' } : {}}
          />
        ))}
      </div>
      <div className="step-content">
        {currentStep === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>补丁待审</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>一个 valid-fixable 问题的编辑补丁即将进入守卫链。<br />它能通过所有检查吗？</div>
          </div>
        )}
        {currentStep > 0 && currentStep <= LEGACY_GUARD_STEPS.length && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: LEGACY_GUARD_STEPS[currentStep - 1].pass ? '#16a34a' : '#dc2626' }}>
              {LEGACY_GUARD_STEPS[currentStep - 1].pass ? '✓' : '✗'} {LEGACY_GUARD_STEPS[currentStep - 1].name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{LEGACY_GUARD_STEPS[currentStep - 1].desc}</div>
            <div style={{ fontSize: '14px', color: '#374151', padding: '10px 14px', background: '#fff', borderRadius: '6px', border: `1px solid ${LEGACY_GUARD_STEPS[currentStep - 1].pass ? '#16a34a33' : '#dc262633'}` }}>
              {LEGACY_GUARD_STEPS[currentStep - 1].detail}
            </div>
          </div>
        )}
      </div>
      <div className="btn-group">
        {!completed ? (
          <button className="btn primary" onClick={next}>
            下一步 →
          </button>
        ) : (
          <button className="btn" onClick={reset}>
            重新演示
          </button>
        )}
      </div>
      {completed && (
        <div className={`module-feedback ${allPass ? 'success' : 'danger'}`}>
          {allPass
            ? '✓ 守卫链全部通过！补丁将被精确一次应用并记录日志，可随时回滚。'
            : `✗ 守卫链在第${failedStep ? LEGACY_GUARD_STEPS.indexOf(failedStep) + 1 : '?'}步阻断！补丁被拒绝/回滚，不会应用到论文。这就是 PaperJury 编辑安全的构造方式。`}
        </div>
      )}
      {!completed && currentStep > 0 && (
        <div className="module-feedback info">
          当前进度：{currentStep}/{LEGACY_GUARD_STEPS.length}。守卫链是风险比例的：LOW风险走轻量路径，RISKY触发更强审计。
        </div>
      )}
    </div>
  );
}

/* ---------------- Ch9: 轮次收敛模拟器（步进） ---------------- */
interface LegacyRoundData {
  round: number;
  newIssues: number;
  closedIssues: number;
  openIssues: number;
  note: string;
}

const LEGACY_ROUNDS: LegacyRoundData[] = [
  { round: 1, newIssues: 12, closedIssues: 5, openIssues: 7, note: '首轮审稿发现大量问题，5个被裁决关闭' },
  { round: 2, newIssues: 4, closedIssues: 4, openIssues: 7, note: 'clean re-review 发现4个新问题（编辑引入的），同时关闭4个' },
  { round: 3, newIssues: 1, closedIssues: 5, openIssues: 3, note: '新问题大幅减少，大部分遗留问题被处理' },
  { round: 4, newIssues: 0, closedIssues: 3, openIssues: 0, note: '没有新问题！所有问题已关闭 → 触发停止谓词 τ' },
];

export function LegacyConvergence() {
  const [currentRound, setCurrentRound] = useState(0);
  const [completed, setCompleted] = useState(false);

  const next = () => {
    if (currentRound < LEGACY_ROUNDS.length) {
      setCurrentRound(currentRound + 1);
      if (currentRound + 1 >= LEGACY_ROUNDS.length) setCompleted(true);
    }
  };

  const reset = () => {
    setCurrentRound(0);
    setCompleted(false);
  };

  const current = LEGACY_ROUNDS[currentRound - 1];

  return (
    <div>
      <div className="module-hint">点击"下一轮"，观察多轮 clean re-review 的收敛过程和确定性停止</div>
      <div className="step-indicator">
        {LEGACY_ROUNDS.map((_, i) => (
          <div key={i} className={`step-dot ${i < currentRound ? 'done' : i === currentRound ? 'active' : ''}`} />
        ))}
      </div>
      <div className="step-content">
        {currentRound === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>开始审稿循环</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>每轮重读当前论文文本（clean re-review），<br />不沿用先前的批评意见。</div>
          </div>
        )}
        {current && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#2563eb' }}>
              第 {current.round} 轮
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '80px', padding: '10px', background: '#ffedd5', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>新问题 Uᵣ</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#ea580c' }}>{current.newIssues}</div>
              </div>
              <div style={{ flex: 1, minWidth: '80px', padding: '10px', background: '#f0fdf4', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>已关闭 Cᵣ</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>{current.closedIssues}</div>
              </div>
              <div style={{ flex: 1, minWidth: '80px', padding: '10px', background: '#fee2e2', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>未解决</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626' }}>{current.openIssues}</div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{current.note}</div>
          </div>
        )}
      </div>
      <div className="btn-group">
        {!completed ? (
          <button className="btn primary" onClick={next}>
            下一轮 →
          </button>
        ) : (
          <button className="btn" onClick={reset}>
            重新模拟
          </button>
        )}
      </div>
      {completed && (
        <div className="module-feedback success">
          ✓ 收敛！第4轮新问题=0，停止谓词 τ(L,Uᵣ,Cᵣ,r)=true，系统自动停止。<br />
          这不是模型说"我觉得完成了"，而是确定性账本查询的结果。论文实验中 PaperJury 平均 3.08±0.67 轮收敛，从未触达5轮上限。
        </div>
      )}
    </div>
  );
}

/* ---------------- Ch10: 消融瀑布图（指标切换 + 瀑布图） ---------------- */
const LEGACY_ABLATION_ROWS = [
  { variantZh: '移除有界审稿', deltaF1: -0.077, deltaAcc_v: -0.013, deltaESVR: 0.013 },
  { variantZh: '移除确定性路由', deltaF1: -0.013, deltaAcc_v: -0.075, deltaESVR: 0.018 },
  { variantZh: '移除正当程序审判', deltaF1: -0.007, deltaAcc_v: -0.153, deltaESVR: 0.023 },
  { variantZh: '移除冻结主张主线', deltaF1: -0.017, deltaAcc_v: -0.024, deltaESVR: 0.083 },
  { variantZh: '移除守卫链', deltaF1: -0.022, deltaAcc_v: -0.022, deltaESVR: 0.152 },
];

const LEGACY_ABLATION_METRICS = [
  { key: 'deltaF1', label: 'Δ F1', desc: '移除组件后 F1 的变化（负=退化）' },
  { key: 'deltaAcc_v', label: 'Δ Acc_v', desc: '裁决准确率的变化' },
  { key: 'deltaESVR', label: 'Δ ESVR', desc: '编辑安全违规率的变化（正=更危险）' },
] as const;

type LegacyAblationMetric = (typeof LEGACY_ABLATION_METRICS)[number]['key'];

/** 瀑布图（自旧版 utils/chart.ts drawWaterfallChart 移入，使用 legacyChart 的 setupChartCanvas） */
function drawWaterfallChart(
  canvas: HTMLCanvasElement,
  data: { label: string; delta: number; color: string }[],
  opts: { height?: number; yLabel?: string } = {}
) {
  const height = opts.height ?? 300;
  const { ctx, width } = setupChartCanvas(canvas, height);
  const style = {
    bg: '#ffffff',
    text: '#1f2937',
    textLight: '#6b7280',
  };

  const padL = 72, padR = 16, padT = 20, padB = 64;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const deltas = data.map((d) => d.delta);
  const maxAbs = Math.max(...deltas.map(Math.abs), 0.01);
  const yRange = maxAbs * 1.3;
  const zeroY = padT + chartH / 2;

  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, width, height);

  // 零线
  ctx.strokeStyle = style.textLight;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, zeroY);
  ctx.lineTo(padL + chartW, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Y 轴刻度
  ctx.fillStyle = style.textLight;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = -2; i <= 2; i++) {
    const y = zeroY - (i / 2) * (chartH / 2);
    const val = (i / 2) * yRange;
    ctx.fillText((val >= 0 ? '+' : '') + val.toFixed(3), padL - 8, y);
  }

  if (opts.yLabel) {
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = style.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }

  // 柱子
  const groupW = chartW / data.length;
  const barW = groupW * 0.5;
  data.forEach((d, i) => {
    const x = padL + i * groupW + (groupW - barW) / 2;
    const barH = (Math.abs(d.delta) / yRange) * (chartH / 2);
    const y = d.delta >= 0 ? zeroY - barH : zeroY;
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x, y, barW, barH);
    ctx.globalAlpha = 1;
    // 值标签
    ctx.fillStyle = style.text;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = d.delta >= 0 ? 'bottom' : 'top';
    ctx.fillText((d.delta >= 0 ? '+' : '') + d.delta.toFixed(3), x + barW / 2, d.delta >= 0 ? y - 4 : y + barH + 4);
    // 类别标签
    ctx.textBaseline = 'top';
    ctx.fillStyle = style.textLight;
    const words = d.label.split('\n');
    words.forEach((w, wi) => {
      ctx.fillText(w, x + barW / 2, padT + chartH + 10 + wi * 14);
    });
  });
}

export function LegacyAblationWaterfall() {
  const [metric, setMetric] = useState<LegacyAblationMetric>('deltaF1');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const meta = LEGACY_ABLATION_METRICS.find((m) => m.key === metric)!;

  useEffect(() => {
    if (!canvasRef.current) return;
    const data = LEGACY_ABLATION_ROWS.map((a) => {
      const val = a[metric];
      const isGood = metric === 'deltaESVR' ? val < 0 : val > 0;
      return {
        label: a.variantZh.replace('移除', '去掉\n'),
        delta: val,
        color: isGood ? '#16a34a' : '#dc2626',
      };
    });
    drawWaterfallChart(canvasRef.current, data, { height: 300, yLabel: meta.label });
  }, [metric, meta.label]);

  return (
    <div className="data-module">
      <div className="data-module-header">
        <div className="data-module-title">🔬 Table 6：消融实验 — 哪个组件最关键？</div>
        <div className="metric-tabs">
          {LEGACY_ABLATION_METRICS.map((m) => (
            <button
              key={m.key}
              className={`metric-tab ${metric === m.key ? 'active' : ''}`}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="metric-desc">
        {meta.desc}。在6篇预注册平衡子集上测试（每领域2篇）。
        {metric === 'deltaAcc_v' && <span className="hint"> · 去掉正当程序审判导致 Acc_v 暴跌 -0.153，是裁决质量的最大支柱</span>}
        {metric === 'deltaESVR' && <span className="hint"> · 去掉守卫链导致 ESVR 飙升 +0.152，是编辑安全的最大支柱</span>}
      </div>
      <canvas ref={canvasRef} className="module-canvas" style={{ width: '100%' }} />
      <div className="ablation-insight">
        <div className="insight-card">
          <div className="insight-icon">⚖️</div>
          <div>
            <strong>正当程序审判</strong>对裁决质量最关键
            <div className="insight-detail">去掉后 Acc_v 从 0.881 → 0.728（-0.153），陪审团+辩护律师的对抗结构是裁决准确的核心</div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">🛡️</div>
          <div>
            <strong>守卫链</strong>对编辑安全最关键
            <div className="insight-detail">去掉后 ESVR 从 0.029 → 0.181（+0.152），四道安检挡住了 17% 的危险补丁</div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">📏</div>
          <div>
            <strong>有界审稿</strong>对效率和质量双贡献
            <div className="insight-detail">去掉后 F1 -0.077 且时间从 2.43h → 4.81h，无界生成反而降低质量</div>
          </div>
        </div>
      </div>
      <div className="table-caption">数据来源：Table 6, p.9 · Full PaperJury 基准：F1=0.649, Acc_v=0.881, ESVR=0.029</div>
    </div>
  );
}
