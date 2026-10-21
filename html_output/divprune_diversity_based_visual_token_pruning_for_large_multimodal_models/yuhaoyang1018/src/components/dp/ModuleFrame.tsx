import React from 'react';
import type { ModuleDef } from '../../types';
import { widgetRegistry } from '../../modules/registry';
import { Rich, Tags } from '../../ui/kit';

// 单个组件出错时只影响自己，不让整页卸载
class WidgetBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error(err);
  }
  render() {
    return this.state.failed ? <div className="fb fb-bad">此交互组件加载失败，请刷新页面重试。</div> : this.props.children;
  }
}

// 交互模块外框：编号 + 标题 + 口径标记 + 说明 + 组件本体。
export function ModuleFrame({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  return (
    <section className="mod" aria-labelledby={`mod-${module.id}`}>
      <header className="mod-head">
        <span className="mod-num">{module.id}</span>
        <h3 id={`mod-${module.id}`}>{module.title}</h3>
        {module.tags?.length ? <Tags kinds={module.tags} /> : null}
      </header>
      <p className="mod-desc">
        <Rich text={module.desc} />
      </p>
      <div className="mod-body">
        {Widget ? (
          <WidgetBoundary>
            <Widget chapterId={chapterId} moduleId={module.id} />
          </WidgetBoundary>
        ) : (
          <div className="fb fb-bad">组件未实现：{module.componentId}</div>
        )}
      </div>
    </section>
  );
}
