import React, { useState } from 'react';
import { quizzes } from '../data/quizzes';
import type { WidgetProps } from './registry';

// 自测问答：每章尾部的小测验。逐题作答，点击选项即时判定并给出解析；
// 全部答完显示得分与正确项，可重做。数据在 src/data/quizzes.ts，按 chapterId 取用。
export const Quiz: React.FC<WidgetProps> = ({ chapterId }) => {
  const set = quizzes[chapterId];
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!set || !set.questions.length) {
    return <div className="feedback bad">该章未配置自测题（quizzes.ts 缺少 {chapterId}）。</div>;
  }

  const total = set.questions.length;
  const q = set.questions[qi];
  const answered = picked !== null;

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (qi + 1 >= total) {
      setDone(true);
    } else {
      setQi(qi + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setQi(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  return (
    <div className="quiz">
      {!done ? (
        <>
          <p className="quiz-lead">{set.lead}</p>
          <div className="quiz-qbar">
            <span className="quiz-no">
              第 {qi + 1} / {total} 题
            </span>
            <span className="quiz-score">已答对 {score} 题</span>
          </div>
          <p className="quiz-q">{q.q}</p>
          <div className="quiz-opts">
            {q.options.map((opt, i) => {
              let cls = 'quiz-opt';
              if (answered) {
                if (i === q.answer) cls += ' correct';
                else if (i === picked) cls += ' wrong';
                else cls += ' dim';
              }
              return (
                <button type="button" key={i} className={cls} onClick={() => pick(i)}>
                  <span className="quiz-opt-key">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="quiz-feedback">
              <p className={`quiz-verdict ${picked === q.answer ? 'good' : 'bad'}`}>
                {picked === q.answer ? '回答正确。' : '回答错误。'}
              </p>
              <p className="quiz-why">解析：{q.why}</p>
              <button type="button" className="tiny" onClick={next}>
                {qi + 1 >= total ? '查看成绩' : '下一题'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="quiz-result">
          <p className="quiz-lead">本组自测完成。</p>
          <p className="quiz-score-line">
            答对 <b className={score === total ? 'good' : ''}>{score}</b> / {total} 题
          </p>
          <p className="quiz-result-note">
            {score === total
              ? '全部答对，本章要点已掌握。'
              : '建议回到本章，重看对应模块后再试。'}
          </p>
          <button type="button" className="tiny ghost" onClick={restart}>
            ↺ 重做
          </button>
        </div>
      )}
    </div>
  );
};
