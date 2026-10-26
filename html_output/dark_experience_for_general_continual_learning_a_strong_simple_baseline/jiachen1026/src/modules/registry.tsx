import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DerAnalogy } from './der-analogy';
import { DerC1 } from './der-c1';
import { DerC10 } from './der-c10';
import { DerC10Extra } from './der-c10-extra';
import { DerC2 } from './der-c2';
import { DerC3 } from './der-c3';
import { DerC3Extra } from './der-c3-extra';
import { DerC4 } from './der-c4';
import { DerC5 } from './der-c5';
import { DerC6 } from './der-c6';
import { DerC7 } from './der-c7';
import { DerC8 } from './der-c8';
import { DerC9 } from './der-c9';
import { DerHeroNew } from './der-hero-new';
import { DerHeroOld } from './der-hero-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['der-analogy'] = DerAnalogy;
widgetRegistry['der-c1'] = DerC1;
widgetRegistry['der-c10'] = DerC10;
widgetRegistry['der-c10-extra'] = DerC10Extra;
widgetRegistry['der-c2'] = DerC2;
widgetRegistry['der-c3'] = DerC3;
widgetRegistry['der-c3-extra'] = DerC3Extra;
widgetRegistry['der-c4'] = DerC4;
widgetRegistry['der-c5'] = DerC5;
widgetRegistry['der-c6'] = DerC6;
widgetRegistry['der-c7'] = DerC7;
widgetRegistry['der-c8'] = DerC8;
widgetRegistry['der-c9'] = DerC9;
widgetRegistry['der-hero-new'] = DerHeroNew;
widgetRegistry['der-hero-old'] = DerHeroOld;
