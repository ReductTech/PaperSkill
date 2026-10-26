import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DestAblation } from './dest-ablation';
import { DestAnalogy } from './dest-analogy';
import { DestBranches } from './dest-branches';
import { DestCoupling } from './dest-coupling';
import { DestDsti } from './dest-dsti';
import { DestHero } from './dest-hero';
import { DestJtm } from './dest-jtm';
import { DestLoss } from './dest-loss';
import { DestResults } from './dest-results';
import { DestTask } from './dest-task';
import { DestTime } from './dest-time';
import { DestMetrics } from './dest-metrics';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['dest-ablation'] = DestAblation;
widgetRegistry['dest-analogy'] = DestAnalogy;
widgetRegistry['dest-branches'] = DestBranches;
widgetRegistry['dest-coupling'] = DestCoupling;
widgetRegistry['dest-dsti'] = DestDsti;
widgetRegistry['dest-hero'] = DestHero;
widgetRegistry['dest-jtm'] = DestJtm;
widgetRegistry['dest-loss'] = DestLoss;
widgetRegistry['dest-results'] = DestResults;
widgetRegistry['dest-task'] = DestTask;
widgetRegistry['dest-time'] = DestTime;
widgetRegistry['dest-metrics'] = DestMetrics;
