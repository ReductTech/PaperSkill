import React from 'react';
import type { WidgetProps } from './registry';

const CATEGORY_RESULTS = [
  { label: 'QA', leader: 'LCO-7B 领先', status: 'win' },
  { label: 'Clustering', leader: 'LCO-7B 领先', status: 'win' },
  { label: 'Classification', leader: 'BidirLM 更强', status: 'other' },
  { label: 'Retrieval', leader: 'eBind 更强', status: 'other' },
  { label: 'Zero-shot', leader: 'eBind 更强', status: 'other' },
  { label: 'Pair', leader: 'LCO-3B 更强', status: 'other' },
] as const;

const LCO_PROFILE = [
  { label: 'Retrieval', value: 58.7, metric: 'nDCG@10' },
  { label: 'QA', value: 57.0, metric: 'Accuracy' },
  { label: 'Classification', value: 59.2, metric: 'Accuracy' },
  { label: 'Clustering', value: 27.3, metric: 'V-measure' },
  { label: 'Pair', value: 79.6, metric: 'max-AP' },
  { label: 'Zero-shot', value: 55.5, metric: 'Accuracy' },
] as const;

function OverallRanking() {
  return (
    <section className="mveb-result-block" aria-labelledby="overall-ranking-title">
      <p className="result-block-label" id="overall-ranking-title">BORDA RANKING</p>

      <div className="result-borda-summary">
        <p>23 个任务分别给模型排名，再汇总这些相对名次。</p>
        <strong>经常在不同任务里排在前面的模型，总榜就会更靠前。</strong>
        <span>总榜第一 ≠ 每一项都第一</span>
      </div>

      <div className="borda-example">
        <div className="borda-model">
          <div>
            <span>MVEB OVERALL</span>
            <strong>LCO-Embedding-Omni-7B</strong>
          </div>
          <div className="borda-rank-mark">
            <span>MVEB RANK</span>
            <strong>#1</strong>
          </div>
        </div>

        <div className="category-result-list" aria-label="LCO-Embedding-Omni-7B 与各任务族领先模型的比较">
          {CATEGORY_RESULTS.map((item) => (
            <div className="category-result-row" key={item.label}>
              <strong>{item.label}</strong>
              <span className={item.status}>{item.status === 'win' ? '✓' : '→'}</span>
              <p>{item.leader}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="result-verdict">它赢的不是“所有项目”，而是整体更稳定。</p>
    </section>
  );
}

function AbilityProfile() {
  return (
    <section className="mveb-result-block" aria-labelledby="ability-profile-title">
      <p className="result-block-label" id="ability-profile-title">SIX ABILITIES</p>

      <div className="ability-profile-head">
        <div>
          <span>MODEL PROFILE</span>
          <strong>LCO-Embedding-Omni-7B</strong>
        </div>
        <p>两个总榜接近的模型，能力结构可能完全不同。</p>
      </div>

      <div className="ability-profile-chart" aria-label="LCO-Embedding-Omni-7B 的六类任务分项结果">
        {LCO_PROFILE.map((item) => (
          <div className="ability-profile-row" key={item.label}>
            <strong>{item.label}</strong>
            <div className="ability-profile-track" aria-hidden="true">
              <i style={{ width: `${item.value}%` }} />
            </div>
            <span><b>{item.value.toFixed(1)}</b> {item.metric}</span>
          </div>
        ))}
      </div>

      <p className="ability-profile-note">每行保留该任务族自己的指标；条形不是跨指标的统一量尺。</p>

      <div className="result-question-pair">
        <div>
          <span>OVERALL RANK</span>
          <strong>谁整体更稳？</strong>
        </div>
        <div>
          <span>CATEGORY SCORES</span>
          <strong>谁在哪些能力上更强？</strong>
        </div>
      </div>
    </section>
  );
}

export const TakeawayStage: React.FC<WidgetProps> = ({ moduleId }) => {
  if (moduleId === '6.2') return <AbilityProfile />;
  if (moduleId === 'ana') {
    return (
      <div className="score-mini" role="img" aria-label="总榜说明谁整体更稳定，六类分项说明模型各自强在哪。">
        <span>Overall Rank</span><i>＋</i><span>Category Scores</span>
      </div>
    );
  }
  return <OverallRanking />;
};

export default TakeawayStage;
