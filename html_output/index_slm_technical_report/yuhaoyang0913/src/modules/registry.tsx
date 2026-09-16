import React from 'react';
import { ExampleSlider } from './exampleSlider';
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
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { IndexAlignmentModes } from './index-alignment-modes';
import { IndexAutoregressive } from './index-autoregressive';
import { IndexBenchmarkRace } from './index-benchmark-race';
import { IndexDecoderMap } from './index-decoder-map';
import { IndexInstructionAblation } from './index-instruction-ablation';
import { IndexKit } from './index-kit';
import { IndexLoss } from './index-loss';
import { IndexNormHead } from './index-norm-head';
import { IndexRecipe } from './index-recipe';
import { IndexScheduleCompare } from './index-schedule-compare';
import { IndexTokens } from './index-tokens';
import { IndexVersions } from './index-versions';
import { IndexWsdStages } from './index-wsd-stages';
import {
  IndexBenchmarkMap,
  IndexDataPipeline,
  IndexDepthWidth,
  IndexDpoLab,
  IndexEvidenceMap,
  IndexGlossaryPrimer,
  IndexLineage,
  IndexNormHeadV2,
  IndexOptimizerStep,
  IndexRagFlow,
  IndexSftMask,
  IndexSurgeInvestigation,
  IndexWsdDataLab,
} from './index-v2-labs';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
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
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['index-alignment-modes'] = IndexAlignmentModes;
widgetRegistry['index-autoregressive'] = IndexAutoregressive;
widgetRegistry['index-benchmark-race'] = IndexBenchmarkRace;
widgetRegistry['index-decoder-map'] = IndexDecoderMap;
widgetRegistry['index-instruction-ablation'] = IndexInstructionAblation;
widgetRegistry['index-kit'] = IndexKit;
widgetRegistry['index-loss'] = IndexLoss;
widgetRegistry['index-norm-head'] = IndexNormHead;
widgetRegistry['index-recipe'] = IndexRecipe;
widgetRegistry['index-schedule-compare'] = IndexScheduleCompare;
widgetRegistry['index-tokens'] = IndexTokens;
widgetRegistry['index-versions'] = IndexVersions;
widgetRegistry['index-wsd-stages'] = IndexWsdStages;
widgetRegistry['index-lineage'] = IndexLineage;
widgetRegistry['index-depth-width'] = IndexDepthWidth;
widgetRegistry['index-norm-head-v2'] = IndexNormHeadV2;
widgetRegistry['index-optimizer-step'] = IndexOptimizerStep;
widgetRegistry['index-wsd-data-lab'] = IndexWsdDataLab;
widgetRegistry['index-surge-investigation'] = IndexSurgeInvestigation;
widgetRegistry['index-sft-mask'] = IndexSftMask;
widgetRegistry['index-dpo-lab'] = IndexDpoLab;
widgetRegistry['index-rag-flow'] = IndexRagFlow;
widgetRegistry['index-benchmark-map'] = IndexBenchmarkMap;
widgetRegistry['index-evidence-map'] = IndexEvidenceMap;
widgetRegistry['index-data-pipeline'] = IndexDataPipeline;
widgetRegistry['index-glossary-primer'] = IndexGlossaryPrimer;
