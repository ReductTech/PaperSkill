import React from 'react';
import type { PrerequisiteSet } from '../types';

export function PrerequisiteMap({ items }: { items: PrerequisiteSet }) {
  return (
    <details className="prerequisite-map">
      <summary>
        <span className="prerequisite-map-title">读前知识地图</span>
        <span className="prerequisite-map-count">{items.length} 个关键概念</span>
      </summary>
      <p className="prerequisite-map-intro">
        不必先学完整门课程。展开下面的最小知识补丁，就能带着必要背景进入论文。
      </p>
      <div className="prerequisite-grid">
        {items.map((item, index) => (
          <article className="prerequisite-card" id={`prerequisite-${item.id}`} key={item.id}>
            <div className="prerequisite-card-heading">
              <span aria-hidden="true">{index + 1}</span>
              <h3>{item.title}</h3>
            </div>
            <dl>
              <div>
                <dt>直觉</dt>
                <dd>{item.intuition}</dd>
              </div>
              <div>
                <dt>最少定义</dt>
                <dd>{item.minimalDefinition}</dd>
              </div>
              <div>
                <dt>为什么需要</dt>
                <dd>{item.whyNeeded}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </details>
  );
}
