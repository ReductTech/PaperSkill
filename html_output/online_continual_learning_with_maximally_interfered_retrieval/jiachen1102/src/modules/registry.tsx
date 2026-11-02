import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { MirAnalogy } from './mir-analogy';
import { MirC1 } from './mir-c1';
import { MirC10 } from './mir-c10';
import { MirC2 } from './mir-c2';
import { MirC3 } from './mir-c3';
import { MirC3Extra } from './mir-c3-extra';
import { MirC4 } from './mir-c4';
import { MirC5 } from './mir-c5';
import { MirC6 } from './mir-c6';
import { MirC7 } from './mir-c7';
import { MirC8 } from './mir-c8';
import { MirC9 } from './mir-c9';
import { MirC9Extra } from './mir-c9-extra';
import { MirHeroNew } from './mir-hero-new';
import { MirHeroOld } from './mir-hero-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['mir-analogy'] = MirAnalogy;
widgetRegistry['mir-c1'] = MirC1;
widgetRegistry['mir-c10'] = MirC10;
widgetRegistry['mir-c2'] = MirC2;
widgetRegistry['mir-c3'] = MirC3;
widgetRegistry['mir-c3-extra'] = MirC3Extra;
widgetRegistry['mir-c4'] = MirC4;
widgetRegistry['mir-c5'] = MirC5;
widgetRegistry['mir-c6'] = MirC6;
widgetRegistry['mir-c7'] = MirC7;
widgetRegistry['mir-c8'] = MirC8;
widgetRegistry['mir-c9'] = MirC9;
widgetRegistry['mir-c9-extra'] = MirC9Extra;
widgetRegistry['mir-hero-new'] = MirHeroNew;
widgetRegistry['mir-hero-old'] = MirHeroOld;
