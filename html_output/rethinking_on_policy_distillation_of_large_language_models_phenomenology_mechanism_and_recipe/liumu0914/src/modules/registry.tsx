import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { OPDColdStart } from './opd-coldstart';
import { OPDCondition } from './opd-condition';
import { OPDFuture } from './opd-future';
import { OPDLength } from './opd-length';
import { OPDNovelty } from './opd-novelty';
import { OPDOverlap } from './opd-overlap';
import { OPDPattern } from './opd-pattern';
import { OPDPrefix } from './opd-prefix';
import { OPDPrompt } from './opd-prompt';
import { OPDResults } from './opd-results';
import { OPDScene } from './opd-scene';
import { OPDSupport } from './opd-support';
import { OPDTopK } from './opd-topk';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['opd-coldstart'] = OPDColdStart;
widgetRegistry['opd-condition'] = OPDCondition;
widgetRegistry['opd-future'] = OPDFuture;
widgetRegistry['opd-length'] = OPDLength;
widgetRegistry['opd-novelty'] = OPDNovelty;
widgetRegistry['opd-overlap'] = OPDOverlap;
widgetRegistry['opd-pattern'] = OPDPattern;
widgetRegistry['opd-prefix'] = OPDPrefix;
widgetRegistry['opd-prompt'] = OPDPrompt;
widgetRegistry['opd-results'] = OPDResults;
widgetRegistry['opd-scene'] = OPDScene;
widgetRegistry['opd-support'] = OPDSupport;
widgetRegistry['opd-topk'] = OPDTopK;
