import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Token } from './m2-token';
import { M3Group } from './m3-group';
import { M4Quant } from './m4-quant';
import { M5Dynamic } from './m5-dynamic';
import { M6Kernel } from './m6-kernel';
import { M7Data } from './m7-data';
import { M7Lkd } from './m7-lkd';
import { M8Pipeline } from './m8-pipeline';
import { M9Compare } from './m9-compare';
import { M9Precision } from './m9-precision';
import { ZqAnalogy } from './zq-analogy';
import { ZqHeroNew } from './zq-hero-new';
import { ZqHeroOld } from './zq-hero-old';
import { ZqKit } from './zq-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-token'] = M2Token;
widgetRegistry['m3-group'] = M3Group;
widgetRegistry['m4-quant'] = M4Quant;
widgetRegistry['m5-dynamic'] = M5Dynamic;
widgetRegistry['m6-kernel'] = M6Kernel;
widgetRegistry['m7-data'] = M7Data;
widgetRegistry['m7-lkd'] = M7Lkd;
widgetRegistry['m8-pipeline'] = M8Pipeline;
widgetRegistry['m9-compare'] = M9Compare;
widgetRegistry['m9-precision'] = M9Precision;
widgetRegistry['zq-analogy'] = ZqAnalogy;
widgetRegistry['zq-hero-new'] = ZqHeroNew;
widgetRegistry['zq-hero-old'] = ZqHeroOld;
widgetRegistry['zq-kit'] = ZqKit;
