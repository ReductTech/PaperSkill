import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnaTheme } from './ana-theme';
import { HeroOld } from './hero-old';
import { HeroNew } from './hero-new';
import { Ch1Mod1 } from './mod-ch1-1';
import { Ch1Mod2 } from './mod-ch1-2';
import { Ch2Mod1 } from './mod-ch2-1';
import { Ch2Mod2 } from './mod-ch2-2';
import { Ch3Mod1 } from './mod-ch3-1';
import { Ch4Mod1 } from './mod-ch4-1';
import { Ch5Mod1 } from './mod-ch5-1';
import { Ch6Mod1 } from './mod-ch6-1';
import { Ch6Mod2 } from './mod-ch6-2';
import { Ch7Mod1 } from './mod-ch7-1';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. A missing id renders a graceful placeholder, so the app never
// crashes on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-theme'] = AnaTheme;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['mod-ch1-1'] = Ch1Mod1;
widgetRegistry['mod-ch1-2'] = Ch1Mod2;
widgetRegistry['mod-ch2-1'] = Ch2Mod1;
widgetRegistry['mod-ch2-2'] = Ch2Mod2;
widgetRegistry['mod-ch3-1'] = Ch3Mod1;
widgetRegistry['mod-ch4-1'] = Ch4Mod1;
widgetRegistry['mod-ch5-1'] = Ch5Mod1;
widgetRegistry['mod-ch6-1'] = Ch6Mod1;
widgetRegistry['mod-ch6-2'] = Ch6Mod2;
widgetRegistry['mod-ch7-1'] = Ch7Mod1;
