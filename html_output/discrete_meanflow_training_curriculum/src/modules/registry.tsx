import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DmfAnalogy } from './dmf-analogy';
import { DmfHero } from './dmf-hero';
import { DmfModule } from './dmf-module';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['dmf-analogy'] = DmfAnalogy;
widgetRegistry['dmf-hero'] = DmfHero;
widgetRegistry['dmf-module'] = DmfModule;
