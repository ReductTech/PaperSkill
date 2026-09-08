import React from 'react';

// ============================================================================
//  elf_example — 占位组件注册表（paper-skill 结构兼容文件）
//
//  重要说明：本教程为迁移示例网页，实际画布与交互由
//  src/lib/elf-engine.js 直接驱动 src/data/_*.html 中的 DOM（按 id 查找），
//  不走 React 组件注册表。此文件仅用于通过仓库结构校验
//  （validate-output.js 要求存在 src/modules/registry.tsx）。
//
//  tutorial.ts 占位骨架引用的 componentId 均为内置白名单 example-slider，
//  故此处无需注册任何自定义组件；保留空注册表即可。
// ============================================================================

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 本迁移项目不使用组件注册；如需真正接入 React 组件渲染，
// 可在此处 import 并注册：widgetRegistry['my-widget'] = MyWidget;
