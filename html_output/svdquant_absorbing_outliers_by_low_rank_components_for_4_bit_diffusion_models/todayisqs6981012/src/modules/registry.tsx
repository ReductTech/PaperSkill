import React from 'react';
import { HeroOld, HeroNew } from './hero';
import { Ana1, Ana2, Ana3, Ana4, Ana5, Ana6, Ana7, Ana8, Ana9, Ana10 } from './analogy';
import { Ch1Bench } from './ch1';
import { Ch2Channels } from './ch2';
import { Ch3Protect } from './ch3';
import { Ch4Svd } from './ch4';
import { Ch5Alpha } from './ch5';
import { Ch6Memory } from './ch6';
import { Ch7Gptq } from './ch7';
import { Ch8Flow, Ch8Latency } from './ch8';
import { Ch9Nvfp4 } from './ch9';
import { Ch10Race } from './ch10';

// Widget registry：把 tutorial.ts 里的 componentId 映射到组件。
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;

widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['ana-7'] = Ana7;
widgetRegistry['ana-8'] = Ana8;
widgetRegistry['ana-9'] = Ana9;
widgetRegistry['ana-10'] = Ana10;

widgetRegistry['ch1-bench'] = Ch1Bench;
widgetRegistry['ch2-channels'] = Ch2Channels;
widgetRegistry['ch3-protect'] = Ch3Protect;
widgetRegistry['ch4-svd'] = Ch4Svd;
widgetRegistry['ch5-alpha'] = Ch5Alpha;
widgetRegistry['ch6-memory'] = Ch6Memory;
widgetRegistry['ch7-gptq'] = Ch7Gptq;
widgetRegistry['ch8-flow'] = Ch8Flow;
widgetRegistry['ch8-latency'] = Ch8Latency;
widgetRegistry['ch9-nvfp4'] = Ch9Nvfp4;
widgetRegistry['ch10-race'] = Ch10Race;
