import { useState } from 'react';
import { isPresentationMode } from '../lib/presentation';
import type { WidgetProps } from './registry';
import '../styles/steering-outcome-compare.css';

type Direction = 'negative' | 'positive';

const RESULTS = {
  negative: {
    label: '负向 Steering',
    formula: '十个 Feature 同时削弱',
    baseline: '从原始 D 回答开始',
    expectedLabel: '预期：D → ND',
    expectedValue: 100,
    reverseLabel: '反方向：ND → D',
    reverseValue: 0,
    expectedFrom: 'D',
    expectedTo: 'ND',
    expectedMeaning: '原本隐瞒密钥的回答转为披露密钥',
    reverseFrom: 'ND',
    reverseTo: 'D',
    reverseMeaning: '原本披露密钥的回答转为隐瞒密钥',
    conclusion: '负向削弱让全部原始 D 回答转为 ND，同时没有出现反方向变化。',
    tone: 'green',
  },
  positive: {
    label: '正向 Steering',
    formula: '十个 Feature 同时增强',
    baseline: '从原始 ND 回答开始',
    expectedLabel: '预期：ND → D',
    expectedValue: 21,
    reverseLabel: '反方向：D → ND',
    reverseValue: 50,
    expectedFrom: 'ND',
    expectedTo: 'D',
    expectedMeaning: '原本披露密钥的回答转为隐瞒密钥',
    reverseFrom: 'D',
    reverseTo: 'ND',
    reverseMeaning: '原本隐瞒密钥的回答反而转为披露密钥',
    conclusion: '正向增强让 21% 的原始 ND 变为 D，同时也观察到较多反方向变化。',
    tone: 'orange',
  },
};

function ResultBar({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind: 'expected' | 'reverse';
}) {
  return (
    <div className={'soc-result-row ' + kind}>
      <div className="soc-result-label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="soc-track" aria-label={label + '，' + value + '%'}>
        <i style={{ width: value + '%' }} />
      </div>
    </div>
  );
}

export function SteeringOutcomeCompare(_props: WidgetProps) {
  const [direction, setDirection] = useState<Direction>(
    isPresentationMode() ? 'negative' : 'negative'
  );
  const result = RESULTS[direction];

  return (
    <div className={'soc-root is-' + result.tone}>
      <div className="soc-switch" role="group" aria-label="选择 Steering 方向">
        <span>比较方向</span>
        <button
          type="button"
          className={direction === 'negative' ? 'is-active' : ''}
          aria-pressed={direction === 'negative'}
          onClick={() => setDirection('negative')}
        >
          负向 · 削弱 Feature
        </button>
        <button
          type="button"
          className={direction === 'positive' ? 'is-active' : ''}
          aria-pressed={direction === 'positive'}
          onClick={() => setDirection('positive')}
        >
          正向 · 增强 Feature
        </button>
      </div>

      <div className="soc-workbench">
        <section className="soc-operation">
          <span>Top-10 整组干预</span>
          <strong>{result.label}</strong>
          <div className="soc-formula">{result.formula}</div>
          <small>{result.baseline}</small>
        </section>

        <section className="soc-results">
          <header>
            <div>
              <span>十个 Feature 一起干预 · 论文实测</span>
              <strong>{direction === 'negative' ? '抑制隐瞒行为' : '诱导隐瞒行为'}</strong>
            </div>
            <small>各比例按对应的原始标签子集计算</small>
          </header>
          <ResultBar
            label={result.expectedLabel}
            value={result.expectedValue}
            kind="expected"
          />
          <ResultBar
            label={result.reverseLabel}
            value={result.reverseValue}
            kind="reverse"
          />
        </section>
      </div>

      <div className="soc-route-explanation" aria-live="polite">
        <div className="soc-route-intro">
          <span>回答双路流向</span>
          <strong>{result.label}后，分别检查目标变化与反方向变化</strong>
        </div>
        <section className="soc-route is-expected">
          <span>目标方向</span>
          <div className="soc-route-flow">
            <b>{result.expectedFrom}</b>
            <i aria-hidden="true">→</i>
            <b>{result.expectedTo}</b>
            <strong>{result.expectedValue}%</strong>
          </div>
          <p>{result.expectedMeaning}</p>
        </section>
        <section className="soc-route is-reverse">
          <span>反方向</span>
          <div className="soc-route-flow">
            <b>{result.reverseFrom}</b>
            <i aria-hidden="true">→</i>
            <b>{result.reverseTo}</b>
            <strong>{result.reverseValue}%</strong>
          </div>
          <p>{result.reverseMeaning}</p>
        </section>
      </div>

      <div className="soc-conclusion" aria-live="polite">
        <strong>{direction === 'negative' ? '负向削弱最稳定' : '正向变化更混合'}</strong>
        <span>{result.conclusion}</span>
      </div>
    </div>
  );
}

export default SteeringOutcomeCompare;
