import React from 'react';
import {
  Analogy1,
  Analogy10,
  Analogy2,
  Analogy3,
  Analogy4,
  Analogy5,
  Analogy6,
  Analogy7,
  Analogy8,
  Analogy9,
  Ch10m1,
  Ch1m1,
  Ch1m2,
  Ch2m1,
  Ch3m1,
  Ch4m1,
  Ch5m1,
  Ch6m1,
  Ch7m1,
  Ch8m1,
  Ch9m1,
  HeroNew,
  HeroOld,
} from './dartsWidgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['analogy-1'] = Analogy1;
widgetRegistry['analogy-10'] = Analogy10;
widgetRegistry['analogy-2'] = Analogy2;
widgetRegistry['analogy-3'] = Analogy3;
widgetRegistry['analogy-4'] = Analogy4;
widgetRegistry['analogy-5'] = Analogy5;
widgetRegistry['analogy-6'] = Analogy6;
widgetRegistry['analogy-7'] = Analogy7;
widgetRegistry['analogy-8'] = Analogy8;
widgetRegistry['analogy-9'] = Analogy9;
widgetRegistry['ch10m1'] = Ch10m1;
widgetRegistry['ch1m1'] = Ch1m1;
widgetRegistry['ch1m2'] = Ch1m2;
widgetRegistry['ch2m1'] = Ch2m1;
widgetRegistry['ch3m1'] = Ch3m1;
widgetRegistry['ch4m1'] = Ch4m1;
widgetRegistry['ch5m1'] = Ch5m1;
widgetRegistry['ch6m1'] = Ch6m1;
widgetRegistry['ch7m1'] = Ch7m1;
widgetRegistry['ch8m1'] = Ch8m1;
widgetRegistry['ch9m1'] = Ch9m1;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
