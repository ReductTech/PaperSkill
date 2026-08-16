import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HyAnalogy } from './hy-analogy';
import { HyArchitecture } from './hy-architecture';
import { HyBoundaryCompare } from './hy-boundary-compare';
import { HyComposition } from './hy-composition';
import { HyHero } from './hy-hero';
import { HyInputMode } from './hy-input-mode';
import { HyKeyframes } from './hy-keyframes';
import { HyMemory } from './hy-memory';
import { HyPanorama } from './hy-panorama';
import { HyResolution } from './hy-resolution';
import { HyResults } from './hy-results';
import { HyTrainingStages } from './hy-training-stages';
import { HyTrajectory } from './hy-trajectory';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['hy-analogy'] = HyAnalogy;
widgetRegistry['hy-architecture'] = HyArchitecture;
widgetRegistry['hy-boundary-compare'] = HyBoundaryCompare;
widgetRegistry['hy-composition'] = HyComposition;
widgetRegistry['hy-hero'] = HyHero;
widgetRegistry['hy-input-mode'] = HyInputMode;
widgetRegistry['hy-keyframes'] = HyKeyframes;
widgetRegistry['hy-memory'] = HyMemory;
widgetRegistry['hy-panorama'] = HyPanorama;
widgetRegistry['hy-resolution'] = HyResolution;
widgetRegistry['hy-results'] = HyResults;
widgetRegistry['hy-training-stages'] = HyTrainingStages;
widgetRegistry['hy-trajectory'] = HyTrajectory;
