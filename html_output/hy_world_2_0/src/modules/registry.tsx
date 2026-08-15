import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HyAnalogy } from './hy-analogy';
import { HyArchitecture } from './hy-architecture';
import { HyBoundaryCompare } from './hy-boundary-compare';
import { HyComposition } from './hy-composition';
import { HyEvidenceCourt } from './hy-evidence-court';
import { HyHero } from './hy-hero';
import { HyKeyframes } from './hy-keyframes';
import { HyMemory } from './hy-memory';
import { HyMissionPlanner } from './hy-mission-planner';
import { HyModelEvolution } from './hy-model-evolution';
import { HyPanorama } from './hy-panorama';
import { HyResolution } from './hy-resolution';
import { HyTrainingStages } from './hy-training-stages';
import { HyTrajectory } from './hy-trajectory';
import { HyWorldModelBasics } from './hy-world-model-basics';

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
widgetRegistry['hy-evidence-court'] = HyEvidenceCourt;
widgetRegistry['hy-hero'] = HyHero;
widgetRegistry['hy-keyframes'] = HyKeyframes;
widgetRegistry['hy-memory'] = HyMemory;
widgetRegistry['hy-mission-planner'] = HyMissionPlanner;
widgetRegistry['hy-model-evolution'] = HyModelEvolution;
widgetRegistry['hy-panorama'] = HyPanorama;
widgetRegistry['hy-resolution'] = HyResolution;
widgetRegistry['hy-training-stages'] = HyTrainingStages;
widgetRegistry['hy-trajectory'] = HyTrajectory;
widgetRegistry['hy-world-model-basics'] = HyWorldModelBasics;
