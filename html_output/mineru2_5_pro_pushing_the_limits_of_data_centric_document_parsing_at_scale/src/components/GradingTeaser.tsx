import { useState } from 'react';

const GT_BLOCKS = ['发票', '总额', '= ¥320'] as const;

/**
 * Chapter-06 intro teaser: the same prediction content is judged twice while
 * the learner only changes the prediction-side granularity. Strict one-to-one
 * matching collapses when three blocks merge into one; MGAM recovers by
 * re-splitting the prediction side. Self-built teaching illustration with
 * local state only — not a scored module.
 */
export function GradingTeaser() {
  const [merged, setMerged] = useState(false);
  const strictScore = merged ? 33 : 100;

  return (
    <div className="grading-teaser" data-merged={merged}>
      <header>
        <b>导入小实验：同一个答案，两种判分</b>
        <div className="granularity-switch" role="group" aria-label="切换预测分块粒度">
          <button type="button" aria-pressed={!merged} onClick={() => setMerged(false)}>
            逐块 · 3 块
          </button>
          <button type="button" aria-pressed={merged} onClick={() => setMerged(true)}>
            合并 · 1 块
          </button>
        </div>
      </header>

      <div className="grading-teaser__desk">
        <div className="grading-teaser__side">
          <span>标准答案 GT · 固定不动</span>
          <div className="gt-blocks">
            {GT_BLOCKS.map((block) => (
              <span key={block} className="gt-block">{block}</span>
            ))}
          </div>
        </div>
        <div className="grading-teaser__side">
          <span>模型预测 · 内容一字未改</span>
          <div className="pred-blocks">
            {merged ? (
              <span className="pred-block pred-block--merged">发票 总额 = ¥320</span>
            ) : (
              GT_BLOCKS.map((block) => (
                <span key={block} className="pred-block">{block}</span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="judge-row">
        <span>严格一对一</span>
        <div className="judge-meter">
          <i data-judge="strict" style={{ inlineSize: `${strictScore}%` }} />
        </div>
        <b>{strictScore} 分</b>
      </div>
      <div className="judge-row">
        <span>MGAM</span>
        <div className="judge-meter">
          <i data-judge="mgam" style={{ inlineSize: '100%' }} />
        </div>
        <b>100 分</b>
      </div>

      <p className="grading-teaser__verdict" role="status">
        {merged
          ? '内容一字未差，只因为你这边把 3 块合成 1 块，严格匹配就只剩 33 分；MGAM 允许在预测侧重新拆分对齐，分数回到 100。本章就解决这类评分冤案。'
          : '预测块与 GT 一一对应时，两种判分都给满分。试试把预测合成 1 块，再看两种判分的差别。'}
      </p>
      <span className="source-tag teaching">教学示意 · 块与分数为构造示例</span>
    </div>
  );
}

export default GradingTeaser;
