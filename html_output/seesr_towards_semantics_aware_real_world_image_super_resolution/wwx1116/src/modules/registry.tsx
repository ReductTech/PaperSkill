import React from 'react';
import { SeesrAmbiguity } from './seesr-ambiguity';
import { SeesrBoundary } from './seesr-boundary';
import { SeesrCover } from './seesr-cover';
import { SeesrDapeTrain } from './seesr-dape-train';
import { SeesrDegradeTag } from './seesr-degrade-tag';
import { SeesrDualBranch } from './seesr-dual-branch';
import { SeesrLre } from './seesr-lre';
import { SeesrMetricBars } from './seesr-metric-bars';
import { SeesrPromptStyles } from './seesr-prompt-styles';
import { SeesrQualitative } from './seesr-qualitative';
import { SeesrSemanticTable } from './seesr-semantic-table';
import { SeesrThresholdSoft } from './seesr-threshold-soft';
import { SeesrWrongTag } from './seesr-wrong-tag';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['seesr-ambiguity'] = SeesrAmbiguity;
widgetRegistry['seesr-boundary'] = SeesrBoundary;
widgetRegistry['seesr-cover'] = SeesrCover;
widgetRegistry['seesr-dape-train'] = SeesrDapeTrain;
widgetRegistry['seesr-degrade-tag'] = SeesrDegradeTag;
widgetRegistry['seesr-dual-branch'] = SeesrDualBranch;
widgetRegistry['seesr-lre'] = SeesrLre;
widgetRegistry['seesr-metric-bars'] = SeesrMetricBars;
widgetRegistry['seesr-prompt-styles'] = SeesrPromptStyles;
widgetRegistry['seesr-qualitative'] = SeesrQualitative;
widgetRegistry['seesr-semantic-table'] = SeesrSemanticTable;
widgetRegistry['seesr-threshold-soft'] = SeesrThresholdSoft;
widgetRegistry['seesr-wrong-tag'] = SeesrWrongTag;
