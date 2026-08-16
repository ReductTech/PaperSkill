import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AoContract } from './ao-contract';
import { AttemptMemory } from './attempt-memory';
import { CoordinatorExecutorMap } from './coordinator-executor-map';
import { EvidenceBoundaryMap } from './evidence-boundary-map';
import { HeldoutMergeGate } from './heldout-merge-gate';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { HtrBackpropLab } from './htr-backprop-lab';
import { HtrSixStepCycle } from './htr-six-step-cycle';
import { HypothesisNode } from './hypothesis-node';
import { MetricDirectionBoard } from './metric-direction-board';
import { OrchardScene } from './orchard-scene';
import { PruneRefineDecision } from './prune-refine-decision';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ao-contract'] = AoContract;
widgetRegistry['attempt-memory'] = AttemptMemory;
widgetRegistry['coordinator-executor-map'] = CoordinatorExecutorMap;
widgetRegistry['evidence-boundary-map'] = EvidenceBoundaryMap;
widgetRegistry['heldout-merge-gate'] = HeldoutMergeGate;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['htr-backprop-lab'] = HtrBackpropLab;
widgetRegistry['htr-six-step-cycle'] = HtrSixStepCycle;
widgetRegistry['hypothesis-node'] = HypothesisNode;
widgetRegistry['metric-direction-board'] = MetricDirectionBoard;
widgetRegistry['orchard-scene'] = OrchardScene;
widgetRegistry['prune-refine-decision'] = PruneRefineDecision;
