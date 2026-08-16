import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AgenticDataMap } from './agentic-data-map';
import { ArchitectureMap } from './architecture-map';
import { BenchmarkRace } from './benchmark-race';
import { CapabilityScope } from './capability-scope';
import { CascadeVsUnified } from './cascade-vs-unified';
import { ChaosInspector } from './chaos-inspector';
import { DflashStepper } from './dflash-stepper';
import { DeploymentBoundaryLab } from './deployment-boundary-lab';
import { DraftWeightCurve } from './draft-weight-curve';
import { FinalBoundarySummary } from './final-boundary-summary';
import { HeroRestoration } from './hero-restoration';
import { MotivationLab } from './motivation-lab';
import { NativeResolutionLens } from './native-resolution-lens';
import { RestorationAnalogy } from './restoration-analogy';
import { RewardRouter } from './reward-router';
import { TrainingStageStepper } from './training-stage-stepper';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['agentic-data-map'] = AgenticDataMap;
widgetRegistry['architecture-map'] = ArchitectureMap;
widgetRegistry['benchmark-race'] = BenchmarkRace;
widgetRegistry['capability-scope'] = CapabilityScope;
widgetRegistry['cascade-vs-unified'] = CascadeVsUnified;
widgetRegistry['chaos-inspector'] = ChaosInspector;
widgetRegistry['dflash-stepper'] = DflashStepper;
widgetRegistry['deployment-boundary-lab'] = DeploymentBoundaryLab;
widgetRegistry['draft-weight-curve'] = DraftWeightCurve;
widgetRegistry['final-boundary-summary'] = FinalBoundarySummary;
widgetRegistry['hero-restoration'] = HeroRestoration;
widgetRegistry['motivation-lab'] = MotivationLab;
widgetRegistry['native-resolution-lens'] = NativeResolutionLens;
widgetRegistry['restoration-analogy'] = RestorationAnalogy;
widgetRegistry['reward-router'] = RewardRouter;
widgetRegistry['training-stage-stepper'] = TrainingStageStepper;
