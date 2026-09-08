import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge } from './colleague-ui';

type Verdict = 'true' | 'not-yet' | 'not-guaranteed';
const labels: Record<Verdict, string> = { true: '成立', 'not-yet': '尚未证明', 'not-guaranteed': '不保证' };
const questions: Array<{ claim: string; answer: Verdict; explanation: string }> = [
  { claim: '人类痕迹可以被包装成可检查的技能。', answer: 'true', explanation: '论文实现并描述了工件格式、生成与检查工作流。' },
  { claim: '生成的 Skill 已经忠实复现了目标人物。', answer: 'not-yet', explanation: '论文明确没有进行行为忠实度的人体或任务评估。' },
  { claim: '技能支持纠正、版本与回滚。', answer: 'true', explanation: '生命周期机制与归档/回滚路径是论文的工件层主张。' },
  { claim: 'COLLEAGUE.SKILL 提升了下游任务表现。', answer: 'not-yet', explanation: '没有报告匹配来源、基线和任务指标的下游实验。' },
  { claim: '能力轨和受限行为轨可以分开调用。', answer: 'true', explanation: '完整、仅能力与仅行为入口是工件契约的一部分。' },
  { claim: '每次纠正都会让技能变得更好。', answer: 'not-guaranteed', explanation: '纠正也可能引入编辑者偏差、回归或把争议痕迹写得过于确定。' },
];

export const ClaimQuiz: React.FC<WidgetProps> = () => {
  const [answers, setAnswers] = useState<Record<number, Verdict>>({});
  const [index, setIndex] = useState(0);
  const current = questions[index];
  const answer = answers[index];
  const correct = answer === current.answer;
  const solved = useMemo(() => questions.filter((_, i) => answers[i] === questions[i].answer).length, [answers]);
  const choose = (verdict: Verdict) => setAnswers(prev => ({ ...prev, [index]: verdict }));
  return <div className="paper-widget claim-quiz">
    <div className="quiz-progress"><span style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} /><b>{solved} / {questions.length} 判断正确</b></div>
    <div className="quiz-layout">
      <nav className="claim-index" aria-label="声明列表">{questions.map((question, i) => <button key={question.claim} className={`${index === i ? 'active' : ''}${answers[i] === question.answer ? ' correct' : answers[i] ? ' wrong' : ''}`} onClick={() => setIndex(i)}><span>{i + 1}</span><b>{question.claim}</b></button>)}</nav>
      <section className="claim-card">
        <StateBadge tone="current">论文声明边界</StateBadge>
        <h4>{current.claim}</h4>
        <div className="verdict-buttons" role="group" aria-label="选择判断">
          {(Object.keys(labels) as Verdict[]).map(verdict => <button key={verdict} className={`${answer === verdict ? 'active' : ''} verdict-${verdict}`} onClick={() => choose(verdict)}>{labels[verdict]}</button>)}
        </div>
        {answer && <div className={`claim-explanation ${correct ? 'correct' : 'wrong'}`}><b>{correct ? '判断正确' : `正确边界：${labels[current.answer]}`}</b><p>{current.explanation}</p></div>}
      </section>
    </div>
    {solved === questions.length && <div className="future-research"><span>FINAL CHECKPOINT ✓</span><h4>你已经能够区分三种不同强度的结论</h4><div className="variant-row"><b>已实现<br /><small>Artifact &amp; Workflow</small></b><b>待验证<br /><small>Fidelity &amp; Utility</small></b><b>不保证<br /><small>Every correction improves</small></b></div><p>负责任地阅读系统论文：既承认工程贡献，也保留证据边界。</p></div>}
    <div className={`feedback ${answer ? correct ? 'good' : 'bad' : ''}`}>{!answer ? '为当前声明选择一个证据边界。' : correct ? '边界判断正确：不要把工件实现升级成尚未做过的效果证明。' : '这个说法超出了论文证据；请根据解释重新判断。'}</div>
  </div>;
};

export default ClaimQuiz;
