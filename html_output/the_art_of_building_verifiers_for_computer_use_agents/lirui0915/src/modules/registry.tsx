import { ExperimentProtocol, ExperimentResults } from './experiments-results';
import { BackgroundAnalogy, BackgroundMethods, BackgroundResearch } from './background-introduction';
import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AblationCompare } from './ablation-compare';
import { Analogy1 } from './analogy-1';
import { Analogy10 } from './analogy-10';
import { Analogy2 } from './analogy-2';
import { Analogy3 } from './analogy-3';
import { Analogy4 } from './analogy-4';
import { Analogy5 } from './analogy-5';
import { Analogy6 } from './analogy-6';
import { Analogy7 } from './analogy-7';
import { Analogy8 } from './analogy-8';
import { Analogy9 } from './analogy-9';
import { BenchmarkRace } from './benchmark-race';
import { CascadeTrace } from './cascade-trace';
import { ConditionalScore } from './conditional-score';
import { CostBudget } from './cost-budget';
import { EvidenceCompare } from './evidence-compare';
import { EvidenceTaxonomy } from './evidence-taxonomy';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { ProcessOutcome } from './process-outcome';
import { RubricRepair } from './rubric-repair';
import { ScreenshotSelect } from './screenshot-select';
import { SideEffects } from './side-effects';
import { VerifierPipeline } from './verifier-pipeline';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation-compare'] = AblationCompare;
widgetRegistry['analogy-1'] = Analogy1;
widgetRegistry['analogy-10'] = Analogy10;
widgetRegistry['analogy-2'] = Analogy2;
widgetRegistry['analogy-3'] = Analogy3;
widgetRegistry['analogy-4'] = Analogy4;
widgetRegistry['analogy-5'] = Analogy5;
widgetRegistry['analogy-6'] = Analogy6;
widgetRegistry['analogy-7'] = Analogy7;
widgetRegistry['analogy-8'] = Analogy8;
widgetRegistry['analogy-9'] = Analogy9;
widgetRegistry['benchmark-race'] = BenchmarkRace;
widgetRegistry['cascade-trace'] = CascadeTrace;
widgetRegistry['conditional-score'] = ConditionalScore;
widgetRegistry['cost-budget'] = CostBudget;
widgetRegistry['evidence-compare'] = EvidenceCompare;
widgetRegistry['evidence-taxonomy'] = EvidenceTaxonomy;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['process-outcome'] = ProcessOutcome;
widgetRegistry['rubric-repair'] = RubricRepair;
widgetRegistry['screenshot-select'] = ScreenshotSelect;
widgetRegistry['side-effects'] = SideEffects;
widgetRegistry['verifier-pipeline'] = VerifierPipeline;

widgetRegistry['background-analogy'] = BackgroundAnalogy;
widgetRegistry['background-methods'] = BackgroundMethods;
widgetRegistry['background-research'] = BackgroundResearch;

widgetRegistry['experiment-protocol'] = ExperimentProtocol;
widgetRegistry['experiment-results'] = ExperimentResults;
