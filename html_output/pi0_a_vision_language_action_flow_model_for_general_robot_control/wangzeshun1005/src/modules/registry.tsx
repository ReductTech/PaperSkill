import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ana1 } from './ana1';
import { Ana2 } from './ana2';
import { Ana3 } from './ana3';
import { Ana4 } from './ana4';
import { Ana5 } from './ana5';
import { Ana6 } from './ana6';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M11 } from './m11';
import { M21 } from './m21';
import { M31 } from './m31';
import { M32 } from './m32';
import { M41 } from './m41';
import { M51 } from './m51';
import { M61 } from './m61';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana1'] = Ana1;
widgetRegistry['ana2'] = Ana2;
widgetRegistry['ana3'] = Ana3;
widgetRegistry['ana4'] = Ana4;
widgetRegistry['ana5'] = Ana5;
widgetRegistry['ana6'] = Ana6;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m11'] = M11;
widgetRegistry['m21'] = M21;
widgetRegistry['m31'] = M31;
widgetRegistry['m32'] = M32;
widgetRegistry['m41'] = M41;
widgetRegistry['m51'] = M51;
widgetRegistry['m61'] = M61;
