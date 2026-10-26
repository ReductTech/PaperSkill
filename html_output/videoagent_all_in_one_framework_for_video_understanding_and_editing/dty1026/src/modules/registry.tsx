import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1New } from './va-ch1-new';
import { Ch1Old } from './va-ch1-old';
import { Ch10Widget } from './va-ch10';
import { Ch2Widget } from './va-ch2';
import { Ch3Widget } from './va-ch3';
import { Ch4Widget } from './va-ch4';
import { Ch5Widget } from './va-ch5';
import { Ch6Widget } from './va-ch6';
import { Ch7Widget } from './va-ch7';
import { Ch8Widget } from './va-ch8';
import { Ch9Widget } from './va-ch9';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['va-ch1-new'] = Ch1New;
widgetRegistry['va-ch1-old'] = Ch1Old;
widgetRegistry['va-ch10'] = Ch10Widget;
widgetRegistry['va-ch2'] = Ch2Widget;
widgetRegistry['va-ch3'] = Ch3Widget;
widgetRegistry['va-ch4'] = Ch4Widget;
widgetRegistry['va-ch5'] = Ch5Widget;
widgetRegistry['va-ch6'] = Ch6Widget;
widgetRegistry['va-ch7'] = Ch7Widget;
widgetRegistry['va-ch8'] = Ch8Widget;
widgetRegistry['va-ch9'] = Ch9Widget;
