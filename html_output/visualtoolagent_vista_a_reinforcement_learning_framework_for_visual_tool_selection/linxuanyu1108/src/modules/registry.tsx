import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Widget16 } from './benchmark-transfer';
import { Widget3 } from './lab-1';
import { Widget5 } from './lab-2';
import { Widget7 } from './lab-3';
import { Widget9 } from './lab-4';
import { Widget11 } from './lab-5';
import { Widget13 } from './lab-6';
import { Widget15 } from './lab-7';
import { Widget18 } from './lab-8';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['benchmark-transfer'] = Widget16;
widgetRegistry['lab-1'] = Widget3;
widgetRegistry['lab-2'] = Widget5;
widgetRegistry['lab-3'] = Widget7;
widgetRegistry['lab-4'] = Widget9;
widgetRegistry['lab-5'] = Widget11;
widgetRegistry['lab-6'] = Widget13;
widgetRegistry['lab-7'] = Widget15;
widgetRegistry['lab-8'] = Widget18;
