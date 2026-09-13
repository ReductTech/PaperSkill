import React from 'react';
import { HeroOld } from './heroOld';
import { HeroNew } from './heroNew';
import { Ana1 } from './ana1';
import { Ana2 } from './ana2';
import { Ana3 } from './ana3';
import { Ana4 } from './ana4';
import { Ana5 } from './ana5';
import { Ana6 } from './ana6';
import { Ana7 } from './ana7';
import { Ana8 } from './ana8';
import { Ana9 } from './ana9';
import { Ana10 } from './ana10';
import { Mod1_1 } from './mod1_1';
import { Mod2_1 } from './mod2_1';
import { Mod3_1 } from './mod3_1';
import { Mod4_1 } from './mod4_1';
import { Mod4_2 } from './mod4_2';
import { Mod5_1 } from './mod5_1';
import { Mod6_1 } from './mod6_1';
import { Mod7_1 } from './mod7_1';
import { Mod8_1 } from './mod8_1';
import { Mod9_1 } from './mod9_1';
import { Mod10_1 } from './mod10_1';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Hero
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;

// Analogy animations (10 chapters)
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['ana-7'] = Ana7;
widgetRegistry['ana-8'] = Ana8;
widgetRegistry['ana-9'] = Ana9;
widgetRegistry['ana-10'] = Ana10;

// Interactive modules
widgetRegistry['mod-1-1'] = Mod1_1;
widgetRegistry['mod-2-1'] = Mod2_1;
widgetRegistry['mod-3-1'] = Mod3_1;
widgetRegistry['mod-4-1'] = Mod4_1;
widgetRegistry['mod-4-2'] = Mod4_2;
widgetRegistry['mod-5-1'] = Mod5_1;
widgetRegistry['mod-6-1'] = Mod6_1;
widgetRegistry['mod-7-1'] = Mod7_1;
widgetRegistry['mod-8-1'] = Mod8_1;
widgetRegistry['mod-9-1'] = Mod9_1;
widgetRegistry['mod-10-1'] = Mod10_1;
