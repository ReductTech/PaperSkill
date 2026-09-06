import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const evidence=['ablation-lab','results-lab'].includes(module.componentId);
  const simulated=['dual-challenge-lab','director-timeline-lab','retrieval-lab','trimming-lab','limitations-lab'].includes(module.componentId);
  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
      </div>
      <div className="module-body">
        <div className="module-provenance"><span className={`evidence-chip ${evidence?'evidence':'mechanism'}`}>{evidence?'论文证据':'论文机制'}</span>{simulated?<span className="evidence-chip simulation">教学模拟</span>:null}</div>
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        <Figure src={module.figure} alt={module.title} />
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
      </div>
    </div>
  );
}
