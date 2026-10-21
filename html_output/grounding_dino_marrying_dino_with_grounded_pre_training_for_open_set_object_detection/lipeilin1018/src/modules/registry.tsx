import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ablation } from './ablation';
import { Architecture } from './architecture';
import { DecoderStep } from './decoder-step';
import { Fusion } from './fusion';
import { GdAnalogy } from './gd-analogy';
import { GdHeroNew } from './gd-hero-new';
import { GdHeroOld } from './gd-hero-old';
import { GdKit } from './gd-kit';
import { QuerySelection } from './query-selection';
import { RecBoundary } from './rec-boundary';
import { Representations } from './representations';
import { Results } from './results';
import { TaskClosed } from './task-closed';
import { TaskGrounded } from './task-grounded';
import { TextMask } from './text-mask';
import { TrainingBox } from './training-box';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation'] = Ablation;
widgetRegistry['architecture'] = Architecture;
widgetRegistry['decoder-step'] = DecoderStep;
widgetRegistry['fusion'] = Fusion;
widgetRegistry['gd-analogy'] = GdAnalogy;
widgetRegistry['gd-hero-new'] = GdHeroNew;
widgetRegistry['gd-hero-old'] = GdHeroOld;
widgetRegistry['gd-kit'] = GdKit;
widgetRegistry['query-selection'] = QuerySelection;
widgetRegistry['rec-boundary'] = RecBoundary;
widgetRegistry['representations'] = Representations;
widgetRegistry['results'] = Results;
widgetRegistry['task-closed'] = TaskClosed;
widgetRegistry['task-grounded'] = TaskGrounded;
widgetRegistry['text-mask'] = TextMask;
widgetRegistry['training-box'] = TrainingBox;
