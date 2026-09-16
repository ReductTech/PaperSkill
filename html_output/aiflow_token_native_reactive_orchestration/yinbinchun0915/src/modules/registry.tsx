import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HeroOld, HeroNew } from './aiflow-hero';
import { Ch1Analogy, Ch2Analogy, Ch3Analogy, Ch4Analogy, Ch5Analogy, Ch6Analogy, Ch7Analogy, Ch8Analogy, Ch9Analogy, Ch10Analogy } from './aiflow-analogy';
import { Ch1Mod1, Ch2Mod1, Ch3Mod1, Ch4Mod1, Ch5Mod1 } from './aiflow-modules-1';
import { Ch6Mod1, Ch6Mod2, Ch7Mod1, Ch8Mod1, Ch9Mod1, Ch10Mod1 } from './aiflow-modules-2';
import { Ch5Mod2, Ch9Mod2 } from './aiflow-modules-3';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['ch1-analogy'] = Ch1Analogy;
widgetRegistry['ch2-analogy'] = Ch2Analogy;
widgetRegistry['ch3-analogy'] = Ch3Analogy;
widgetRegistry['ch4-analogy'] = Ch4Analogy;
widgetRegistry['ch5-analogy'] = Ch5Analogy;
widgetRegistry['ch6-analogy'] = Ch6Analogy;
widgetRegistry['ch7-analogy'] = Ch7Analogy;
widgetRegistry['ch8-analogy'] = Ch8Analogy;
widgetRegistry['ch9-analogy'] = Ch9Analogy;
widgetRegistry['ch10-analogy'] = Ch10Analogy;
widgetRegistry['ch1-mod1'] = Ch1Mod1;
widgetRegistry['ch2-mod1'] = Ch2Mod1;
widgetRegistry['ch3-mod1'] = Ch3Mod1;
widgetRegistry['ch4-mod1'] = Ch4Mod1;
widgetRegistry['ch5-mod1'] = Ch5Mod1;
widgetRegistry['ch5-mod2'] = Ch5Mod2;
widgetRegistry['ch6-mod1'] = Ch6Mod1;
widgetRegistry['ch6-mod2'] = Ch6Mod2;
widgetRegistry['ch7-mod1'] = Ch7Mod1;
widgetRegistry['ch8-mod1'] = Ch8Mod1;
widgetRegistry['ch9-mod1'] = Ch9Mod1;
widgetRegistry['ch9-mod2'] = Ch9Mod2;
widgetRegistry['ch10-mod1'] = Ch10Mod1;
