import React, { useCallback, useState } from 'react';
import { Feedback, Seg } from './kit';

// “直接演示 / 先猜（挑战）”两种模式的共享部件。
// 挑战模式：模块先隐藏答案相关的数值，读者在画布上点选（或点选项按钮，键盘、触屏都可用）后揭晓；
// 猜错时用数值解释原因；全部答完后统计猜对次数。

export type Mode = 'demo' | 'guess';

export function useChallenge(total: number) {
  const [mode, setModeRaw] = useState<Mode>('demo');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const record = useCallback((qid: string, correct: boolean) => {
    setAnswers((a) => (qid in a ? a : { ...a, [qid]: correct }));
  }, []);
  const reset = useCallback(() => setAnswers({}), []);
  const setMode = useCallback((m: Mode) => {
    setModeRaw(m);
    setAnswers({});
  }, []);
  const correct = Object.values(answers).filter(Boolean).length;
  const done = Object.keys(answers).length;
  return { mode, setMode, record, answers, correct, done, total, reset, guessing: mode === 'guess' };
}
export type ChallengeState = ReturnType<typeof useChallenge>;

export function ModeSwitch({ ch }: { ch: ChallengeState }) {
  return (
    <Seg
      small
      label="演示模式"
      value={ch.mode}
      onChange={ch.setMode}
      options={[
        { value: 'demo', label: '直接演示' },
        { value: 'guess', label: '先猜（挑战）' },
      ]}
    />
  );
}

export function ScoreBar({ ch, onRestart }: { ch: ChallengeState; onRestart?: () => void }) {
  if (!ch.guessing) return null;
  const finished = ch.done >= ch.total;
  return (
    <div className={`score ${finished ? 'is-done' : ''}`}>
      <span className="score-k">挑战</span>
      <span>
        已答 <b>{ch.done}</b> / {ch.total} · 猜对 <b>{ch.correct}</b>
      </span>
      {finished ? <span className="score-final">全部完成：猜对 {ch.correct} / {ch.total}</span> : null}
      {ch.done > 0 ? (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            ch.reset();
            onRestart?.();
          }}
        >
          重新挑战
        </button>
      ) : null}
    </div>
  );
}

/** 一道题：题干 + 选项按钮（键盘、触屏都好点）+ 揭晓后的解释。画布点选由模块自行调用 onPick。 */
export function Guess<T extends string>({
  q,
  options,
  answer,
  picked,
  onPick,
  explain,
  canvasHint = '在画布上点选，或点下面的选项',
}: {
  q: React.ReactNode;
  options: { value: T; label: string }[];
  answer: T;
  picked: T | null;
  onPick: (v: T) => void;
  explain: React.ReactNode;
  canvasHint?: string;
}) {
  const right = picked !== null && picked === answer;
  const pickedLabel = options.find((o) => o.value === picked)?.label;
  const answerLabel = options.find((o) => o.value === answer)?.label;
  return (
    <div className="guess">
      <div className="guess-q">
        <span className="guess-k">先猜</span>
        <span>{q}</span>
      </div>
      {picked === null ? (
        <>
          <p className="guess-hint">{canvasHint}</p>
          <div className="guess-opts" role="group" aria-label="我的答案">
            {options.map((o) => (
              <button type="button" key={o.value} className="guess-opt" onClick={() => onPick(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <Feedback
            tone={right ? 'ok' : 'warn'}
            k={`g-${String(picked)}`}
            lead={
              right ? (
                <>
                  <b>猜对了：</b>
                  {answerLabel}
                </>
              ) : (
                <>
                  <b>不是“{pickedLabel}”，</b>答案是“{answerLabel}”
                </>
              )
            }
          />
          <div className="guess-ex">{explain}</div>
        </>
      )}
    </div>
  );
}
