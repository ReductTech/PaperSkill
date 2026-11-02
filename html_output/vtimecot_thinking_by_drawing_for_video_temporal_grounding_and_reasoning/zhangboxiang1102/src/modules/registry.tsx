import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { VtimeAblation } from './vtime-ablation';
import { VtimeAnalogy } from './vtime-analogy';
import { VtimeCompare } from './vtime-compare';
import { VtimeDual } from './vtime-dual';
import { VtimeFlow } from './vtime-flow';
import { VtimeGrounding } from './vtime-grounding';
import { VtimeHero } from './vtime-hero';
import { VtimeHighlight } from './vtime-highlight';
import { VtimeLoop } from './vtime-loop';
import { VtimeProgress } from './vtime-progress';
import { VtimeQA } from './vtime-qa';
import { VtimeResult } from './vtime-result';
import { VtimeSync } from './vtime-sync';
import { VtimeTask } from './vtime-task';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['vtime-ablation'] = VtimeAblation;
widgetRegistry['vtime-analogy'] = VtimeAnalogy;
widgetRegistry['vtime-compare'] = VtimeCompare;
widgetRegistry['vtime-dual'] = VtimeDual;
widgetRegistry['vtime-flow'] = VtimeFlow;
widgetRegistry['vtime-grounding'] = VtimeGrounding;
widgetRegistry['vtime-hero'] = VtimeHero;
widgetRegistry['vtime-highlight'] = VtimeHighlight;
widgetRegistry['vtime-loop'] = VtimeLoop;
widgetRegistry['vtime-progress'] = VtimeProgress;
widgetRegistry['vtime-qa'] = VtimeQA;
widgetRegistry['vtime-result'] = VtimeResult;
widgetRegistry['vtime-sync'] = VtimeSync;
widgetRegistry['vtime-task'] = VtimeTask;
