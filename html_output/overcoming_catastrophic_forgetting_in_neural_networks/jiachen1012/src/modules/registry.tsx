import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { EwcAnalogy } from './ewc-analogy';
import { EwcCh1Mod1 } from './ewc-ch1-mod1';
import { EwcCh1Mod2 } from './ewc-ch1-mod2';
import { EwcCh10Mod1 } from './ewc-ch10-mod1';
import { EwcCh2Mod1 } from './ewc-ch2-mod1';
import { EwcCh3Mod1 } from './ewc-ch3-mod1';
import { EwcCh4Mod1 } from './ewc-ch4-mod1';
import { EwcCh5Mod1 } from './ewc-ch5-mod1';
import { EwcCh6Mod1 } from './ewc-ch6-mod1';
import { EwcCh7Mod1 } from './ewc-ch7-mod1';
import { EwcCh8Mod1 } from './ewc-ch8-mod1';
import { EwcCh9Mod1 } from './ewc-ch9-mod1';
import { EwcHero } from './ewc-hero';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ewc-analogy'] = EwcAnalogy;
widgetRegistry['ewc-ch1-mod1'] = EwcCh1Mod1;
widgetRegistry['ewc-ch1-mod2'] = EwcCh1Mod2;
widgetRegistry['ewc-ch10-mod1'] = EwcCh10Mod1;
widgetRegistry['ewc-ch2-mod1'] = EwcCh2Mod1;
widgetRegistry['ewc-ch3-mod1'] = EwcCh3Mod1;
widgetRegistry['ewc-ch4-mod1'] = EwcCh4Mod1;
widgetRegistry['ewc-ch5-mod1'] = EwcCh5Mod1;
widgetRegistry['ewc-ch6-mod1'] = EwcCh6Mod1;
widgetRegistry['ewc-ch7-mod1'] = EwcCh7Mod1;
widgetRegistry['ewc-ch8-mod1'] = EwcCh8Mod1;
widgetRegistry['ewc-ch9-mod1'] = EwcCh9Mod1;
widgetRegistry['ewc-hero'] = EwcHero;
