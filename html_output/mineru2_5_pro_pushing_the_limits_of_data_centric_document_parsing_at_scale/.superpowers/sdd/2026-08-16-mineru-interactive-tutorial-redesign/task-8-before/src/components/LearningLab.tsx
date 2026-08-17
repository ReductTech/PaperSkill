import React from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { GlossaryText, Term } from './Glossary';

export function LearningLab({
  module,
  stepId,
  guidedState,
  onInteract,
  onStateChange,
}: {
  module: ModuleDef;
  stepId: string;
  guidedState?: string;
  onInteract: () => void;
  onStateChange: (state: string) => void;
}) {
  const Widget = widgetRegistry[module.componentId];
  const featuredMotion = ['page-ddas', 'render-verify', 'mgam-lab'].includes(module.componentId);

  return (
    <article
      className={`learning-lab ${featuredMotion ? 'learning-lab--featured-motion' : ''}`}
      id={`lab-${module.componentId}`}
      data-module-id={module.componentId}
    >
      <header className="learning-lab-head">
        <div className="lab-index">实验 {module.id}</div>
        <div>
          <h3><GlossaryText text={module.title} /></h3>
          <p><GlossaryText text={module.desc} /></p>
        </div>
        <span className="source-tag teaching">{featuredMotion ? '重点动态图解' : '教学示意'}</span>
      </header>

      <details className="term-strip">
        <summary>点击解释本实验术语 · {module.terms.length} 个</summary>
        <div aria-label="本实验涉及的术语">
          {module.terms.map((term) => <Term key={term} id={term} />)}
        </div>
      </details>

      <div className="learning-lab-body">
        {Widget ? (
          <Widget
            chapterId={stepId}
            moduleId={module.id}
            mode={guidedState ? 'guided' : 'explore'}
            guidedState={guidedState}
            onInteract={onInteract}
            onStateChange={onStateChange}
          />
        ) : (
          <div className="lab-error" role="status">交互模块“{module.componentId}”尚未注册。</div>
        )}
      </div>
    </article>
  );
}
