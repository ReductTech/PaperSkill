import React from 'react';
import { safeWidget } from './SafeWidget';
import { HeroOld, HeroNew } from './hero';
import { Ana1, Ana2, Ana3, Ana4, Ana5, Ana6, Ana7, Ana8, Ana9, Ana10 } from './analogies';
import { Ch1Mod1 } from './ch1';
import { Ch2Mod1 } from './ch2';
import { Ch3Mod1 } from './ch3';
import { Ch4Mod1 } from './ch4';
import { Ch5Mod1 } from './ch5';
import { Ch6Mod1 } from './ch6';
import { Ch7Mod1 } from './ch7';
import { Ch8Mod1 } from './ch8';
import { Ch9Mod1, Ch9Mod2 } from './ch9';
import { Ch10Mod1 } from './ch10';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Each widget is wrapped in its own error boundary (SafeWidget.tsx)
// so one broken module cannot blank the whole page.
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-old'] = safeWidget(HeroOld);
widgetRegistry['hero-new'] = safeWidget(HeroNew);

widgetRegistry['ana-1'] = safeWidget(Ana1);
widgetRegistry['ana-2'] = safeWidget(Ana2);
widgetRegistry['ana-3'] = safeWidget(Ana3);
widgetRegistry['ana-4'] = safeWidget(Ana4);
widgetRegistry['ana-5'] = safeWidget(Ana5);
widgetRegistry['ana-6'] = safeWidget(Ana6);
widgetRegistry['ana-7'] = safeWidget(Ana7);
widgetRegistry['ana-8'] = safeWidget(Ana8);
widgetRegistry['ana-9'] = safeWidget(Ana9);
widgetRegistry['ana-10'] = safeWidget(Ana10);

widgetRegistry['ch1-1'] = safeWidget(Ch1Mod1);
widgetRegistry['ch2-1'] = safeWidget(Ch2Mod1);
widgetRegistry['ch3-1'] = safeWidget(Ch3Mod1);
widgetRegistry['ch4-1'] = safeWidget(Ch4Mod1);
widgetRegistry['ch5-1'] = safeWidget(Ch5Mod1);
widgetRegistry['ch6-1'] = safeWidget(Ch6Mod1);
widgetRegistry['ch7-1'] = safeWidget(Ch7Mod1);
widgetRegistry['ch8-1'] = safeWidget(Ch8Mod1);
widgetRegistry['ch9-1'] = safeWidget(Ch9Mod1);
widgetRegistry['ch9-2'] = safeWidget(Ch9Mod2);
widgetRegistry['ch10-1'] = safeWidget(Ch10Mod1);
