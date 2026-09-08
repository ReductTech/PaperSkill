import React from 'react';
import { HeroContrast } from './heroContrast';
import { AnalogyScene } from './analogyScene';
import { Ch1Mod1 } from './ch1mod1';
import { Ch1Mod2 } from './ch1mod2';
import { Ch2Mod1 } from './ch2mod1';
import { Ch2Mod2 } from './ch2mod2';
import { Ch3Mod1 } from './ch3mod1';
import { Ch4Mod1 } from './ch4mod1';
import { Ch5Mod1 } from './ch5mod1';
import { Ch5Mod2 } from './ch5mod2';
import { Ch6Mod1 } from './ch6mod1';
import { Ch7Mod1 } from './ch7mod1';
import { Ch8Mod1 } from './ch8mod1';
import { Ch9Mod1 } from './ch9mod1';
import { Ch10Mod1 } from './ch10mod1';
import { Ch10Mod2 } from './ch10mod2';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['heroContrast'] = HeroContrast;
widgetRegistry['analogyScene'] = AnalogyScene;
widgetRegistry['ch1mod1'] = Ch1Mod1;
widgetRegistry['ch1mod2'] = Ch1Mod2;
widgetRegistry['ch2mod1'] = Ch2Mod1;
widgetRegistry['ch2mod2'] = Ch2Mod2;
widgetRegistry['ch3mod1'] = Ch3Mod1;
widgetRegistry['ch4mod1'] = Ch4Mod1;
widgetRegistry['ch5mod1'] = Ch5Mod1;
widgetRegistry['ch5mod2'] = Ch5Mod2;
widgetRegistry['ch6mod1'] = Ch6Mod1;
widgetRegistry['ch7mod1'] = Ch7Mod1;
widgetRegistry['ch8mod1'] = Ch8Mod1;
widgetRegistry['ch9mod1'] = Ch9Mod1;
widgetRegistry['ch10mod1'] = Ch10Mod1;
widgetRegistry['ch10mod2'] = Ch10Mod2;
