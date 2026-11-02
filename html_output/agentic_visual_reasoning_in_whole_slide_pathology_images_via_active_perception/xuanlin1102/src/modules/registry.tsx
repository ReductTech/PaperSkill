import React from 'react';
import { AdaptivePathCover } from './adaptivepath-cover';
import { ThumbnailLimit } from './ch1-thumbnail-limit';
import { BudgetTopK } from './ch2-budget-topk';
import { FocusLoop } from './ch2-focus-loop';
import { Phase1Reward } from './ch3-phase1-reward';
import { Phase2Consistency } from './ch3-phase2-consistency';
import { MultiScale } from './ch4-multiscale';
import { Arbiter } from './ch5-arbiter';
import { OptionAudit } from './ch5-option-audit';
import { ReaderFigure } from './ch6-reader-figure';
import { ResultsChart } from './ch6-results-chart';
import { EvidenceBoundary } from './ch7-evidence-boundary';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['adaptivepath-cover'] = AdaptivePathCover;
widgetRegistry['ch1-thumbnail-limit'] = ThumbnailLimit;
widgetRegistry['ch2-budget-topk'] = BudgetTopK;
widgetRegistry['ch2-focus-loop'] = FocusLoop;
widgetRegistry['ch3-phase1-reward'] = Phase1Reward;
widgetRegistry['ch3-phase2-consistency'] = Phase2Consistency;
widgetRegistry['ch4-multiscale'] = MultiScale;
widgetRegistry['ch5-arbiter'] = Arbiter;
widgetRegistry['ch5-option-audit'] = OptionAudit;
widgetRegistry['ch6-reader-figure'] = ReaderFigure;
widgetRegistry['ch6-results-chart'] = ResultsChart;
widgetRegistry['ch7-evidence-boundary'] = EvidenceBoundary;
