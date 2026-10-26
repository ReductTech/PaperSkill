import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ana1 } from './ana-1';
import { Ana2 } from './ana-2';
import { Ana3 } from './ana-3';
import { Ana4 } from './ana-4';
import { Ana5 } from './ana-5';
import { Ana6 } from './ana-6';
import { M1Budget } from './m1-budget';
import { M2Tissue } from './m2-tissue';
import { M3Group } from './m3-group';
import { M4Patch } from './m4-patch';
import { M4Tune } from './m4-tune';
import { M5Train } from './m5-train';
import { M6Race } from './m6-race';
import { SceneKit } from './scene-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m2-tissue'] = M2Tissue;
widgetRegistry['m3-group'] = M3Group;
widgetRegistry['m4-patch'] = M4Patch;
widgetRegistry['m4-tune'] = M4Tune;
widgetRegistry['m5-train'] = M5Train;
widgetRegistry['m6-race'] = M6Race;
widgetRegistry['scene-kit'] = SceneKit;
