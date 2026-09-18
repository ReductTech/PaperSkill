import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 7.1 — Evidence-Based Verifier Lab。
// 用户扮演 SessionVerifier：给定 G / S₀ / S_T / τ / H，选择 verdict。
// 情境 D 是 S₀ 陷阱：只看 S_T 会误判 success。

type Verdict = 'success' | 'failure' | 'replan';

interface ScenarioDef {
  id: string;
  name: string;
  goal: string;
  acceptance: string;
  s0: string[];
  sT: string[];
  tau: string[];
  h: string;
  correct: Verdict;
  explain: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'A',
    name: 'A · 成功抓取放入',
    goal: '把桌上的杯子放进柜子',
    acceptance: 'cup.position == inside(cabinet)，且变化由本次执行造成',
    s0: ['杯子在桌上', '柜门打开', '夹爪为空'],
    sT: ['杯子在柜内', '夹爪为空', '柜门打开'],
    tau: ['靠近 → 闭合 → 提起 → 移动 → 放入 → 松开', 'return_code = 0'],
    h: '同类桌面场景成功 3 次（来自 KNOWLEDGE.md）',
    correct: 'success',
    explain:
      '证据满足接受标准：S₀ → S_T 的变化（table → cabinet）由 τ 中的动作链造成，S_T 与 G 对齐。四个输入全部一致指向 success。',
  },
  {
    id: 'B',
    name: 'B · 抓空',
    goal: '把桌上的杯子放进柜子',
    acceptance: 'cup.position == inside(cabinet)',
    s0: ['杯子在桌上（真实位置）', '感知偏移 3.8 cm 已存在'],
    sT: ['杯子仍在桌上 —— 位置未变', '夹爪在感知位闭空', 'return_code = 0'],
    tau: ['move_to(perceived) → close_gripper()', 'tracking error 0.3cm < 容差 1cm ✓'],
    h: 'LESSONS.md 已有「感知偏移导致闭空」条目',
    correct: 'failure',
    explain:
      '返回码 0 只说明轨迹被忠实执行；杯子没有发生任何状态变化，接受标准不满足 → failure。诊断后系统会编译 child session（先重新对齐感知）再试——但本会话的判定是 failure。',
  },
  {
    id: 'C',
    name: 'C · 环境条件发生变化',
    goal: '把杯子放进柜子',
    acceptance: 'cup.position == inside(cabinet)',
    s0: ['杯子已被抓起（在夹爪中）', '柜门打开'],
    sT: ['杯子仍在夹爪中', '柜门被外力关闭', '放置动作未完成'],
    tau: ['抓取成功 → 移动至柜前 → 放置失败（门已关）'],
    h: '知识库中没有「柜门被关闭」的先例',
    correct: 'replan',
    explain:
      '当前执行不能简单接受（放置失败），但高层目标不应终止：环境前置条件变了。正确响应是编译一个更新了前置条件（先开门）的 child session——原会话保留为不可变记录，因果链清晰。',
  },
  {
    id: 'D',
    name: 'D · S₀ 陷阱',
    goal: '把杯子放进柜子',
    acceptance: 'cup.position == inside(cabinet)，且变化由本次执行造成',
    s0: ['杯子已经在柜内（任务开始前）'],
    sT: ['杯子在柜内（与 S₀ 完全相同）', 'return_code = 0'],
    tau: ['观测 → 无任务相关动作'],
    h: '无相关历史',
    correct: 'failure',
    explain:
      '只看 S_T 会得出 success——这正是 S₀ 存在的意义：S₀ = S_T，没有任何任务相关状态变化，「杯子在柜内」不是本次执行造成的。接受标准里「变化由本次执行造成」就是为这种情境写的。',
  },
];

const VERDICTS: { v: Verdict; label: string }[] = [
  { v: 'success', label: 'success' },
  { v: 'failure', label: 'failure' },
  { v: 'replan', label: 'replan' },
];

export const VerifierLab: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Verdict>>({});
  const sc = SCENARIOS[idx];
  const answered = answers[idx];
  const correctCount = Object.entries(answers).filter(([i, v]) => SCENARIOS[Number(i)].correct === v).length;
  const answeredCount = Object.keys(answers).length;

  const choose = (v: Verdict) => {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [idx]: v }));
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '阅读完整证据包，然后给出你的判定。注意：这个实验里「看起来像成功」不一定是成功。';
  if (answered) {
    const ok = answered === sc.correct;
    tone = ok ? 'good' : 'bad';
    msg = `${ok ? '✓ 判定正确。' : '✕ 判定不妥。'}正确答案：${sc.correct}。${sc.explain}`;
  }

  return (
    <div className="lab vl-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group">
          {SCENARIOS.map((s, i) => (
            <button
              type="button"
              key={s.id}
              className={`lab-chip ${idx === i ? 'is-active' : ''} ${answers[i] ? 'is-answered' : ''}`}
              onClick={() => setIdx(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <span className="vl-score">
          已判定 {answeredCount}/4 · 正确 {correctCount}
        </span>
      </div>

      <div className="vl-grid">
        <div className="vl-col vl-col-goal">
          <div className="vl-card-head tone-info">G · 目标与接受标准</div>
          <p className="vl-goal">{sc.goal}</p>
          <p className="vl-acceptance">{sc.acceptance}</p>
          <div className="vl-formula">V(G, S₀, S_T, τ, H) → ?</div>
        </div>

        <div className="vl-col vl-col-evidence">
          <div className="vl-ev-row">
            <div className="vl-ev-card">
              <div className="vl-ev-head">S₀ · 初始状态</div>
              <ul>
                {sc.s0.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="vl-ev-card">
              <div className="vl-ev-head">S_T · 终止状态</div>
              <ul>
                {sc.sT.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="vl-ev-row">
            <div className="vl-ev-card">
              <div className="vl-ev-head">τ · 执行轨迹</div>
              <ul>
                {sc.tau.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="vl-ev-card">
              <div className="vl-ev-head">H · 历史</div>
              <p>{sc.h}</p>
            </div>
          </div>
        </div>

        <div className="vl-col vl-col-verdict">
          <div className="vl-card-head">你的判定</div>
          <div className="vl-verdict-btns">
            {VERDICTS.map(({ v, label }) => (
              <button
                type="button"
                key={v}
                className={`vl-verdict-btn tone-${v} ${answered === v ? 'is-chosen' : ''} ${
                  answered && v === sc.correct ? 'is-correct' : ''
                }`}
                onClick={() => choose(v)}
                disabled={!!answered}
              >
                {label}
                {answered && v === sc.correct ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {answered ? (
            <div className="vl-next">
              <button
                type="button"
                className="lab-btn lab-btn-ghost"
                onClick={() => setIdx((i) => (i + 1) % SCENARIOS.length)}
              >
                下一个情境 →
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default VerifierLab;
