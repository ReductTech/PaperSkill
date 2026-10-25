import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Outlier } from './m2-outlier';
import { M3Migrate } from './m3-migrate';
import { M4Math } from './m4-math';
import { M5Alpha } from './m5-alpha';
import { M5Model } from './m5-model';
import { M6Scheme } from './m6-scheme';
import { M7Fuse } from './m7-fuse';
import { M8Map } from './m8-map';
import { M9Compare } from './m9-compare';
import { M9Scale } from './m9-scale';
import { SqAnalogy } from './sq-analogy';
import { SqHeroNew } from './sq-hero-new';
import { SqHeroOld } from './sq-hero-old';
import { SqKit } from './sq-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-outlier'] = M2Outlier;
widgetRegistry['m3-migrate'] = M3Migrate;
widgetRegistry['m4-math'] = M4Math;
widgetRegistry['m5-alpha'] = M5Alpha;
widgetRegistry['m5-model'] = M5Model;
widgetRegistry['m6-scheme'] = M6Scheme;
widgetRegistry['m7-fuse'] = M7Fuse;
widgetRegistry['m8-map'] = M8Map;
widgetRegistry['m9-compare'] = M9Compare;
widgetRegistry['m9-scale'] = M9Scale;
widgetRegistry['sq-analogy'] = SqAnalogy;
widgetRegistry['sq-hero-new'] = SqHeroNew;
widgetRegistry['sq-hero-old'] = SqHeroOld;
widgetRegistry['sq-kit'] = SqKit;
