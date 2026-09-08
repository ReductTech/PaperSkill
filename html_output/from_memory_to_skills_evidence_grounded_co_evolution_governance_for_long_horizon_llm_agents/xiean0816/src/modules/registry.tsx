import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { BikeAnalogy } from './bike-analogy';
import { EvidenceLab } from './evidence-lab';
import { FoundationLab } from './foundation-lab';
import { GovernanceLab } from './governance-lab';
import { HeroBikeCompare } from './hero-bike-compare';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['bike-analogy'] = BikeAnalogy;
widgetRegistry['evidence-lab'] = EvidenceLab;
widgetRegistry['foundation-lab'] = FoundationLab;
widgetRegistry['governance-lab'] = GovernanceLab;
widgetRegistry['hero-bike-compare'] = HeroBikeCompare;
