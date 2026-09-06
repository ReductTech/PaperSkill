import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const figurePlacement = module.figurePlacement ?? 'before';
  const figure = (
    <Figure
      src={module.figure}
      alt={module.title}
      caption={module.figureCaption}
      label={module.figureLabel ?? '论文原图'}
    />
  );
  const interactive = (
    <div className="module-interactive">
      <div className="content-eyebrow interactive-eyebrow">交互拆解</div>
      {Widget ? (
        <Widget chapterId={chapterId} moduleId={module.id} />
      ) : (
        <div className="feedback bad">
          组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
        </div>
      )}
    </div>
  );

  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
        <span className="module-evidence-label">{module.evidenceLabel}</span>
      </div>
      <div className="module-body">
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        {figurePlacement === 'before' ? figure : null}
        {interactive}
        {figurePlacement === 'after' ? figure : null}
      </div>
    </div>
  );
}
