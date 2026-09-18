import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { WorldCh1 } from './world-ch1';
import { WorldCh10 } from './world-ch10';
import { WorldCh2 } from './world-ch2';
import { WorldCh2Affordance } from './world-ch2-affordance';
import { WorldCh3 } from './world-ch3';
import { WorldCh4 } from './world-ch4';
import { WorldCh5 } from './world-ch5';
import { WorldCh6 } from './world-ch6';
import { WorldCh7 } from './world-ch7';
import { WorldCh8 } from './world-ch8';
import { WorldCh9 } from './world-ch9';
import { WorldKitWidget } from './world-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['world-ch1'] = WorldCh1;
widgetRegistry['world-ch10'] = WorldCh10;
widgetRegistry['world-ch2'] = WorldCh2;
widgetRegistry['world-ch2-affordance'] = WorldCh2Affordance;
widgetRegistry['world-ch3'] = WorldCh3;
widgetRegistry['world-ch4'] = WorldCh4;
widgetRegistry['world-ch5'] = WorldCh5;
widgetRegistry['world-ch6'] = WorldCh6;
widgetRegistry['world-ch7'] = WorldCh7;
widgetRegistry['world-ch8'] = WorldCh8;
widgetRegistry['world-ch9'] = WorldCh9;
widgetRegistry['world-kit'] = WorldKitWidget;
