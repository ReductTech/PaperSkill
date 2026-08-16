import React, { Suspense } from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

export function Module({
  module,
  chapterId,
  chapterIndex = 0,
}: {
  module: ModuleDef;
  chapterId: string;
  chapterIndex?: number;
}) {
  const Widget = widgetRegistry[module.componentId];
  const showBody = chapterIndex === 0 || Boolean(Widget);
  const standaloneComponents = new Set(['quality-filter-challenge', 'prompt-construction-workshop']);
  if (Widget && standaloneComponents.has(module.componentId)) {
    return (
      <div className="module-standalone reveal-on-scroll">
        <Widget chapterId={chapterId} moduleId={module.id} />
      </div>
    );
  }

  return (
    <div className="module reveal-on-scroll">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
      </div>
      <div className="module-body">
        {module.desc ? <p className="module-desc">{module.desc}</p> : null}
        {showBody ? (
          <>
            <Figure src={module.figure} alt={module.title} />
            {Widget ? (
              <Suspense fallback={<div className="hd-skeleton" aria-label="组件加载中" />}>
                <Widget chapterId={chapterId} moduleId={module.id} />
              </Suspense>
            ) : null}
          </>
        ) : (
          <div className="hd-empty-demo" aria-hidden="true">
            <div className="hd-empty-demo-box">
              <span className="hd-empty-demo-num">{module.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

