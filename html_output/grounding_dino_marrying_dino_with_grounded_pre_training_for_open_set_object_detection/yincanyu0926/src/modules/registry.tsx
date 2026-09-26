import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { WidgetArchitecture } from './architecture';
import { WidgetBirdHeroNew } from './bird-hero-new';
import { WidgetBirdHeroOld } from './bird-hero-old';
import { BirdKit } from './bird-kit';
import { WidgetBirdScene } from './bird-scene';
import { WidgetDecoder } from './decoder';
import { WidgetEnhancer } from './enhancer';
import { WidgetMask } from './mask';
import { WidgetMatching } from './matching';
import { WidgetMixed } from './mixed';
import { WidgetPrompt } from './prompt';
import { WidgetQuery } from './query';
import { WidgetQuiz } from './quiz';
import { WidgetResults } from './results';
import { WidgetTask } from './task';
import { WidgetTransfer } from './transfer';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['architecture'] = WidgetArchitecture;
widgetRegistry['bird-hero-new'] = WidgetBirdHeroNew;
widgetRegistry['bird-hero-old'] = WidgetBirdHeroOld;
widgetRegistry['bird-kit'] = BirdKit;
widgetRegistry['bird-scene'] = WidgetBirdScene;
widgetRegistry['decoder'] = WidgetDecoder;
widgetRegistry['enhancer'] = WidgetEnhancer;
widgetRegistry['mask'] = WidgetMask;
widgetRegistry['matching'] = WidgetMatching;
widgetRegistry['mixed'] = WidgetMixed;
widgetRegistry['prompt'] = WidgetPrompt;
widgetRegistry['query'] = WidgetQuery;
widgetRegistry['quiz'] = WidgetQuiz;
widgetRegistry['results'] = WidgetResults;
widgetRegistry['task'] = WidgetTask;
widgetRegistry['transfer'] = WidgetTransfer;

import {AttentionLab, QueryLab, MaskLab, BoxLab, MatchingLab, AblationLab, PhraseLab} from './research-labs';
widgetRegistry['attention-lab']=AttentionLab;
widgetRegistry['query']=QueryLab;
widgetRegistry['mask']=MaskLab;
widgetRegistry['box-lab']=BoxLab;
widgetRegistry['matching']=MatchingLab;
widgetRegistry['ablation-lab']=AblationLab;
widgetRegistry['prompt']=PhraseLab;

import {MixedLab, LossLab} from './research-labs';
widgetRegistry['mixed']=MixedLab;
widgetRegistry['loss-lab']=LossLab;
