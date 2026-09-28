import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ana1 } from './ana-1';
import { Ana2 } from './ana-2';
import { Ana3 } from './ana-3';
import { Ana8 } from './ana-8';
import { Ana9 } from './ana-9';
import { Ana10 } from './ana-10';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M11 } from './m-1-1';
import { M12 } from './m-1-2';
import { M21 } from './m-2-1';
import { M41 } from './m-4-1';
import { M51 } from './m-5-1';
import { M52 } from './m-5-2';
import { M61 } from './m-6-1';
import { M71 } from './m-7-1';
import { M91 } from './m-9-1';
import { M101 } from './m-10-1';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-8'] = Ana8;
widgetRegistry['ana-9'] = Ana9;
widgetRegistry['ana-10'] = Ana10;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m-1-1'] = M11;
widgetRegistry['m-1-2'] = M12;
widgetRegistry['m-2-1'] = M21;
widgetRegistry['m-4-1'] = M41;
widgetRegistry['m-5-1'] = M51;
widgetRegistry['m-5-2'] = M52;
widgetRegistry['m-6-1'] = M61;
widgetRegistry['m-7-1'] = M71;
widgetRegistry['m-9-1'] = M91;
widgetRegistry['m-10-1'] = M101;
