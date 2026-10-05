import React, { useState } from 'react';
import type { QuizDef } from '../types';

function stars(n: number) {
  return n === 1 ? '★☆☆' : n === 2 ? '★★☆' : '★★★';
}

// 多题型测验：单选/多选/判断/排序/匹配/填空。提交后显示判据 + 逐项 + 论文锚点。
export function Quiz({ quiz }: { quiz: QuizDef }) {
  const [selections, setSelections] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [order, setOrder] = useState<string[]>(quiz.order ?? []);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [fillVal, setFillVal] = useState('');

  const correct = (): boolean => {
    if (quiz.type === 'single' || quiz.type === 'judge') {
      const idx = quiz.options?.findIndex((o) => o.correct) ?? -1;
      return selections.has(idx);
    }
    if (quiz.type === 'multi') {
      const correctIdx = new Set(
        (quiz.options ?? []).map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0)
      );
      return selections.size === correctIdx.size && [...correctIdx].every((i) => selections.has(i));
    }
    if (quiz.type === 'order') {
      return (quiz.order ?? []).every((x, i) => order[i] === x);
    }
    if (quiz.type === 'match') {
      return (quiz.matchPairs ?? []).every((p) => pairs[p.left] === p.right);
    }
    if (quiz.type === 'fill') {
      return fillVal.trim() === (quiz.answer ?? quiz.fill ?? '');
    }
    return false;
  };

  const toggle = (i: number) => {
    if (done) return;
    if (quiz.type === 'single' || quiz.type === 'judge') {
      setSelections(new Set([i]));
    } else {
      const s = new Set(selections);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      setSelections(s);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    if (done) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const a = [...order];
    [a[i], a[j]] = [a[j], a[i]];
    setOrder(a);
  };

  const pickLeft = (l: string) => {
    if (done) return;
    if (selLeft === l) { setSelLeft(null); return; }
    setSelLeft(l);
  };
  const pickRight = (r: string) => {
    if (done || !selLeft) return;
    const p = { ...pairs, [selLeft]: r };
    setPairs(p);
    setSelLeft(null);
  };

  const isCorrect = done && correct();

  return (
    <div className={`quiz ${isCorrect ? 'is-correct' : done ? 'is-wrong' : ''}`}>
      <div className="quiz-head">
        <span className="quiz-diff">{stars(quiz.difficulty)}</span>
        <span className="quiz-type">
          {quiz.type === 'single' ? '单选' : quiz.type === 'multi' ? '多选' : quiz.type === 'judge' ? '判断' : quiz.type === 'order' ? '排序' : quiz.type === 'match' ? '匹配' : '填空'}
        </span>
      </div>
      <p className="quiz-q">{quiz.q}</p>

      {/* 单选 / 多选 / 判断 */}
      {(quiz.type === 'single' || quiz.type === 'multi' || quiz.type === 'judge') && (
        <div className="quiz-options">
          {quiz.options?.map((o, i) => {
            let cls = '';
            if (done) {
              if (o.correct) cls = 'right';
              else if (selections.has(i)) cls = 'wrong';
            }
            return (
              <button key={i} className={`quiz-opt ${cls} ${selections.has(i) ? 'sel' : ''}`} onClick={() => toggle(i)}>
                <span className="quiz-opt-idx">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-opt-label">{o.label}</span>
                {done && o.correct ? <span className="quiz-opt-mark">✓</span> : null}
                {done && !o.correct && selections.has(i) && o.why ? (
                  <span className="quiz-opt-why">（{o.why}）</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* 排序 */}
      {quiz.type === 'order' && (
        <div className="quiz-order">
          {order.map((x, i) => (
            <div key={x} className="quiz-order-row">
              <span className="quiz-order-idx">{i + 1}</span>
              <span className="quiz-order-label">{x}</span>
              <span className="quiz-order-ctl">
                <button disabled={done || i === 0} onClick={() => move(i, -1)}>↑</button>
                <button disabled={done || i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 匹配 */}
      {quiz.type === 'match' && (
        <div className="quiz-match">
          <div className="quiz-match-col">
            {quiz.matchPairs?.map((p) => (
              <button key={p.left} className={`quiz-match-left ${selLeft === p.left ? 'sel' : ''}`} onClick={() => pickLeft(p.left)}>
                {p.left}
              </button>
            ))}
          </div>
          <div className="quiz-match-arrow">→</div>
          <div className="quiz-match-col">
            {quiz.matchPairs?.map((p) => {
              const matchedBy = Object.entries(pairs).find(([, v]) => v === p.right)?.[0];
              return (
                <button key={p.right} className={`quiz-match-right ${matchedBy ? 'matched' : ''}`} onClick={() => pickRight(p.right)}>
                  {matchedBy ? `${matchedBy} ⇄ ${p.right}` : p.right}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 填空 */}
      {quiz.type === 'fill' && (
        <input
          className="quiz-fill"
          value={fillVal}
          disabled={done}
          onChange={(e) => setFillVal(e.target.value)}
          placeholder="在此输入答案"
        />
      )}

      <div className="quiz-ctl">
        <button className="quiz-submit" disabled={done} onClick={() => setDone(true)}>
          提交
        </button>
        {done && (
          <span className={`quiz-result ${isCorrect ? 'good' : 'bad'}`}>
            {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
          </span>
        )}
      </div>

      {done && (
        <div className="quiz-explain">
          <p className="quiz-explain-text">{quiz.explanation}</p>
          {quiz.anchor ? <span className="quiz-anchor">论文锚点：{quiz.anchor}</span> : null}
        </div>
      )}
    </div>
  );
}
