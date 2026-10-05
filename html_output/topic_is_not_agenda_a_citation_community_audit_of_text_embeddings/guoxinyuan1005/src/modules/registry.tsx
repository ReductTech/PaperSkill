import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ana1 } from './ana-1';
import { Ana2 } from './ana-2';
import { Ana3 } from './ana-3';
import { Ana4 } from './ana-4';
import { Ana5 } from './ana-5';
import { Ana6 } from './ana-6';
import { Ana7 } from './ana-7';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M11 } from './m-1-1';
import { M12 } from './m-1-2';
import { M21 } from './m-2-1';
import { M31 } from './m-3-1';
import { M32 } from './m-3-2';
import { M41 } from './m-4-1';
import { M51 } from './m-5-1';
import { M52 } from './m-5-2';
import { M61 } from './m-6-1';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['ana-7'] = Ana7;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m-1-1'] = M11;
widgetRegistry['m-1-2'] = M12;
widgetRegistry['m-2-1'] = M21;
widgetRegistry['m-3-1'] = M31;
widgetRegistry['m-3-2'] = M32;
widgetRegistry['m-4-1'] = M41;
widgetRegistry['m-5-1'] = M51;
widgetRegistry['m-5-2'] = M52;
widgetRegistry['m-6-1'] = M61;
