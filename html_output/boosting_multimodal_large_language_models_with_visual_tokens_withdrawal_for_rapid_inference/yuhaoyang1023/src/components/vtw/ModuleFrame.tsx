import React from 'react';
import type { ModuleDef } from '../../types';
import { widgetRegistry } from '../../modules/registry';
import { Rich, Tags } from '../../ui/kit';
import { ErrorBoundary } from '../../ui/ErrorBoundary';

export const moduleAnchor = (id: string) => `m${id.replace('.', '-')}`;

// 交互模块外框：编号 + 标题 + 口径标记（一行）→“试试看”提示 → 组件本体（外包错误边界）。
export function ModuleFrame({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const anchor = moduleAnchor(module.id);
  return (
    <section className={`mod ${module.core ? 'mod-core' : ''}`} id={anchor} aria-labelledby={`${anchor}-t`}>
      <header className="mod-head">
        <span className="mod-num">{module.id}</span>
        <h3 id={`${anchor}-t`} tabIndex={-1}>
          {module.title}
        </h3>
        {module.tags?.length ? <Tags kinds={module.tags} /> : null}
      </header>
      {module.try ? (
        <p className="mod-try">
          <span className="mod-try-k">试试看</span>
          <span>
            <Rich text={module.try} />
          </span>
        </p>
      ) : (
        <p className="mod-desc">
          <Rich text={module.desc} />
        </p>
      )}
      <div className="mod-body">
        <ErrorBoundary name={`模块 ${module.id}`}>
          {Widget ? <Widget chapterId={chapterId} moduleId={module.id} /> : <div className="eb">组件未注册：{module.componentId}</div>}
        </ErrorBoundary>
      </div>
    </section>
  );
}
