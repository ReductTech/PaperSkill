import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ArchitectureMap } from './architecture-map';
import { ContinuousSpace } from './continuous-space';
import { CostScaling } from './cost-scaling';
import { DomainTransfer } from './domain-transfer';
import { LengthInit } from './length-init';
import { PretrainFit } from './pretrain-fit';
import { PromptEnsemble } from './prompt-ensemble';
import { PromptPlacement } from './prompt-placement';
import { ResultRace } from './result-race';
import { ScaleGap } from './scale-gap';
import { StudioScene } from './studio-scene';
import { TrainingLoop } from './training-loop';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['architecture-map'] = ArchitectureMap;
widgetRegistry['continuous-space'] = ContinuousSpace;
widgetRegistry['cost-scaling'] = CostScaling;
widgetRegistry['domain-transfer'] = DomainTransfer;
widgetRegistry['length-init'] = LengthInit;
widgetRegistry['pretrain-fit'] = PretrainFit;
widgetRegistry['prompt-ensemble'] = PromptEnsemble;
widgetRegistry['prompt-placement'] = PromptPlacement;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['scale-gap'] = ScaleGap;
widgetRegistry['studio-scene'] = StudioScene;
widgetRegistry['training-loop'] = TrainingLoop;
