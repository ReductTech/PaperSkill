import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { KvAnalogy } from './kv-analogy';
import { KvHeroNew } from './kv-hero-new';
import { KvHeroOld } from './kv-hero-old';
import { KvKit } from './kv-kit';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Layout } from './m2-layout';
import { M3Axis } from './m3-axis';
import { M4Quant } from './m4-quant';
import { M5Residual } from './m5-residual';
import { M5Stream } from './m5-stream';
import { M6Kernel } from './m6-kernel';
import { M7Tuning } from './m7-tuning';
import { M8Pipeline } from './m8-pipeline';
import { M9Compare } from './m9-compare';
import { M9Config } from './m9-config';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['kv-analogy'] = KvAnalogy;
widgetRegistry['kv-hero-new'] = KvHeroNew;
widgetRegistry['kv-hero-old'] = KvHeroOld;
widgetRegistry['kv-kit'] = KvKit;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-layout'] = M2Layout;
widgetRegistry['m3-axis'] = M3Axis;
widgetRegistry['m4-quant'] = M4Quant;
widgetRegistry['m5-residual'] = M5Residual;
widgetRegistry['m5-stream'] = M5Stream;
widgetRegistry['m6-kernel'] = M6Kernel;
widgetRegistry['m7-tuning'] = M7Tuning;
widgetRegistry['m8-pipeline'] = M8Pipeline;
widgetRegistry['m9-compare'] = M9Compare;
widgetRegistry['m9-config'] = M9Config;
