import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LiAnalogy } from './li-analogy';
import { LiHeroNew } from './li-hero-new';
import { LiHeroOld } from './li-hero-old';
import { LiKit } from './li-kit';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Quant } from './m2-quant';
import { M3Outlier } from './m3-outlier';
import { M4Scale } from './m4-scale';
import { M5Alpha } from './m5-alpha';
import { M5Gentle } from './m5-gentle';
import { M6Precision } from './m6-precision';
import { M7Decomp } from './m7-decomp';
import { M8Flow } from './m8-flow';
import { M9Hardware } from './m9-hardware';
import { M9Methods } from './m9-methods';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['li-analogy'] = LiAnalogy;
widgetRegistry['li-hero-new'] = LiHeroNew;
widgetRegistry['li-hero-old'] = LiHeroOld;
widgetRegistry['li-kit'] = LiKit;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-quant'] = M2Quant;
widgetRegistry['m3-outlier'] = M3Outlier;
widgetRegistry['m4-scale'] = M4Scale;
widgetRegistry['m5-alpha'] = M5Alpha;
widgetRegistry['m5-gentle'] = M5Gentle;
widgetRegistry['m6-precision'] = M6Precision;
widgetRegistry['m7-decomp'] = M7Decomp;
widgetRegistry['m8-flow'] = M8Flow;
widgetRegistry['m9-hardware'] = M9Hardware;
widgetRegistry['m9-methods'] = M9Methods;
