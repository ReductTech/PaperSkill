import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyCanvas } from './analogy-canvas';
import { Ch10Mod1 } from './ch10mod1';
import { Ch10Mod2 } from './ch10mod2';
import { Ch1Mod1 } from './ch1mod1';
import { Ch2Mod1 } from './ch2mod1';
import { Ch3Mod1 } from './ch3mod1';
import { Ch3Mod2 } from './ch3mod2';
import { Ch4Mod1 } from './ch4mod1';
import { Ch5Mod1 } from './ch5mod1';
import { Ch6Mod1 } from './ch6mod1';
import { Ch7Mod1 } from './ch7mod1';
import { Ch8Mod1 } from './ch8mod1';
import { Ch9Mod1 } from './ch9mod1';
import { HeroPanel } from './hero-panel';
import { PaperKit } from './paper-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-canvas'] = AnalogyCanvas;
widgetRegistry['ch10mod1'] = Ch10Mod1;
widgetRegistry['ch10mod2'] = Ch10Mod2;
widgetRegistry['ch1mod1'] = Ch1Mod1;
widgetRegistry['ch2mod1'] = Ch2Mod1;
widgetRegistry['ch3mod1'] = Ch3Mod1;
widgetRegistry['ch3mod2'] = Ch3Mod2;
widgetRegistry['ch4mod1'] = Ch4Mod1;
widgetRegistry['ch5mod1'] = Ch5Mod1;
widgetRegistry['ch6mod1'] = Ch6Mod1;
widgetRegistry['ch7mod1'] = Ch7Mod1;
widgetRegistry['ch8mod1'] = Ch8Mod1;
widgetRegistry['ch9mod1'] = Ch9Mod1;
widgetRegistry['hero-panel'] = HeroPanel;
widgetRegistry['paper-kit'] = PaperKit;
