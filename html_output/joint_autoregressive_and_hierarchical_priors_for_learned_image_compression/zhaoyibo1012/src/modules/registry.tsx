import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyScene } from './analogy-scene';
import { HeroSide } from './hero-side';
import { Mod11 } from './mod-1-1';
import { Mod12 } from './mod-1-2';
import { Mod101 } from './mod-10-1';
import { Mod21 } from './mod-2-1';
import { Mod31 } from './mod-3-1';
import { Mod41 } from './mod-4-1';
import { Mod51 } from './mod-5-1';
import { Mod61 } from './mod-6-1';
import { Mod71 } from './mod-7-1';
import { Mod81 } from './mod-8-1';
import { Mod91 } from './mod-9-1';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['hero-side'] = HeroSide;
widgetRegistry['mod-1-1'] = Mod11;
widgetRegistry['mod-1-2'] = Mod12;
widgetRegistry['mod-10-1'] = Mod101;
widgetRegistry['mod-2-1'] = Mod21;
widgetRegistry['mod-3-1'] = Mod31;
widgetRegistry['mod-4-1'] = Mod41;
widgetRegistry['mod-5-1'] = Mod51;
widgetRegistry['mod-6-1'] = Mod61;
widgetRegistry['mod-7-1'] = Mod71;
widgetRegistry['mod-8-1'] = Mod81;
widgetRegistry['mod-9-1'] = Mod91;
