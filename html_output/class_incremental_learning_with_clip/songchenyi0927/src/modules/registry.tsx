import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnaPuzzle } from './ana-puzzle';
import { Ch1NeighborStress } from './ch1-neighbor-stress';
import { Ch10NoiseChips } from './ch10-noise-chips';
import { Ch10ResultRace } from './ch10-result-race';
import { Ch2EmbeddingDrag } from './ch2-embedding-drag';
import { Ch3PairStep } from './ch3-pair-step';
import { Ch4HingeMargin } from './ch4-hinge-margin';
import { Ch5GaussianSample } from './ch5-gaussian-sample';
import { Ch6TrainingSteps } from './ch6-training-steps';
import { Ch7FusionModes } from './ch7-fusion-modes';
import { Ch8ArchitectureHotspots } from './ch8-architecture-hotspots';
import { Ch8FusionSteps } from './ch8-fusion-steps';
import { Ch9ThresholdBudget } from './ch9-threshold-budget';
import { HeroRapf } from './hero-rapf';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-puzzle'] = AnaPuzzle;
widgetRegistry['ch1-neighbor-stress'] = Ch1NeighborStress;
widgetRegistry['ch10-noise-chips'] = Ch10NoiseChips;
widgetRegistry['ch10-result-race'] = Ch10ResultRace;
widgetRegistry['ch2-embedding-drag'] = Ch2EmbeddingDrag;
widgetRegistry['ch3-pair-step'] = Ch3PairStep;
widgetRegistry['ch4-hinge-margin'] = Ch4HingeMargin;
widgetRegistry['ch5-gaussian-sample'] = Ch5GaussianSample;
widgetRegistry['ch6-training-steps'] = Ch6TrainingSteps;
widgetRegistry['ch7-fusion-modes'] = Ch7FusionModes;
widgetRegistry['ch8-architecture-hotspots'] = Ch8ArchitectureHotspots;
widgetRegistry['ch8-fusion-steps'] = Ch8FusionSteps;
widgetRegistry['ch9-threshold-budget'] = Ch9ThresholdBudget;
widgetRegistry['hero-rapf'] = HeroRapf;
