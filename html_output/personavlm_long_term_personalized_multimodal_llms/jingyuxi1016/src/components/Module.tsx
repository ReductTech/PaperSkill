import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const compactEvidence = module.componentId === 'memory-map' || module.componentId === 'process';
  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
      </div>
      <div className="module-body">
        {!compactEvidence && <><p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} /><Figure src={module.figure} alt={module.title} /></>}
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
        {compactEvidence && <details className="module-evidence"><summary>查看原论文依据、方法说明{module.figure ? '与原图' : ''}</summary><p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} /><Figure src={module.figure} alt={module.title} /></details>}
      </div>
    </div>
  );
}
