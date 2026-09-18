import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AutoSciLab } from './autosci-lab';
import { EvidenceTabs } from './evidence-tabs';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { ResearchBinderAnalogy } from './research-binder';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['autosci-lab'] = AutoSciLab;
widgetRegistry['evidence-tabs'] = EvidenceTabs;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['research-binder'] = ResearchBinderAnalogy;
