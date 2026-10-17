import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { GemAnalogy } from './gem-analogy';
import { GemC1 } from './gem-c1';
import { GemC1Extra } from './gem-c1-extra';
import { GemC10 } from './gem-c10';
import { GemC10Extra } from './gem-c10-extra';
import { GemC2 } from './gem-c2';
import { GemC3 } from './gem-c3';
import { GemC4 } from './gem-c4';
import { GemC5 } from './gem-c5';
import { GemC6 } from './gem-c6';
import { GemC7 } from './gem-c7';
import { GemC8 } from './gem-c8';
import { GemC9 } from './gem-c9';
import { GemHeroNew } from './gem-hero-new';
import { GemHeroOld } from './gem-hero-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['gem-analogy'] = GemAnalogy;
widgetRegistry['gem-c1'] = GemC1;
widgetRegistry['gem-c1-extra'] = GemC1Extra;
widgetRegistry['gem-c10'] = GemC10;
widgetRegistry['gem-c10-extra'] = GemC10Extra;
widgetRegistry['gem-c2'] = GemC2;
widgetRegistry['gem-c3'] = GemC3;
widgetRegistry['gem-c4'] = GemC4;
widgetRegistry['gem-c5'] = GemC5;
widgetRegistry['gem-c6'] = GemC6;
widgetRegistry['gem-c7'] = GemC7;
widgetRegistry['gem-c8'] = GemC8;
widgetRegistry['gem-c9'] = GemC9;
widgetRegistry['gem-hero-new'] = GemHeroNew;
widgetRegistry['gem-hero-old'] = GemHeroOld;
