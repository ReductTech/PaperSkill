import type { FC } from 'react';
import Ch1 from './rev-ch1';
import Ch2 from './rev-ch2';
import Ch3 from './rev-ch3';
import Ch4 from './rev-ch4';
import Ch5 from './rev-ch5';
import Ch6 from './rev-ch6';
import Ch7 from './rev-ch7';
import Ch8 from './rev-ch8';
import Ch9 from './rev-ch9';
import Ch10 from './rev-ch10';
import { ToolSpecification } from './rev-ch4';

export interface WidgetProps { chapterId: string; moduleId: string; }
export const widgetRegistry: Record<string, FC<WidgetProps>> = {};
widgetRegistry['rev-ch1'] = Ch1;
widgetRegistry['rev-ch2'] = Ch2;
widgetRegistry['rev-ch3'] = Ch3;
widgetRegistry['rev-ch4'] = Ch4;
widgetRegistry['rev-ch5'] = Ch5;
widgetRegistry['rev-ch6'] = Ch6;
widgetRegistry['rev-ch7'] = Ch7;
widgetRegistry['rev-ch8'] = Ch8;
widgetRegistry['rev-ch9'] = Ch9;
widgetRegistry['rev-ch10'] = Ch10;
widgetRegistry['rev-ch4-spec'] = ToolSpecification;
