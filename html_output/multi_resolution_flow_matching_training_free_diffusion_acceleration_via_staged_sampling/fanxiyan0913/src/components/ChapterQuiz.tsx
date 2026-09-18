// 章节自测：每题 3-4 个选项。
// 答错时只给该选项的针对性反馈 + 一个「重新选择」按钮，不揭晓正确答案；
// 答对后才标绿正确项并展开解析。这样学的人先自己重试一次，比直接看答案有效。

import React, { useState } from 'react';
import type { ChapterQuizSet } from '../types';

interface QState {
  chosen?: string;
  /** 答对后锁定该题，避免继续乱点 */
  locked: boolean;
  attempts: number;
}

export function ChapterQuiz({ quiz }: { quiz: ChapterQuizSet }) {
  const [state, setState] = useState<Record<string, QState>>({});

  // quiz 至少 1 题（类型上就是 1–2 元组），只需防空。
  if (!quiz) return null;

  const pick = (qid: string, optionId: string, correctId: string) => {
    setState((prev) => {
      const cur = prev[qid] || { locked: false, attempts: 0 };
      if (cur.locked) return prev;
      const right = optionId === correctId;
      return { ...prev, [qid]: { chosen: optionId, locked: right, attempts: cur.attempts + 1 } };
    });
  };

  const retry = (qid: string) => {
    setState((prev) => {
      const cur = prev[qid] || { locked: false, attempts: 0 };
      return { ...prev, [qid]: { chosen: undefined, locked: false, attempts: cur.attempts } };
    });
  };

  return (
    <div className="quiz-block">
      <div className="quiz-head">
        <span className="quiz-kicker">自测</span>
        <span className="quiz-hint">读完这一章，先答再看解析</span>
      </div>

      {quiz.map((q, qi) => {
        const st: QState = state[q.id] || { locked: false, attempts: 0 };
        const answered = Boolean(st.chosen);
        const correct = st.chosen === q.correctOptionId;
        const chosenOption = q.options.find((o) => o.id === st.chosen);

        return (
          <div key={q.id} className="quiz-item">
            <div className="quiz-prompt">
              <span className="quiz-num">Q{qi + 1}</span>
              {q.prompt}
            </div>

            <div className="quiz-options">
              {q.options.map((opt) => {
                const isChosen = st.chosen === opt.id;
                const isRight = opt.id === q.correctOptionId;
                // 答错未锁定时不泄露答案：只把自己标红，其余保持可点、不变暗。
                // 答对锁定后才标绿正确项、并让其余选项变暗。
                let cls = '';
                if (st.locked) {
                  cls = isRight ? 'right' : isChosen ? 'wrong' : 'dim';
                } else if (isChosen) {
                  cls = 'wrong';
                }
                return (
                  <button
                    key={opt.id}
                    className={`quiz-option ${cls}`}
                    disabled={st.locked}
                    onClick={() => pick(q.id, opt.id, q.correctOptionId)}
                  >
                    <span className="quiz-option-key">{opt.id}</span>
                    <span className="quiz-option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {answered && !st.locked ? (
              <div className="quiz-feedback no">
                <div className="quiz-feedback-line">
                  <strong>再想一想。</strong>
                  {chosenOption ? chosenOption.feedback : ''}
                </div>
                <button className="quiz-retry" onClick={() => retry(q.id)}>
                  重新选择
                </button>
              </div>
            ) : null}

            {st.locked ? (
              <div className="quiz-feedback ok">
                <div className="quiz-feedback-line">
                  <strong>{st.attempts > 1 ? '这次对了。' : '答对了。'}</strong>
                  {chosenOption ? chosenOption.feedback : ''}
                </div>
                <div className="quiz-explain">
                  <span className="quiz-label">解析</span>
                  {q.explanation}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
