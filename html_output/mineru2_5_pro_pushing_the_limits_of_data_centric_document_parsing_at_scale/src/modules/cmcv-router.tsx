import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const C = {
  text: '#21324a', muted: '#68778f', border: '#d7deea', blue: '#27446e',
  green: '#228d5c', orange: '#d97706', red: '#c43f52', paper: '#ffffff', quiet: '#f5f8f0',
};

const CASES: Array<{
  id: Lowercase<Difficulty>;
  outputs: [string, string, string];
  answer: Difficulty;
  relation: string;
  source: string;
  destination: string;
}> = [
  {
    id: 'easy', outputs: ['A', 'A', 'B'], answer: 'Easy',
    relation: '目标模型与至少一个外部模型相符',
    source: '一致的目标—外部输出', destination: 'AUTO LABEL → Stage 1',
  },
  {
    id: 'medium', outputs: ['B', 'A', 'A'], answer: 'Medium',
    relation: '两个外部模型相符，目标模型不同',
    source: '两个外部模型的共识 A', destination: 'TRAIN CANDIDATE → Stage 1',
  },
  {
    id: 'hard', outputs: ['A', 'B', 'C'], answer: 'Hard',
    relation: '三者两两分歧，没有可直接采用的共识',
    source: '暂无可信标签，不能自动制造 GT', destination: 'VERIFY → 修正 / 专家复核',
  },
];

const NAMES = ['MinerU2.5\n目标模型', 'PaddleOCR-VL\n外部 1', 'Qwen3-VL-30B\n外部 2'];

function parseGuided(value?: string) {
  const key = value?.toLowerCase();
  if (!key) return undefined;
  const index = CASES.findIndex((item) => key.includes(item.id));
  if (index < 0) return undefined;
  return { index, reveal: !key.includes('question') && !key.includes('hidden') };
}

function OutputThumbnail({ output }: { output: string }) {
  return (
    <span className={`cmcv-output-thumb cmcv-output-thumb--${output.toLowerCase()}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

export const CmcvRouter: React.FC<WidgetProps> = ({ guidedState, onInteract, onStateChange }) => {
  const [caseIndex, setCaseIndex] = useState(0);
  const [guess, setGuess] = useState<Difficulty | null>(null);
  const current = CASES[caseIndex];
  const revealed = guess !== null;
  const correct = guess === current.answer;
  const consensusOutput = useMemo(
    () => current.outputs.find((value, index, values) => values.indexOf(value) !== index),
    [current.outputs],
  );

  useEffect(() => {
    const guided = parseGuided(guidedState);
    if (!guided) return;
    setCaseIndex(guided.index);
    setGuess(guided.reveal ? CASES[guided.index].answer : null);
  }, [guidedState]);

  const answer = (value: Difficulty) => {
    setGuess(value);
    onInteract?.();
    onStateChange?.(current.id);
  };

  const nextCase = () => {
    const next = (caseIndex + 1) % CASES.length;
    setCaseIndex(next);
    setGuess(null);
    onInteract?.();
    onStateChange?.(`${CASES[next].id}:question`);
  };

  const tone = useMemo(() => {
    if (!revealed) return C.blue;
    if (!correct) return C.red;
    if (current.answer === 'Easy') return C.green;
    if (current.answer === 'Medium') return C.orange;
    return C.red;
  }, [correct, current.answer, revealed]);

  return (
    <section
      className="cmcv-router motion-cmcv-router"
      data-case={current.id}
      data-revealed={revealed ? 'true' : 'false'}
      data-correct={correct ? 'true' : 'false'}
      aria-label="CMCV 三模型分流判断"
      style={{ display: 'grid', gap: 15, color: C.text }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <strong>看三份输出的关系，判断这条样本该去哪里</strong>
        <span style={{ color: C.muted, fontSize: 12 }}>教学示意 · A/B/C 只表示不同结构输出</span>
      </div>

      <div
        className="cmcv-router__outputs"
        role="img"
        aria-label={`第 ${caseIndex + 1} 组输出：${NAMES.map((name, index) => `${name.split('\n')[0]} ${current.outputs[index]}`).join('，')}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 10 }}
      >
        {current.outputs.map((output, index) => (
          <article
            key={NAMES[index]}
            className={`cmcv-router__output-card ${index === 0 ? 'is-target-model' : 'is-external'} ${consensusOutput === output ? 'is-consensus' : ''}`}
            data-output={output}
            style={{ minHeight: 112, display: 'grid', gridTemplateRows: 'auto 1fr auto', border: `2px solid ${index === 0 ? C.blue : C.border}`, borderRadius: 13, background: index === 0 ? '#eef3f8' : C.paper, padding: 12, textAlign: 'center', '--model-order': index } as React.CSSProperties}
          >
            <span style={{ whiteSpace: 'pre-line', color: C.muted, fontSize: 12, lineHeight: 1.35 }}>{NAMES[index]}</span>
            <OutputThumbnail output={output} />
            <strong style={{ color: C.blue, fontSize: 32, lineHeight: 1 }}>{output}</strong>
          </article>
        ))}
      </div>

      <div className="cmcv-router__route-map" aria-hidden="true">
        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((difficulty, index) => (
          <span
            key={difficulty}
            className={`cmcv-router__route ${revealed && current.answer === difficulty ? 'is-target' : ''}`}
            style={{ '--route-order': index } as React.CSSProperties}
          >
            <i />
            <b>{difficulty}</b>
          </span>
        ))}
      </div>

      <div className="cmcv-router__question" style={{ display: 'grid', gap: 10, border: `1px solid ${C.border}`, borderRadius: 14, background: C.quiet, padding: 14 }}>
        <strong style={{ textAlign: 'center' }}>你判断它是什么难度？</strong>
        <div role="group" aria-label="选择样本难度" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`cmcv-router__choice ${guess === value ? 'is-selected' : ''} ${revealed && value === current.answer ? 'is-answer' : ''}`}
              aria-pressed={guess === value}
              onClick={() => answer(value)}
              style={{
                minHeight: 48,
                border: `2px solid ${guess === value ? tone : C.border}`,
                borderRadius: 10,
                background: guess === value ? (correct ? '#edf8f2' : '#fdecef') : C.paper,
                color: guess === value ? tone : C.text,
                padding: '9px 10px',
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 850,
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className={`cmcv-router__reveal-stage ${revealed ? 'is-revealed' : 'is-waiting'}`}>
        <div className="cmcv-router__reveal" aria-hidden={!revealed} style={{ display: 'grid', gap: 11 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 9 }}>
            <div className="cmcv-router__reveal-card" style={{ borderTop: `4px solid ${tone}`, background: C.paper, padding: '11px 12px', '--reveal-order': 0 } as React.CSSProperties}>
              <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>正确路由</span>
              <strong style={{ display: 'block', color: tone, fontSize: 22, marginTop: 4 }}>{current.answer}</strong>
              <small style={{ color: C.muted, lineHeight: 1.45 }}>{current.relation}</small>
            </div>
            <div className="cmcv-router__reveal-card" style={{ borderTop: `4px solid ${C.blue}`, background: C.paper, padding: '11px 12px', '--reveal-order': 1 } as React.CSSProperties}>
              <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>标签来源</span>
              <strong style={{ display: 'block', marginTop: 5, lineHeight: 1.45 }}>{current.source}</strong>
            </div>
            <div className="cmcv-router__reveal-card" style={{ borderTop: `4px solid ${current.answer === 'Hard' ? C.red : C.green}`, background: C.paper, padding: '11px 12px', '--reveal-order': 2 } as React.CSSProperties}>
              <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>训练去向</span>
              <strong style={{ display: 'block', marginTop: 5, lineHeight: 1.45 }}>{current.destination}</strong>
            </div>
          </div>
          <button type="button" disabled={!revealed} tabIndex={revealed ? 0 : -1} onClick={nextCase} style={{ justifySelf: 'end', minHeight: 44, border: `1px solid ${C.blue}`, borderRadius: 10, background: C.paper, color: C.blue, padding: '9px 15px', cursor: 'pointer', font: 'inherit', fontWeight: 800 }}>
            下一组输出 →
          </button>
        </div>
        <div className="cmcv-router__waiting-copy" aria-hidden={revealed}>
          先作判断；路由、标签来源和训练去向会在选择后一起揭示。
        </div>
      </div>

      <div style={{ color: C.muted, fontSize: 12 }}>
        相符关系由文本 Edit Distance、公式 CDM 或表格 TEDS 等任务指标判断；论文未公开数值阈值。
      </div>
      <div className="cmcv-router__feedback" role="status" aria-live="polite" style={{ borderLeft: `4px solid ${tone}`, borderRadius: '0 10px 10px 0', background: revealed ? (correct ? '#edf8f2' : '#fdecef') : '#eef3f8', color: tone, padding: '11px 13px', fontWeight: 700, lineHeight: 1.55 }}>
        {!revealed
          ? '先看相对关系，不是简单的多数投票。'
          : correct
            ? `判断正确：${current.relation}，因此路由为 ${current.answer}。`
            : `这组应该是 ${current.answer}：${current.relation}。`}
      </div>
    </section>
  );
};

export default CmcvRouter;
