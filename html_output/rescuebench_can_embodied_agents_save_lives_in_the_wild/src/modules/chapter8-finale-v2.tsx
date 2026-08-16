import { useState } from 'react';
import type { WidgetProps } from './registry';

type StageId = 's1' | 's2' | 's3' | 's4';
type BenchmarkView = 'leaderboard' | 'diagnosis';

const stages: Array<{
  id: StageId;
  code: string;
  title: string;
  short: string;
  weight: 'primary' | 'support';
  status: string;
  requirement: string;
  diagnosis: string;
  note: string;
}> = [
  {
    id: 's1', code: 'S1', title: '探索', short: '先找到', weight: 'primary',
    status: '伤员位置未知', requirement: '主动决定搜索方向', diagnosis: '主要瓶颈 · 自主探索',
    note: '随着难度进入主动搜索和更大空间层级，S1 得分快速下降。',
  },
  {
    id: 's2', code: 'S2', title: '定位与救援', short: '靠近并救援', weight: 'support',
    status: '目标已经被发现', requirement: '进一步靠近并完成救援', diagnosis: '辅助阶段 · 救援推进',
    note: 'S2 说明发现目标后能否继续接近并触发救援；它不是本章新增的核心缺口。',
  },
  {
    id: 's3', code: 'S3', title: '返回', short: '还能回来', weight: 'primary',
    status: '伤员已找到', requirement: '调用前期空间信息', diagnosis: '第二独立瓶颈 · 持久空间记忆',
    note: '多个方法在完成 S2 后进入 S3 时再次明显下降。',
  },
  {
    id: 's4', code: 'S4', title: '定位与交接', short: '完成闭环', weight: 'support',
    status: '已经成功返回', requirement: '精确定位救护车或担架并交接', diagnosis: '辅助阶段 · 依赖前序成功',
    note: 'S4 只有在探索、救援和返回都成立后才有机会完成。',
  },
];

function HeroAnswer() {
  return <section className="finale-section finale-answer" aria-labelledby="finale-answer-title">
    <div className="finale-section-label">8.1 · 回到最开始的问题</div>
    <h5 id="finale-answer-title">会导航，就真的会救人吗？</h5>
    <p className="finale-scope-answer">在 RescueBench 当前评测设置下，<b>会执行导航并不足以保证完成连续的搜索救援任务。</b></p>
    <div className="answer-expansion" aria-label="从导航到连续搜索救援">
      <div className="answer-known"><span>已知目标后的导航</span><small>只是完整救援的一部分</small></div>
      <div className="answer-plus">还需要</div>
      <div className="answer-needs">
        <article><i>01</i><strong>主动搜索</strong><span>目标未知时，持续决定哪里值得搜索</span></article>
        <article><i>02</i><strong>记忆返回</strong><span>长序列之后，仍能调用前期空间信息</span></article>
        <article><i>03</i><strong>连续成立</strong><span>让搜索、交互与记忆保持顺序依赖</span></article>
      </div>
    </div>
    <p className="finale-core-line">真正困难的，不只是“走到一个目标”，而是让搜索、交互与记忆在同一个长序列任务里持续成立。</p>
  </section>;
}

function StageDiagnosis() {
  const [active, setActive] = useState<StageId>('s1');
  const current = stages.find((stage) => stage.id === active) ?? stages[0];
  return <section className="finale-section finale-diagnosis" aria-labelledby="finale-diagnosis-title">
    <div className="finale-section-label">8.2 · 两个真正暴露出的能力缺口</div>
    <h5 id="finale-diagnosis-title">四阶段最终诊断图</h5>
    <div className="gap-pair">
      <article className="gap-card exploration">
        <span>主要瓶颈 · Autonomous Exploration</span><strong>自主探索</strong>
        <p>目标未知时，持续决定“哪里值得搜索”，并不会从普通 route-following 能力中自动产生。</p>
      </article>
      <article className="gap-card memory">
        <span>第二独立瓶颈 · Persistent Spatial Memory</span><strong>持久空间记忆</strong>
        <p>空间记忆不是“曾经见过”，而是“之后需要时还能真正用于行动”。</p>
      </article>
    </div>
    <div className="stage-diagnosis-final">
      <div className="final-stage-tabs" role="group" aria-label="查看四阶段最终诊断">
        {stages.map((stage, index) => <div className="final-stage-step" key={stage.id}>
          {index > 0 ? <span className="final-stage-arrow" aria-hidden="true">→</span> : null}
          <button type="button" className={`${stage.weight} ${active === stage.id ? 'selected' : ''}`} onClick={() => setActive(stage.id)} aria-pressed={active === stage.id}>
            <span>{stage.code}</span><strong>{stage.title}</strong><small>{stage.short}</small>
            {stage.weight === 'primary' ? <em>{stage.id === 's1' ? '主要瓶颈' : '第二独立瓶颈'}</em> : null}
          </button>
        </div>)}
      </div>
      <div className={`final-stage-detail ${current.weight}`} aria-live="polite">
        <header><span>{current.code}</span><strong>{current.title}</strong><b>{current.diagnosis}</b></header>
        <div>
          <article><span>任务状态</span><strong>{current.status}</strong></article>
          <article><span>阶段要求</span><strong>{current.requirement}</strong></article>
        </div>
        <p>{current.note}</p>
      </div>
      <div className="stage-focus-pair" aria-label="两个核心能力缺口">
        <div><span>S1</span><strong>自主探索</strong><small>“先找到”</small></div>
        <b>+</b>
        <div><span>S3</span><strong>持久空间记忆</strong><small>“还能回来”</small></div>
      </div>
    </div>
    <p className="result-source">来源：论文 Figure 6、Section 3.4</p>
  </section>;
}

function DiagnosticBenchmark() {
  const [view, setView] = useState<BenchmarkView>('leaderboard');
  return <section className="finale-section finale-benchmark" aria-labelledby="finale-benchmark-title">
    <div className="finale-section-label">8.3 · 不只是一个“难排行榜”</div>
    <h5 id="finale-benchmark-title">排行榜只能告诉你谁更高，诊断视角才能追踪失败传播</h5>
    <div className="benchmark-view-switch" role="group" aria-label="切换排行榜与诊断视角">
      <button type="button" className={view === 'leaderboard' ? 'selected' : ''} onClick={() => setView('leaderboard')}>排行榜</button>
      <button type="button" className={view === 'diagnosis' ? 'selected' : ''} onClick={() => setView('diagnosis')}>诊断视角</button>
    </div>
    <div className={`benchmark-final-stage ${view}`} aria-live="polite">
      {view === 'leaderboard' ? <div className="anonymous-leaderboard">
        <header><span>匿名概念示意</span><strong>总分</strong></header>
        {[['方法 A', 52], ['方法 B', 44], ['方法 C', 31]].map(([label, score], index) => <div key={String(label)}>
          <b>{index + 1}</b><span>{label}</span><i><em style={{ width: `${score}%` }} /></i><strong>{score}</strong>
        </div>)}
        <p>这里只能回答：<b>谁更高？</b></p>
      </div> : <div className="diagnostic-lens">
        <div className="diagnostic-axes">
          <article><span>什么时候</span><strong>难度</strong><p>L1 → L2 → L3 → L4 → L5</p></article>
          <article><span>在哪里</span><strong>阶段</strong><p>S1 → S2 → S3 → S4</p></article>
          <article><span>为什么</span><strong>行为</strong><p>搜索 · 循环 · 停滞 · 返回困难</p></article>
        </div>
        <div className="diagnostic-questions"><strong>什么时候开始失败？</strong><strong>失败在哪一步？</strong><strong>为什么失败？</strong></div>
      </div>}
    </div>
    <p className="finale-core-line compact">RescueBench 的价值，不只是把模型排个名次，而是把总任务失败拆成可定位、可解释的能力缺口。</p>
    <p className="result-source">来源：论文 Section 3.5 与 Conclusion</p>
  </section>;
}

function ScopeBoundary() {
  const bounds = [
    ['架构', '论文评测的 baseline families'],
    ['数据', '论文当前训练与 fine-tuning 设置'],
    ['环境', 'RescueBench 仿真 SAR 环境'],
    ['协议', '四阶段 sequential evaluation'],
  ];
  return <section className="finale-section finale-boundary" aria-labelledby="finale-boundary-title">
    <div className="finale-section-label">8.4 · 结论边界</div>
    <h5 id="finale-boundary-title">所有结论都应在这一实验范围内理解</h5>
    <div className="boundary-grid">{bounds.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <p>阶段诊断支持“自主探索是主要瓶颈、空间记忆与返回是第二个独立瓶颈”；当前 fine-tuning 也确实带来提升，只是没有在现有设置下消除最高难度的核心缺口。</p>
    <small>这些结果不等于所有具身智能体都存在相同缺口，也不证明更多数据一定无效，更不代表现实机器人搜救的全部操作能力已经被完整评测。</small>
  </section>;
}

function CapabilityConclusion() {
  return <section className="finale-section finale-capabilities" aria-labelledby="finale-capabilities-title">
    <div className="finale-section-label">8.5 · RescueBench 指向什么能力需求？</div>
    <h5 id="finale-capabilities-title">结果指向的不是一个已经验证的新架构，而是三项仍需强化的能力</h5>
    <div className="capability-motion" aria-label="探索产生信息，经历中间任务，再在返回阶段调用记忆">
      <article className="capability-node explore"><span>01</span><strong>开放环境自主探索</strong><small>探索产生空间信息</small></article>
      <div className="capability-link"><i /><span>信息写入</span></div>
      <article className="capability-node task"><span>02</span><strong>中间任务发生</strong><small>救援改变任务状态</small></article>
      <div className="capability-link recall"><i /><span>跨阶段调用</span></div>
      <article className="capability-node memory"><span>03</span><strong>持久空间记忆</strong><small>返回时重新用于行动</small></article>
    </div>
    <div className="composition-result"><span>自主探索</span><b>+</b><span>持久空间记忆</span><em>↓</em><strong>长序列任务组合能力</strong></div>
    <p className="capability-explain">探索需要成为策略本身的一部分；记忆需要跨阶段保存、检索并用于决策。单项能力都存在，不等于它们能在长序列任务里稳定组合。</p>
    <div className="final-quote">
      <blockquote>真正的救援智能，不只是到达一个目标，而是在未知中找到目标，并记住如何把任务带回终点。</blockquote>
      <p>在 RescueBench 当前评测设置下，自主探索与持久空间记忆仍是最突出的能力缺口。</p>
    </div>
  </section>;
}

export function Chapter8FinaleV2(_: WidgetProps) {
  return <div className="chapter8-finale-v2">
    <HeroAnswer />
    <StageDiagnosis />
    <DiagnosticBenchmark />
    <ScopeBoundary />
    <CapabilityConclusion />
  </div>;
}
