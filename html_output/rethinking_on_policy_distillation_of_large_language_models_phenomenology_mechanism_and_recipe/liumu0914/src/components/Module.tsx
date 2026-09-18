import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
      </div>
      <div className="module-body">
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        <Figure src={module.figure} alt={module.title} />
        {Widget ? (
          <>
            <Widget chapterId={chapterId} moduleId={module.id} />
            <p className="module-evidence-note">交互图用于解释论文报告的关系与趋势；精确数值和原始曲线以论文图表为准。</p>
          </>
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
      </div>
    </div>
  );
}
