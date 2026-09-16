import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 10.2 — Claim Checker。
// 六七条常见结论，判 Supported / Overclaimed / Wrong，然后看论文依据。
// 这是读这篇系统论文最该带走的技能：把 Architecture / Implementation /
// Validation / Future Work 分成四层看。

type Verdict = 'supported' | 'overclaimed' | 'wrong';

interface ClaimDef {
  text: string;
  correct: Verdict;
  evidence: string;
}

const CLAIMS: ClaimDef[] = [
  {
    text: '「Final 表示系统加入验证与恢复后的最终完成率，不是策略的原始性能。」',
    correct: 'supported',
    evidence: 'First/Final 协议明确：First = 策略首试；Final = 第一次失败后允许 verifier 触发受控恢复的结果——不改权重、不重置任务、不放宽成功标准。',
  },
  {
    text: '「PhyAgentOS 让 π₀ 模型本身变强了——CALVIN 从 38.9% 涨到 45.6%。」',
    correct: 'wrong',
    evidence: '策略权重一个都没改。正确读法：以 π₀ 为 backend 时，加入 PhyAgentOS 的 verifier-triggered recovery 后，系统 5/5 完成率从 38.9% 提升到 45.6%。提升属于 Policy + Verification + Recovery + Runtime 的系统成功率。',
  },
  {
    text: '「Game Tier 跑通了，所以真实机器人的安全性已经解决。」',
    correct: 'wrong',
    evidence: 'Game 层刻意剥离物理噪声，只验证认知闭环（规划/记忆/自演化）。真实安全要靠 Simulation 渐进 + 真机安全验证（预检拒绝、SafetyGuard 拦截、急停延迟）——层级之间不能外推。',
  },
  {
    text: '「Self-Evolution 首先发生在系统层：即使模型权重完全不变，系统也可能越做越好。」',
    correct: 'supported',
    evidence: '论文定义的自进化 = 验证过的经验改变未来 Context、Strategy 与 Skill Selection（六步闭环）。在线 fine-tune 只是未来可能加入的进一步机制，不是当前定义的一部分。',
  },
  {
    text: '「跨 embodiment 部署完全不需要适配——同一套代码换个机器人就能跑。」',
    correct: 'wrong',
    evidence: '可复用的是 Agent 逻辑、Session 协议与 Runtime 治理；TargetAdapter、PolicyAdapter 与 target-specific 安全配置仍然必须存在。「zero-shot」指协议逻辑不必为每台机器人重写，不是零适配。',
  },
  {
    text: '「真实机器人实验已经在 19+ 平台上给出了大规模任务成功率统计。」',
    correct: 'overclaimed',
    evidence: '平台覆盖 ≠ 统计覆盖。论文自己说明：当前真机评价更关注 safety-critical validation（预检拒绝率、拦截有效性、急停延迟），大规模完成率统计仍是空白。',
  },
  {
    text: '「Optimus-67 上 RedStone 组 0.30，超过了所有已报告基线（0.29 / 0.28）。」',
    correct: 'supported',
    evidence: '表格数字一致：PhyAgentOS 0.30±0.16，Optimus-3 0.29，Optimus-2 0.28。但作者把优势归因到 Verifier + Memory + 配方复用——机制级归因还需要更细的消融。',
  },
];

const VERDICTS: { v: Verdict; label: string }[] = [
  { v: 'supported', label: 'Supported' },
  { v: 'overclaimed', label: 'Overclaimed' },
  { v: 'wrong', label: 'Wrong' },
];

export const ClaimChecker: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Verdict>>({});
  const claim = CLAIMS[idx];
  const answered = answers[idx];
  const correctCount = Object.entries(answers).filter(([i, v]) => CLAIMS[Number(i)].correct === v).length;
  const done = Object.keys(answers).length === CLAIMS.length;

  const choose = (v: Verdict) => {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [idx]: v }));
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '逐条判断：论文支持、过度解读、还是错误？判完看论文依据。';
  if (answered) {
    const ok = answered === claim.correct;
    tone = ok ? 'good' : 'bad';
    msg = `${ok ? '✓ 正确。' : '✕ 不对。'}这条属于 ${claim.correct.toUpperCase()}。${claim.evidence}`;
  }
  if (done) {
    msg += ` 全部完成：${correctCount}/${CLAIMS.length}。带着这套判断力去读任何系统论文的实验章节。`;
  }

  return (
    <div className="lab cc-lab">
      <div className="cc-progress" aria-label="进度">
        {CLAIMS.map((_, i) => (
          <button
            type="button"
            key={i}
            className={`cc-dot ${idx === i ? 'is-active' : ''} ${
              answers[i]
                ? answers[i] === CLAIMS[i].correct
                  ? 'is-right'
                  : 'is-wrong'
                : ''
            }`}
            onClick={() => setIdx(i)}
            aria-label={`第 ${i + 1} 条结论`}
          />
        ))}
        <span className="cc-score">
          {correctCount}/{CLAIMS.length}
        </span>
      </div>

      <div className="lab-stage cc-stage" key={idx}>
        <div className="cc-claim">
          <span className="cc-claim-num">#{idx + 1}</span>
          <p>{claim.text}</p>
        </div>
        <div className="cc-verdicts">
          {VERDICTS.map(({ v, label }) => (
            <button
              type="button"
              key={v}
              className={`cc-verdict-btn tone-${v} ${answered === v ? 'is-chosen' : ''} ${
                answered && v === claim.correct ? 'is-correct' : ''
              }`}
              onClick={() => choose(v)}
              disabled={!!answered}
            >
              {label}
              {answered && v === claim.correct ? ' ✓' : ''}
            </button>
          ))}
        </div>
        {answered ? (
          <div className="cc-evidence">
            <b>论文依据</b>
            {claim.evidence}
          </div>
        ) : null}
        {answered && idx < CLAIMS.length - 1 ? (
          <div className="cc-next">
            <button type="button" className="lab-btn lab-btn-ghost" onClick={() => setIdx((i) => i + 1)}>
              下一句 →
            </button>
          </div>
        ) : null}
        {answered && done ? (
          <div className="cc-next">
            <button
              type="button"
              className="lab-btn lab-btn-ghost"
              onClick={() => {
                setAnswers({});
                setIdx(0);
              }}
            >
              重新挑战
            </button>
          </div>
        ) : null}
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ClaimChecker;
