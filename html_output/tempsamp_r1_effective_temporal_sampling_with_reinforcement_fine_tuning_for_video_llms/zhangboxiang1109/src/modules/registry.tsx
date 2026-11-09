import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { TsAnalogy } from './ts-analogy';
import { TsCot } from './ts-cot';
import { TsFewshot } from './ts-fewshot';
import { TsGeneral } from './ts-general';
import { TsHeroNew } from './ts-hero-new';
import { TsHeroOld } from './ts-hero-old';
import { TsLimits } from './ts-limits';
import { TsMix } from './ts-mix';
import { TsResults } from './ts-results';
import { TsReward } from './ts-reward';
import { TsSampling } from './ts-sampling';
import { TsShape } from './ts-shape';
import { TsSkew } from './ts-skew';
import { TsStrategy } from './ts-strategy';
import { TsTask } from './ts-task';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ts-analogy'] = TsAnalogy;
widgetRegistry['ts-cot'] = TsCot;
widgetRegistry['ts-fewshot'] = TsFewshot;
widgetRegistry['ts-general'] = TsGeneral;
widgetRegistry['ts-hero-new'] = TsHeroNew;
widgetRegistry['ts-hero-old'] = TsHeroOld;
widgetRegistry['ts-limits'] = TsLimits;
widgetRegistry['ts-mix'] = TsMix;
widgetRegistry['ts-results'] = TsResults;
widgetRegistry['ts-reward'] = TsReward;
widgetRegistry['ts-sampling'] = TsSampling;
widgetRegistry['ts-shape'] = TsShape;
widgetRegistry['ts-skew'] = TsSkew;
widgetRegistry['ts-strategy'] = TsStrategy;
widgetRegistry['ts-task'] = TsTask;
