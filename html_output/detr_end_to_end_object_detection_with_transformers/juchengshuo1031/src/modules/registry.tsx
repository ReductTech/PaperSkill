import React from 'react';
import { Architecture } from './architecture';
import { BoxLoss } from './boxloss';
import { CoverNew } from './cover-new';
import { CoverOld } from './cover-old';
import { Limitations } from './limitations';
import { LossAblation } from './loss-ablation';
import { Matching } from './matching';
import { Motivation } from './motivation';
import { Objective } from './objective';
import { Queries } from './queries';
import { ResultsComparison } from './results-comparison';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['architecture'] = Architecture;
widgetRegistry['boxloss'] = BoxLoss;
widgetRegistry['cover-new'] = CoverNew;
widgetRegistry['cover-old'] = CoverOld;
widgetRegistry['limitations'] = Limitations;
widgetRegistry['loss-ablation'] = LossAblation;
widgetRegistry['matching'] = Matching;
widgetRegistry['motivation'] = Motivation;
widgetRegistry['objective'] = Objective;
widgetRegistry['queries'] = Queries;
widgetRegistry['results-comparison'] = ResultsComparison;
