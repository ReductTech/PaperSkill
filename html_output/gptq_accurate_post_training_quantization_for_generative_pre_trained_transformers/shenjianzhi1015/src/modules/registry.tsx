import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { GptqAnalogy } from './gptq-analogy';
import { GptqHeroNew } from './gptq-hero-new';
import { GptqHeroOld } from './gptq-hero-old';
import { GptqKit } from './gptq-kit';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Calib } from './m2-calib';
import { M3Order } from './m3-order';
import { M4Curv } from './m4-curv';
import { M4Pick } from './m4-pick';
import { M5Compensate } from './m5-compensate';
import { M5Strength } from './m5-strength';
import { M6Block } from './m6-block';
import { M7Stable } from './m7-stable';
import { M8Algo } from './m8-algo';
import { M9Bits } from './m9-bits';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['gptq-analogy'] = GptqAnalogy;
widgetRegistry['gptq-hero-new'] = GptqHeroNew;
widgetRegistry['gptq-hero-old'] = GptqHeroOld;
widgetRegistry['gptq-kit'] = GptqKit;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-calib'] = M2Calib;
widgetRegistry['m3-order'] = M3Order;
widgetRegistry['m4-curv'] = M4Curv;
widgetRegistry['m4-pick'] = M4Pick;
widgetRegistry['m5-compensate'] = M5Compensate;
widgetRegistry['m5-strength'] = M5Strength;
widgetRegistry['m6-block'] = M6Block;
widgetRegistry['m7-stable'] = M7Stable;
widgetRegistry['m8-algo'] = M8Algo;
widgetRegistry['m9-bits'] = M9Bits;
