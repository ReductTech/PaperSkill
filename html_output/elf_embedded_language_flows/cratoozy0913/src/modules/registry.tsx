import React from 'react';

// 交互由 elf-engine.js 驱动 HTML 画布；保留兼容接口。

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 本迁移项目不使用组件注册；如需真正接入 React 组件渲染，
// 可在此处 import 并注册：widgetRegistry['my-widget'] = MyWidget;
