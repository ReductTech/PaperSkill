import { useState } from 'react';
import { isPresentationMode } from '../lib/presentation';
import type { WidgetProps } from './registry';
import '../styles/steering-validation-lab.css';

type Baseline = 'ND' | 'D';
type AnswerLabel = 'ND' | 'D';
type Outcome = AnswerLabel | null;

const CASES = {
  ND: {
    baselineText: '回答披露密钥',
    direction: '正向 Steering',
    formula: '增强 Feature 激活',
    expected: 'D' as const,
    expectedText: 'ND → D',
    action: '增强候选 Feature',
  },
  D: {
    baselineText: '回答隐瞒密钥',
    direction: '负向 Steering',
    formula: '削弱 Feature 激活',
    expected: 'ND' as const,
    expectedText: 'D → ND',
    action: '削弱候选 Feature',
  },
};

const MATRIX_ROWS: Baseline[] = ['D', 'ND'];
const MATRIX_COLUMNS: AnswerLabel[] = ['D', 'ND'];

function matrixDecision(baseline: Baseline, outcome: AnswerLabel) {
  const pass = outcome === CASES[baseline].expected;

  return {
    pass,
    transition: `${baseline} → ${outcome}`,
    explanation: pass
      ? `${CASES[baseline].direction} 后按预期翻转`
      : '干预后标签没有按预期翻转',
  };
}

export function SteeringValidationLab(_props: WidgetProps) {
  const presenting = isPresentationMode();
  const [baseline, setBaseline] = useState<Baseline>(presenting ? 'D' : 'ND');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const test = CASES[baseline];
  const passed = outcome === test.expected;

  const chooseBaseline = (value: Baseline) => {
    setBaseline(value);
    setOutcome(null);
  };

  return (
    <div className="svl-root">
      <div className="svl-protocol-switch" role="group" aria-label="选择原始回答标签">
        <span>1 · 原始回答</span>
        <button
          type="button"
          className={baseline === 'ND' ? 'is-active' : ''}
          aria-pressed={baseline === 'ND'}
          onClick={() => chooseBaseline('ND')}
        >
          ND · 披露密钥
        </button>
        <button
          type="button"
          className={baseline === 'D' ? 'is-active' : ''}
          aria-pressed={baseline === 'D'}
          onClick={() => chooseBaseline('D')}
        >
          D · 隐瞒密钥
        </button>
      </div>

      <div className="svl-flow">
        <section className="svl-panel svl-candidate">
          <span className="svl-step">候选</span>
          <strong>候选 Feature</strong>
          <p>归因路径把语义相关的节点送入下一步行为测试。</p>
          <small>Steering 负责验证</small>
        </section>

        <span className="svl-arrow" aria-hidden="true">→</span>

        <section className="svl-panel svl-steering">
          <span className="svl-step">2 · 按原标签选择方向</span>
          <strong>{test.direction}</strong>
          <div className="svl-formula">{test.formula}</div>
          <p>{test.action}，观察回答标签是否翻转。</p>
          <b>预期：{test.expectedText}</b>
        </section>

        <span className="svl-arrow" aria-hidden="true">→</span>

        <section className="svl-panel svl-output">
          <span className="svl-step">3 · 选择干预后的观察结果</span>
          <div className="svl-before">
            原标签 <strong>{baseline}</strong>
            <small>{test.baselineText}</small>
          </div>
          <div className="svl-outcome-buttons" role="group" aria-label="选择干预后的回答标签">
            <button
              type="button"
              className={outcome === 'D' ? 'is-active' : ''}
              aria-pressed={outcome === 'D'}
              onClick={() => setOutcome('D')}
            >
              结果为 D
            </button>
            <button
              type="button"
              className={outcome === 'ND' ? 'is-active' : ''}
              aria-pressed={outcome === 'ND'}
              onClick={() => setOutcome('ND')}
            >
              结果为 ND
            </button>
          </div>
        </section>

        <span className={'svl-arrow' + (outcome ? ' is-ready' : '')} aria-hidden="true">→</span>

        <section className={'svl-panel svl-decision' + (outcome ? (passed ? ' is-pass' : ' is-reject') : '')}>
          <span className="svl-step">4 · 按论文规则判定本例</span>
          {outcome ? (
            <>
              <strong>{passed ? '本例通过筛选' : '本例不通过'}</strong>
              <p>
                {passed
                  ? 'D / ND 按预期翻转，候选进入 deception Feature 字典。'
                  : '标签没有按该方向翻转，候选不通过这次验证。'}
              </p>
              <small>{baseline} → {outcome}</small>
            </>
          ) : (
            <>
              <strong>等待结果</strong>
              <p>选择干预后的标签，页面会按论文判据立即判断。</p>
            </>
          )}
        </section>
      </div>

      <section className="svl-matrix" aria-labelledby="svl-matrix-title">
        <header>
          <div>
            <span>四种结果一次看清</span>
            <strong id="svl-matrix-title">Steering 决策矩阵</strong>
            <p>原始标签决定 Steering 方向；干预后按预期翻转的组合通过筛选。</p>
          </div>
          <div
            className={'svl-current-case' + (outcome ? (passed ? ' is-pass' : ' is-reject') : '')}
            aria-live="polite"
          >
            <span>当前组合</span>
            <strong>{outcome ? `${baseline} → ${outcome}` : `原始 ${baseline} → 等待结果`}</strong>
            <small>
              {outcome
                ? passed
                  ? '按预期翻转，本例通过'
                  : '没有按预期翻转，本例不通过'
                : `${test.direction} 的目标是 ${test.expectedText}`}
            </small>
          </div>
        </header>

        <div className="svl-matrix-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">原始回答</th>
                {MATRIX_COLUMNS.map((label) => (
                  <th key={label} scope="col">干预后 {label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row} className={baseline === row ? 'is-current-row' : ''}>
                  <th scope="row">
                    <strong>原始 {row}</strong>
                    <span>{CASES[row].direction}</span>
                  </th>
                  {MATRIX_COLUMNS.map((column) => {
                    const decision = matrixDecision(row, column);
                    const current = baseline === row && outcome === column;

                    return (
                      <td
                        key={column}
                        className={`${decision.pass ? 'is-pass' : 'is-reject'}${current ? ' is-current' : ''}`}
                        aria-current={current ? 'true' : undefined}
                      >
                        <strong>{decision.pass ? '通过' : '不通过'}</strong>
                        <span>{decision.transition}</span>
                        <small>{decision.explanation}</small>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="svl-boundary">
        判定流程教学示意：论文公布了筛选规则与汇总结果，没有公布每个候选在每条 Prompt 上的完整单次输出。
      </p>
    </div>
  );
}

export default SteeringValidationLab;
