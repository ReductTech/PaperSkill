import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  Analogy1,
  Analogy2,
  Analogy3,
  Analogy4,
  Analogy5,
  Analogy6,
  Analogy7,
  Analogy8,
  Analogy9,
  Analogy10,
} from './analogies';
import { Mod11, Mod21, Mod31 } from './ch1to3';
import { Mod41, Mod42, Mod51, Mod61 } from './ch4to6';
import { Mod71, Mod72, Mod81, Mod91 } from './ch7to9';
import { Mod101, Mod102 } from './ch10';

// 组件注册表：把 tutorial.ts 中的 `componentId` 映射到具体 React 组件。
// 生活类比动画（ana-*）与交互模块（mod-*）都在此登记；缺失的 id 会退化为占位提示，
// 因此应用不会因为未完成的 id 而崩溃。

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 保留示例组件，便于继续扩展。
widgetRegistry['example-slider'] = ExampleSlider;

// 各章的生活类比动画：水彩调色与上色。
widgetRegistry['ana-1'] = Analogy1;
widgetRegistry['ana-2'] = Analogy2;
widgetRegistry['ana-3'] = Analogy3;
widgetRegistry['ana-4'] = Analogy4;
widgetRegistry['ana-5'] = Analogy5;
widgetRegistry['ana-6'] = Analogy6;
widgetRegistry['ana-7'] = Analogy7;
widgetRegistry['ana-8'] = Analogy8;
widgetRegistry['ana-9'] = Analogy9;
widgetRegistry['ana-10'] = Analogy10;

// 各章的交互模块。
widgetRegistry['mod-1-1'] = Mod11;
widgetRegistry['mod-2-1'] = Mod21;
widgetRegistry['mod-3-1'] = Mod31;
widgetRegistry['mod-4-1'] = Mod41;
widgetRegistry['mod-4-2'] = Mod42;
widgetRegistry['mod-5-1'] = Mod51;
widgetRegistry['mod-6-1'] = Mod61;
widgetRegistry['mod-7-1'] = Mod71;
widgetRegistry['mod-7-2'] = Mod72;
widgetRegistry['mod-8-1'] = Mod81;
widgetRegistry['mod-9-1'] = Mod91;
widgetRegistry['mod-10-1'] = Mod101;
widgetRegistry['mod-10-2'] = Mod102;