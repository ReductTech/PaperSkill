import { useState } from 'react';
import type { WidgetProps } from './registry';
import '../styles/candidate-collection-lab.css';

const TOP_FEATURES = [
  { name: 'Obscuring information', count: 95 },
  { name: 'Negation and inability', count: 91 },
  { name: 'Secrets / confidentiality', count: 86 },
  { name: 'Hide / hidden', count: 78 },
  { name: 'Hiding or concealing', count: 63 },
  { name: 'Data privacy', count: 63 },
  { name: 'Masking or delays', count: 60 },
  { name: 'Data privacy / secrets', count: 60 },
  { name: 'Darkness and secrecy', count: 56 },
  { name: 'Negation', count: 55 },
];

export function CandidateCollectionLab(_props: WidgetProps) {
  const [ranked, setRanked] = useState(false);

  return (
    <div className={'ccl-root' + (ranked ? ' is-ranked' : '')}>
      <div className="ccl-process" aria-label="从100条Prompt得到112个候选Feature">
        <section>
          <span>实验输入</span>
          <strong>100</strong>
          <b>条合成 Prompt</b>
        </section>
        <i aria-hidden="true">→</i>
        <section className="is-method">
          <span>每条都执行</span>
          <strong>归因追踪</strong>
          <b>+ Steering 验证</b>
        </section>
        <i aria-hidden="true">→</i>
        <section className="is-candidates">
          <span>合并并去重</span>
          <strong>112</strong>
          <b>个候选 Feature</b>
        </section>
      </div>

      <div className="ccl-filter-bar">
        <div>
          <span>下一步：统计同一个 Feature 在 100 条 Prompt 中出现多少次</span>
          <strong>{ranked ? '跨 Prompt 出现最频繁的十个 Feature 已被选出' : '112 个候选还没有区分出现频率'}</strong>
        </div>
        <button type="button" className={ranked ? 'is-active' : ''} onClick={() => setRanked((value) => !value)}>
          {ranked ? '返回候选字典' : '按出现频率筛出 Top-10'}
        </button>
      </div>

      <div className="ccl-stage" aria-live="polite">
        {!ranked ? (
          <section className="ccl-dictionary-view">
            <div className="ccl-dot-cloud" aria-label="112个候选Feature">
              {Array.from({ length: 112 }, (_, index) => <i key={index} aria-hidden="true" />)}
            </div>
            <div className="ccl-dictionary-copy">
              <span>候选字典</span>
              <strong>112 个</strong>
              <p>这些 Feature 在不同 Prompt 中重复出现的次数并不相同。</p>
            </div>
          </section>
        ) : (
          <section className="ccl-ranking-view">
            <div className="ccl-ranking-heading">
              <div><span>按跨 Prompt 出现次数降序排列</span><strong>Top-10</strong></div>
              <b>出现范围 55%–95%</b>
            </div>
            <div className="ccl-ranking-list">
              {TOP_FEATURES.map((feature, index) => (
                <div className={index < 3 ? 'is-leading' : ''} key={feature.name}>
                  <span>#{index + 1}</span>
                  <strong>{feature.name}</strong>
                  <div aria-hidden="true"><i style={{ width: `${feature.count}%` }} /></div>
                  <b>{feature.count}<small>/100</small></b>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="ccl-conclusion" aria-live="polite">
        <span>{ranked ? '筛选结果' : '当前结果'}</span>
        <div>
          <strong>
            {ranked
              ? 'Top-10 是跨 Prompt 出现次数最高的十个候选，下一页将对它们进行整组干预。'
              : '先得到 112 个不同候选，再统计每个固定 Feature 在多少张归因图中出现。'}
          </strong>
          <p>
            {ranked
              ? '例如 95/100 表示同一个 Obscuring information Feature 出现在 100 张归因图中的 95 张；它表示出现频率，不是激活强度。'
              : '同一个 Feature 可以在多条 Prompt 的归因图中重复出现；跨 Prompt 计数越高，排名越靠前。'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CandidateCollectionLab;
