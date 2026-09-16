import React from 'react';
import type { WidgetProps } from './registry';

// 纯图模块：内容就是论文原图 + 图注，本身不需要交互控件。
// Module.tsx 已经把 `figure` / `figureCaption` 画好了，这里只需渲染「无」。
// 这样既能原样引用论文插图，又不必为一个静态图伪造一个假的交互控件。
export const StaticFigure: React.FC<WidgetProps> = () => null;
