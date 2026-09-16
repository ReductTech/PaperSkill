import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DeepSWE1 } from './deepswe-lab-1';
import { DeepSWE10 } from './deepswe-lab-10';
import { DeepSWE2 } from './deepswe-lab-2';
import { DeepSWE3 } from './deepswe-lab-3';
import { DeepSWE4 } from './deepswe-lab-4';
import { DeepSWE5 } from './deepswe-lab-5';
import { DeepSWE6 } from './deepswe-lab-6';
import { DeepSWE7 } from './deepswe-lab-7';
import { DeepSWE8 } from './deepswe-lab-8';
import { DeepSWE9 } from './deepswe-lab-9';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['deepswe-lab-1'] = DeepSWE1;
widgetRegistry['deepswe-lab-10'] = DeepSWE10;
widgetRegistry['deepswe-lab-2'] = DeepSWE2;
widgetRegistry['deepswe-lab-3'] = DeepSWE3;
widgetRegistry['deepswe-lab-4'] = DeepSWE4;
widgetRegistry['deepswe-lab-5'] = DeepSWE5;
widgetRegistry['deepswe-lab-6'] = DeepSWE6;
widgetRegistry['deepswe-lab-7'] = DeepSWE7;
widgetRegistry['deepswe-lab-8'] = DeepSWE8;
widgetRegistry['deepswe-lab-9'] = DeepSWE9;
