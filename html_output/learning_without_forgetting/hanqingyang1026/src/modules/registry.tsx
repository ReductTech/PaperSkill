import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnaTea } from './ana-tea';
import { HeroTea } from './hero-tea';
import { M1Methods } from './m1-methods';
import { M10Race } from './m10-race';
import { M2Snapshot } from './m2-snapshot';
import { M3Distill } from './m3-distill';
import { M4Temp } from './m4-temp';
import { M5Constraint } from './m5-constraint';
import { M5Lambda } from './m5-lambda';
import { M6Steps } from './m6-steps';
import { M7Cost } from './m7-cost';
import { M8Surgery } from './m8-surgery';
import { M8Variants } from './m8-variants';
import { M9Alt } from './m9-alt';
import { M9Warmup } from './m9-warmup';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-tea'] = AnaTea;
widgetRegistry['hero-tea'] = HeroTea;
widgetRegistry['m1-methods'] = M1Methods;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-snapshot'] = M2Snapshot;
widgetRegistry['m3-distill'] = M3Distill;
widgetRegistry['m4-temp'] = M4Temp;
widgetRegistry['m5-constraint'] = M5Constraint;
widgetRegistry['m5-lambda'] = M5Lambda;
widgetRegistry['m6-steps'] = M6Steps;
widgetRegistry['m7-cost'] = M7Cost;
widgetRegistry['m8-surgery'] = M8Surgery;
widgetRegistry['m8-variants'] = M8Variants;
widgetRegistry['m9-alt'] = M9Alt;
widgetRegistry['m9-warmup'] = M9Warmup;
