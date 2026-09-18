import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const interactionFirst = ['tribe-architecture', 'time-alignment', 'modality-dropout'].includes(module.componentId);
  const mobileChapterNine =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 640px)').matches &&
    chapterId === 'chap-9' &&
    module.id !== '9.1';
  const [collapsed, setCollapsed] = React.useState(mobileChapterNine);
  return (
    <div className={`module ${collapsed ? 'module-collapsed' : ''}`}>
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
        {mobileChapterNine ? (
          <button className="module-toggle" type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? '展开本节' : '收起本节'}
          </button>
        ) : null}
      </div>
      {!collapsed ? <div className="module-body">
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        {!interactionFirst && <Figure src={module.figure} alt={module.title} caption={module.figureLabel} />}
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
        {interactionFirst && <Figure src={module.figure} alt={module.title} caption={module.figureLabel} />}
      </div> : null}
    </div>
  );
}
