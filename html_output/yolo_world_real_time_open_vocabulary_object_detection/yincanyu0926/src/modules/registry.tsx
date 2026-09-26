import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { WidgetAblation } from './ablation';
import { WidgetAnalogy } from './analogy';
import { WidgetAttention } from './attention';
import { WidgetAudit } from './audit';
import { WidgetBudget } from './budget';
import { WidgetCache } from './cache';
import { WidgetCosine } from './cosine';
import { WidgetGate } from './gate';
import { WidgetHeroNew } from './hero-new';
import { WidgetHeroOld } from './hero-old';
import { BirdKit } from './kit';
import { LabsRoot } from './labs';
import { WidgetLoss } from './loss';
import { WidgetNetwork } from './network';
import { WidgetPool } from './pool';
import { WidgetQuiz } from './quiz';
import { WidgetReparam } from './reparam';
import { WidgetResults } from './results';
import { WidgetTransfer } from './transfer';
import { WidgetVocab } from './vocab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation'] = WidgetAblation;
widgetRegistry['analogy'] = WidgetAnalogy;
widgetRegistry['attention'] = WidgetAttention;
widgetRegistry['audit'] = WidgetAudit;
widgetRegistry['budget'] = WidgetBudget;
widgetRegistry['cache'] = WidgetCache;
widgetRegistry['cosine'] = WidgetCosine;
widgetRegistry['gate'] = WidgetGate;
widgetRegistry['hero-new'] = WidgetHeroNew;
widgetRegistry['hero-old'] = WidgetHeroOld;
widgetRegistry['kit'] = BirdKit;
widgetRegistry['labs'] = LabsRoot;
widgetRegistry['loss'] = WidgetLoss;
widgetRegistry['network'] = WidgetNetwork;
widgetRegistry['pool'] = WidgetPool;
widgetRegistry['quiz'] = WidgetQuiz;
widgetRegistry['reparam'] = WidgetReparam;
widgetRegistry['results'] = WidgetResults;
widgetRegistry['transfer'] = WidgetTransfer;
widgetRegistry['vocab'] = WidgetVocab;

import {VocabularyBatch,ScoreThreshold,ModelChoice} from './extra-labs';
widgetRegistry['vocabulary-batch']=VocabularyBatch;
widgetRegistry['score-threshold']=ScoreThreshold;
widgetRegistry['model-choice']=ModelChoice;
