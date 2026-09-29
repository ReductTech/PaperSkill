import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LabSharedPlaceholder } from './lab-shared';
import { LoraCh1 } from './lora-ch1';
import { LoraCh10 } from './lora-ch10';
import { LoraCh2 } from './lora-ch2';
import { LoraCh3 } from './lora-ch3';
import { LoraCh4 } from './lora-ch4';
import { LoraCh5 } from './lora-ch5';
import { LoraCh6 } from './lora-ch6';
import { LoraCh7 } from './lora-ch7';
import { LoraCh8 } from './lora-ch8';
import { LoraCh9 } from './lora-ch9';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['lab-shared'] = LabSharedPlaceholder;
widgetRegistry['lora-ch1'] = LoraCh1;
widgetRegistry['lora-ch10'] = LoraCh10;
widgetRegistry['lora-ch2'] = LoraCh2;
widgetRegistry['lora-ch3'] = LoraCh3;
widgetRegistry['lora-ch4'] = LoraCh4;
widgetRegistry['lora-ch5'] = LoraCh5;
widgetRegistry['lora-ch6'] = LoraCh6;
widgetRegistry['lora-ch7'] = LoraCh7;
widgetRegistry['lora-ch8'] = LoraCh8;
widgetRegistry['lora-ch9'] = LoraCh9;
