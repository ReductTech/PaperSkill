import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AwqAnalogy } from './awq-analogy';
import { AwqHeroNew } from './awq-hero-new';
import { AwqHeroOld } from './awq-hero-old';
import { AwqKit } from './awq-kit';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Reference } from './m2-reference';
import { M3Skip } from './m3-skip';
import { M4Quant } from './m4-quant';
import { M5Equivalent } from './m5-equivalent';
import { M5Scale } from './m5-scale';
import { M6Search } from './m6-search';
import { M7Calib } from './m7-calib';
import { M8TinyChat } from './m8-tinychat';
import { M9Bits } from './m9-bits';
import { M9Platform } from './m9-platform';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['awq-analogy'] = AwqAnalogy;
widgetRegistry['awq-hero-new'] = AwqHeroNew;
widgetRegistry['awq-hero-old'] = AwqHeroOld;
widgetRegistry['awq-kit'] = AwqKit;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-reference'] = M2Reference;
widgetRegistry['m3-skip'] = M3Skip;
widgetRegistry['m4-quant'] = M4Quant;
widgetRegistry['m5-equivalent'] = M5Equivalent;
widgetRegistry['m5-scale'] = M5Scale;
widgetRegistry['m6-search'] = M6Search;
widgetRegistry['m7-calib'] = M7Calib;
widgetRegistry['m8-tinychat'] = M8TinyChat;
widgetRegistry['m9-bits'] = M9Bits;
widgetRegistry['m9-platform'] = M9Platform;
