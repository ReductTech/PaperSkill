import React, { useState } from 'react';
import type { ChapterQuizSet, QuizQuestion } from '../types';

function Question({ question, number }: { question: QuizQuestion; number: number }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isCorrect = selectedId === question.correctOptionId;
  const hasAnswered = selectedId !== null;
  const selectedOption = question.options.find((option) => option.id === selectedId);

  return (
    <fieldset className="quiz-question">
      <legend>
        <span>问题 {number}</span>
        {question.prompt}
      </legend>
      <div className="quiz-options">
        {question.options.map((option) => {
          const isSelected = selectedId === option.id;
          const stateClass = isSelected ? (isCorrect ? ' is-correct' : ' is-wrong') : '';
          return (
            <button
              className={`quiz-option${stateClass}`}
              type="button"
              aria-pressed={isSelected}
              disabled={hasAnswered}
              onClick={() => setSelectedId(option.id)}
              key={option.id}
            >
              <span className="quiz-option-key" aria-hidden="true">{option.id.toUpperCase()}</span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {hasAnswered ? (
        <div className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} role="status" aria-live="polite">
          {isCorrect ? (
            <>
              <strong>答对了。关键在于：</strong>
              <p>{selectedOption?.feedback}</p>
              <p>{question.explanation}</p>
            </>
          ) : (
            <>
              <strong>再想一想：</strong>
              <p>{selectedOption?.feedback}</p>
              <button className="quiz-retry" type="button" onClick={() => setSelectedId(null)}>
                重新选择
              </button>
            </>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

export function ChapterQuiz({ questions }: { questions: ChapterQuizSet }) {
  return (
    <section className="chapter-quiz" aria-labelledby={`quiz-${questions[0]?.id ?? 'chapter'}`}>
      <div className="chapter-quiz-heading">
        <div>
          <span className="chapter-quiz-eyebrow">理解检验</span>
          <h3 id={`quiz-${questions[0]?.id ?? 'chapter'}`}>你能把这一节讲清楚吗？</h3>
        </div>
        <span className="chapter-quiz-note">理解练习 · 可重复作答</span>
      </div>
      {questions.map((question, index) => (
        <Question question={question} number={index + 1} key={question.id} />
      ))}
    </section>
  );
}
