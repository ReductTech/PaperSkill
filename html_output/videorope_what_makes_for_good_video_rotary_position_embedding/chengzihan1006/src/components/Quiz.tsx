import { useMemo, useState } from 'react';
import type { QuizDef } from '../types';

export function Quiz({ quiz, answers, onAnswer }: { quiz: QuizDef; answers: Record<string, number>; onAnswer: (questionId: string, optionIndex: number) => void }) {
  const [open, setOpen] = useState(false);
  const answered = quiz.questions.filter((question) => answers[question.id] !== undefined).length;
  const correct = useMemo(
    () => quiz.questions.filter((question) => answers[question.id] === question.answer).length,
    [answers, quiz.questions]
  );

  return (
    <section className={`chapter-quiz ${open ? 'open' : ''}`}>
      <button className="quiz-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <b>课后小测</b>
          <small>{quiz.title} · {quiz.questions.length} 题 · 选完立即查看解析</small>
        </span>
        <span className="quiz-score">{answered ? `${correct}/${answered}` : '未作答'} {open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div className="quiz-body">
          {quiz.questions.map((question, questionIndex) => {
            const selected = answers[question.id];
            const locked = selected !== undefined;
            return (
              <article className="quiz-question" key={question.id}>
                <h4><span>Q{questionIndex + 1}</span>{question.prompt}</h4>
                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selected === optionIndex;
                    const isCorrect = optionIndex === question.answer;
                    const state = locked && isCorrect ? 'correct' : locked && isSelected ? 'wrong' : '';
                    return (
                      <button
                        key={option}
                        className={`${isSelected ? 'selected' : ''} ${state}`.trim()}
                        onClick={() => onAnswer(question.id, optionIndex)}
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                      </button>
                    );
                  })}
                </div>
                {locked ? (
                  <p className={`quiz-explanation ${selected === question.answer ? 'good' : 'bad'}`}>
                    {selected === question.answer ? '答对了！' : '再想一步：'}{question.explanation}
                  </p>
                ) : null}
              </article>
            );
          })}
          <div className="quiz-summary">
            已完成 {answered}/{quiz.questions.length} 题
            {answered === quiz.questions.length ? `，本章得分 ${correct}/${quiz.questions.length}` : '，完成选择后会显示对应解析。'}
          </div>
        </div>
      ) : null}
    </section>
  );
}
