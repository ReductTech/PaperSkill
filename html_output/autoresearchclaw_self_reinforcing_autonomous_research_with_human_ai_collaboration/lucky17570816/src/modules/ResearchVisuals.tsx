import { useState, type CSSProperties } from 'react';
import { Reveal } from '../lib/useInViewReveal';

export type VisualStage = 'discovery' | 'experimentation' | 'writing';
export type DebateMode = 'hypothesis' | 'result';
export type HealingBranch = 'repair' | 'refine' | 'pivot' | null;
export type VerificationState = 'idle' | 'verified' | 'rejected';

const stageData: Record<VisualStage, { chinese: string; english: string; input: string; summary: string; steps: string[]; output: string; gate: string; principle: string }> = {
  discovery: { chinese: '研究发现', english: 'Discovery', input: '研究范围 · 文献', summary: '界定问题、检索证据，再让不同角色挑战同一个想法。', steps: ['范围界定', '文献检索', '三角色假设辩论'], output: '可证伪假设与基线', gate: '文献筛选 · HITL', principle: '先让假设经得起反例与可行性检查。' },
  experimentation: { chinese: '实验执行', english: 'Experimentation', input: '实验计划 · 代码', summary: '运行实验，把错误、弱结果和失败转成下一步决策。', steps: ['实验设计', '生成 / 运行', '诊断与 Self-Healing', 'Repair / Refine / Pivot', '结果辩论'], output: '已记录证据与结论', gate: '实验设计 · HITL', principle: '失败是诊断输入，不是流水线终点。' },
  writing: { chinese: '论文写作', english: 'Writing', input: '证据记录 · 主张', summary: '起草、审阅，并只让存在于记录中的数值和引用进入论文。', steps: ['Draft', 'Review / Revision', '数字与引用验证'], output: '可追溯论文', gate: '质量门 · HITL', principle: '每个主张都必须能回到证据。' },
};

export function HeroResearchLoop() {
  return <Reveal className="hero-research-loop" aria-label="自我强化科研反馈回路">
    <svg className="hero-loop-desktop" viewBox="0 0 960 330" role="img" aria-label="研究想法经过发现、实验和写作，并由经验反馈到下一轮研究的科研闭环">
      <defs><marker id="hero-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" /></marker></defs>
      <path className="hero-main-path" d="M210 102 H250 M450 102 H490 M690 102 H730" markerEnd="url(#hero-arrow)" />
      <path className="hero-feedback-path" d="M835 146 C835 270 125 270 125 146" markerEnd="url(#hero-arrow)" />
      {[
        ['研究想法', 'Research Idea', 20], ['研究发现', 'Discovery', 260], ['实验执行', 'Experimentation', 500], ['论文写作', 'Writing', 740],
      ].map(([zh, en, x], index) => <g className={`hero-flow-node node-${index + 1}`} transform={`translate(${x} 64)`} key={String(en)}><rect width="190" height="76" rx="12" /><text className="zh" x="95" y="31">{zh}</text><text className="en" x="95" y="53">{en}</text></g>)}
      <g className="hero-evolution-node" transform="translate(310 254)"><rect width="340" height="52" rx="10" /><text x="170" y="22">Lesson / Feedback → Cross-Run Evolution</text><text className="minor" x="170" y="40">历史经验注入下一轮研究</text></g>
      <g className="hero-floating-tag failure" transform="translate(486 26)"><rect width="92" height="26" rx="13" /><text x="46" y="18">failure</text></g>
      <g className="hero-floating-tag evidence" transform="translate(653 193)"><rect width="98" height="26" rx="13" /><text x="49" y="18">evidence</text></g>
      <g className="hero-floating-tag lesson" transform="translate(212 193)"><rect width="83" height="26" rx="13" /><text x="42" y="18">lesson</text></g>
      <circle className="hero-traveller first" r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M210 102 H730" /></circle><circle className="hero-traveller second" r="4"><animateMotion dur="8s" repeatCount="indefinite" path="M835 146 C835 270 125 270 125 146" /></circle>
    </svg>
    <svg className="hero-loop-mobile" viewBox="0 0 360 382" role="img" aria-label="自我强化科研反馈回路的移动版">
      <defs><marker id="hero-arrow-mobile" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
      <path className="hero-main-path" d="M164 67 H188 M260 104 V142 M188 179 H164" markerEnd="url(#hero-arrow-mobile)" />
      <path className="hero-feedback-path" d="M90 218 C90 307 270 307 270 104" markerEnd="url(#hero-arrow-mobile)" />
      {[
        ['研究想法', 'Research Idea', 18, 34], ['研究发现', 'Discovery', 188, 34], ['实验执行', 'Experimentation', 188, 146], ['论文写作', 'Writing', 18, 146],
      ].map(([zh, en, x, y], index) => <g className={`hero-flow-node node-${index + 1}`} transform={`translate(${x} ${y})`} key={String(en)}><rect width="146" height="66" rx="10" /><text className="zh" x="73" y="27">{zh}</text><text className="en" x="73" y="47">{en}</text></g>)}
      <g className="hero-evolution-node" transform="translate(24 313)"><rect width="312" height="48" rx="10" /><text x="156" y="20">Lesson / Feedback → Evolution</text><text className="minor" x="156" y="37">历史经验注入下一轮研究</text></g>
      <g className="hero-floating-tag failure" transform="translate(132 6)"><rect width="92" height="24" rx="12" /><text x="46" y="17">failure</text></g>
      <g className="hero-floating-tag evidence" transform="translate(219 250)"><rect width="98" height="24" rx="12" /><text x="49" y="17">evidence</text></g>
      <g className="hero-floating-tag lesson" transform="translate(40 250)"><rect width="83" height="24" rx="12" /><text x="42" y="17">lesson</text></g>
    </svg>
  </Reveal>;
}

export function SystemOverview() {
  const [active, setActive] = useState<VisualStage>('discovery');
  const detail = stageData[active];
  return <Reveal className="system-overview" aria-label="AutoResearchClaw 系统总览图">
    <div className="method-flow" role="group" aria-label="Discovery 到 Experimentation 再到 Writing 的系统流程">
      {(Object.keys(stageData) as VisualStage[]).map((id, index) => {
        const stage = stageData[id];
        return <div className="method-flow-item" key={id}>
          <button className={`method-stage ${id} ${active === id ? 'active' : ''}`} onMouseEnter={() => setActive(id)} onFocus={() => setActive(id)} onClick={() => setActive(id)} aria-pressed={active === id}>
            <header><span>0{index + 1}</span><div><strong>{stage.chinese}</strong><small>{stage.english}</small></div></header>
            <div className="stage-io"><small>输入</small><b>{stage.input}</b></div>
            <ol>{stage.steps.map((step, stepIndex) => <li className={`step step-${stepIndex + 1}`} key={step}>{step}{(stepIndex === 1 || (id === 'writing' && stepIndex === 2)) && <mark>{stage.gate}</mark>}</li>)}</ol>
            <div className="stage-io output"><small>产物</small><b>{stage.output}</b></div>
          </button>
          {index < 2 ? <i className="method-connector" aria-hidden="true"><span>→</span></i> : null}
        </div>;
      })}
    </div>
    <div className="method-inspector" aria-live="polite"><div><span>当前阶段</span><b>{detail.chinese} <small>/ {detail.english}</small></b></div><div><span>系统正在做什么</span><p>{detail.summary}</p></div><div><span>科研原则</span><p>{detail.principle}</p></div><div><span>阶段产物</span><strong>{detail.output}</strong></div></div>
    <div className="overview-evolution"><b>Cross-Run Evolution</b><span>lesson</span><i>→</i><span>persistent store</span><i>→</i><span>prompt injection</span><em>贯穿三阶段 · T½ = 30 days</em></div>
  </Reveal>;
}

const debateData: Record<DebateMode, { label: string; agents: Array<[string, string, string]>; output: string }> = {
  hypothesis: { label: 'Hypothesis Debate', agents: [['创新者', 'Innovator', '提出值得检验的反常规方向'], ['务实者', 'Pragmatist', '检查预算、基线与可行性'], ['质疑者', 'Contrarian', '寻找反例与混杂因素']], output: '2–4 个可证伪假设' },
  result: { label: 'Result Analysis', agents: [['乐观分析者', 'Optimist', '提取最强且被记录支持的发现'], ['怀疑者', 'Skeptic', '质疑弱证据与外推'], ['方法审查者', 'Methodologist', '审查复现性、泄漏与有效性']], output: '结构化结论：支持 / 不支持 / 局限' },
};

export function DebateVisual({ initialMode = 'hypothesis' }: { initialMode?: DebateMode }) {
  const [mode, setMode] = useState<DebateMode>(initialMode);
  const [selected, setSelected] = useState(0);
  const detail = debateData[mode];
  return <Reveal className="debate-visual" aria-label="多智能体辩论示意图">
    <div className="visual-tabs" role="tablist"><button role="tab" aria-selected={mode === 'hypothesis'} onClick={() => { setMode('hypothesis'); setSelected(0); }}>假设辩论 <small>Hypothesis</small></button><button role="tab" aria-selected={mode === 'result'} onClick={() => { setMode('result'); setSelected(0); }}>结果辩论 <small>Result Analysis</small></button></div>
    <div className="debate-board"><svg viewBox="0 0 720 270" aria-hidden="true"><path d="M130 200 L360 128 M360 128 L590 200 M360 128 L360 236" /></svg><div className="agent-cluster">{detail.agents.map(([zh, en, view], index) => <button className={`agent-node agent-${index + 1} ${selected === index ? 'selected' : ''}`} key={en} onClick={() => setSelected(index)}><b>{zh}</b><small>{en}</small>{selected === index && <em>{view}</em>}</button>)}</div><div className="synthesizer-node"><span>Synthesizer</span><b>综合器</b></div><div className="debate-output"><span>输出</span><b>{detail.output}</b></div></div>
  </Reveal>;
}

export function HealingVisual({ failed, healing, onSelect }: { failed: boolean; healing: HealingBranch; onSelect: (branch: Exclude<HealingBranch, null>) => void }) {
  const hasFailure = failed || healing !== null;
  return <Reveal className={`healing-visual ${hasFailure ? 'has-failure' : ''} ${healing ? `branch-${healing}` : ''}`} aria-label="自愈与 Pivot Refine 决策流程">
    <div className="healing-journey">
      <div className="healing-run"><span>01 · Run</span><b>运行实验</b><small>执行代码与记录日志</small></div><i className="healing-arrow">→</i>
      <div className="healing-failure"><span>{hasFailure ? 'Runtime Error / Weak Result' : '实验结果返回'}</span><b>{hasFailure ? '失败 / 弱证据' : '实验输出'}</b><small>{hasFailure ? '失败不是终点，而是诊断输入' : '运行后检查证据强度'}</small></div><i className="healing-arrow">→</i>
      <div className="healing-diagnose"><span>02 · Diagnose</span><b>失败诊断</b><small>错误签名 · 实验语义 · 证据强度</small></div>
    </div>
    <div className="healing-decision-heading"><span>03 · Decide</span><b>诊断后该回到哪里？</b><small>点选一条路径，观察它对科研流程的影响。</small></div>
    <div className="healing-branches"><button className={healing === 'repair' ? 'selected repair' : ''} onClick={() => onSelect('repair')}><span>Repair</span><b>修复执行</b><small>依赖 / 代码 / 资源 → 重试同一实验</small><em>↺ 回到运行</em></button><button className={healing === 'refine' ? 'selected refine' : ''} onClick={() => onSelect('refine')}><span>Refine</span><b>调整当前实验</b><small>补充 seeds / baseline / 对照后重跑</small><em>↻ 调整方案后重跑</em></button><button className={healing === 'pivot' ? 'selected pivot' : ''} onClick={() => onSelect('pivot')}><span>Pivot</span><b>转向新假设</b><small>证据反驳当前方向，停止堆叠实验</small><em>↶ 回到假设辩论</em></button></div>
    <p>{healing === 'repair' ? 'Repair：仅恢复代码或执行环境，研究问题与当前实验方案不变。' : healing === 'refine' ? 'Refine：当前方向仍有价值，补充对照或重复次数后，重新运行这一个实验。' : healing === 'pivot' ? 'Pivot：证据已经反驳当前方向，应带着失败信息回到上游重做假设。' : '自愈不是盲目重试：先识别失败属于执行、当前实验方案还是研究方向。'}</p>
  </Reveal>;
}

export function VerificationVisual() {
  const [claim, setClaim] = useState<VerificationState>('idle');
  const [citation, setCitation] = useState<'idle' | 'verified' | 'suspicious'>('idle');
  const citationSources = [
    ['文献元数据', 'CrossRef'], ['开放学术库', 'OpenAlex'], ['预印本记录', 'arXiv'], ['学术检索库', 'Semantic Scholar'],
  ] as const;
  return <Reveal className="verification-visual" aria-label="数字与引用验证流程">
    <section className="numeric-verification"><span>Numeric Registry · 教学示例</span><h4>数字验证</h4><div className={`claim-slip ${claim}`}>Generated claim<br /><b>{claim === 'rejected' ? '未登记的数值主张' : '已登记的测量值'}</b></div><i>↓</i><div className="registry-lock">Verified Registry<br /><b>已登记 ✓</b></div><div className="verification-actions"><button onClick={() => setClaim('verified')}>提交已登记数值</button><button onClick={() => setClaim('rejected')}>尝试未登记数值</button></div><p aria-live="polite">{claim === 'verified' ? '✓ 记录存在，主张可进入论文。' : claim === 'rejected' ? '✕ 未找到：拒绝写入严格章节。' : '每个论文数值都必须匹配运行记录。'}</p></section>
    <section className={`citation-verification citation-${citation}`}><span>引用核验流程</span><h4>引用是否可追溯？</h4><div className={`citation-card ${citation}`}><small>待核验文献</small><b>候选论文</b><em>题名 · 作者 · 年份 · 标识符</em></div><i className="citation-arrow">↓</i><div className="citation-layers" aria-label="四层引用核验流程">{citationSources.map(([label, source], index) => <i key={source} style={{ '--layer': index } as CSSProperties}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span><em>{source} · {citation === 'idle' ? '待检查' : citation === 'verified' ? '匹配' : index < 2 ? '匹配' : '待人工复核'}</em></i>)}</div><i className="citation-arrow">↓</i><div className={`citation-outcome ${citation}`}><span>{citation === 'verified' ? '✓ 已核验' : citation === 'suspicious' ? '△ 存疑' : '○ 待核验'}</span><b>{citation === 'verified' ? '元数据与来源可追溯' : citation === 'suspicious' ? '疑似不一致，不能直接引用' : '尚未进入论文'}</b></div><button onClick={() => setCitation(citation === 'verified' ? 'suspicious' : 'verified')}>{citation === 'verified' ? '模拟元数据不一致' : '运行四层核验'}</button><p>{citation === 'verified' ? '四层来源均能回溯该引用。' : citation === 'suspicious' ? '无法自动通过：转交人类审阅，不写入参考文献。' : '不是“搜到论文”就通过；系统必须对齐标识符与元数据。'}</p></section>
  </Reveal>;
}

export function EvolutionVisual() {
  const [active, setActive] = useState('repair');
  const lessons = {
    repair: ['修复经验', '运行失败', '依赖缺失或资源异常时，先检查环境与日志，再重试。', '避免无效重跑', '高'],
    debate: ['辩论经验', '假设讨论', '先检查消融是否可区分，再决定是否投入实验预算。', '减少无意义实验', '中'],
    verify: ['验证经验', '结果报告', '严格章节只能使用 Verified Registry 中存在的数值。', '阻止无记录主张', '高'],
    human: ['人类反馈', '高价值决策', '实验语义不确定时触发 SmartPause，请研究者选择 Refine 或 Pivot。', '在关键点介入', '中'],
  } as const;
  const detail = lessons[active as keyof typeof lessons];
  return <Reveal className="evolution-visual" aria-label="跨运行经验演化流程">
    <div className="evolution-story" aria-label="经验从一次运行迁移到下一次运行的流程">
      <article className="evolution-run-one"><span>01 · 本轮运行</span><b>{detail[1]}</b><p>系统记录失败、辩论、验证或人类介入的上下文。</p></article><i>→</i>
      <article className="evolution-lesson"><span>02 · 提炼规则</span><b>{detail[0]}</b><p>{detail[2]}</p></article><i>→</i>
      <article className="evolution-memory"><span>03 · 经验库</span><b>长期存储与检索</b><dl><div><dt>触发条件</dt><dd>{detail[1]}</dd></div><div><dt>建议动作</dt><dd>{detail[3]}</dd></div></dl></article><i>→</i>
      <article className="evolution-next"><span>04 · 下一轮运行</span><b>把经验注入提示词</b><p>新研究开始时检索相关 lesson，避免重复历史问题。</p></article>
    </div>
    <div className="lesson-tags" aria-label="选择一条经验查看它如何迁移">{Object.entries(lessons).map(([id, [label, source, , effect]]) => <button className={active === id ? 'active' : ''} onMouseEnter={() => setActive(id)} onFocus={() => setActive(id)} onClick={() => setActive(id)} key={id}><b>{label}</b><small>{source} · {effect}优先级</small></button>)}</div>
    <aside><div><span>这是什么</span><b>记忆适应：经验以检索结果的形式进入下一轮 Prompt。</b></div><div><span>这不是什么</span><b>不是 LLM 重新训练，也不改变模型参数。</b></div><code>经验权重：w(l) = s(l) · exp(−ln 2 · Δt / T½)，半衰期 T½ = 30 天</code></aside>
  </Reveal>;
}
