import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';
import type { ModuleExplanation } from '../data/explanations';

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId, explanation }: { module: ModuleDef; chapterId: string; explanation?: ModuleExplanation }) {
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
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
        {explanation && <section className="module-explanation" data-explanation-for={module.id}>{explanation.paragraphs.map((text,i)=><p key={i}>{text}</p>)}{explanation.observations.map((text,i)=><p className="observation-hint" key={`hint-${i}`}><strong>试一试：</strong>{text}</p>)}</section>}
      </div>
    </div>
  );
}
