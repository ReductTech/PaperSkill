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
    <div className="module presentation-module" aria-label={module.title}>
      {module.title ? (
        <div className="module-head clean-module-head">
          <h4>{module.title}</h4>
        </div>
      ) : null}
      <div className="module-body">
        {module.desc ? <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} /> : null}
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
