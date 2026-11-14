import React from 'react';
import { WidgetBudget } from './td-budget';
import { WidgetClusterContrast } from './td-clustering';
import { WidgetConfidenceLedger } from './td-confidence';
import { WidgetConflict } from './td-conflict';
import { WidgetCoverQuestion } from './td-cover-direct';
import { WidgetCoverAnswer } from './td-cover-policy';
import { WidgetExplainDecoupling } from './td-decoupling';
import { WidgetDensity } from './td-density';
import { WidgetDistanceLab } from './td-distance';
import { WidgetHorizons } from './td-horizons';
import { WidgetLearnMixture } from './td-learn-mixture';
import { WidgetRanking } from './td-ranking';
import { WidgetResults } from './td-results';
import { WidgetSameWeights } from './td-same-weights';
import { WidgetExplainScoring } from './td-scoring';
import { WidgetShift } from './td-shift';
import { WidgetTemporalWeights } from './td-temporal';
import { WidgetWindowLab } from './td-window';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['td-budget'] = WidgetBudget;
widgetRegistry['td-clustering'] = WidgetClusterContrast;
widgetRegistry['td-confidence'] = WidgetConfidenceLedger;
widgetRegistry['td-conflict'] = WidgetConflict;
widgetRegistry['td-cover-direct'] = WidgetCoverQuestion;
widgetRegistry['td-cover-policy'] = WidgetCoverAnswer;
widgetRegistry['td-decoupling'] = WidgetExplainDecoupling;
widgetRegistry['td-density'] = WidgetDensity;
widgetRegistry['td-distance'] = WidgetDistanceLab;
widgetRegistry['td-horizons'] = WidgetHorizons;
widgetRegistry['td-learn-mixture'] = WidgetLearnMixture;
widgetRegistry['td-ranking'] = WidgetRanking;
widgetRegistry['td-results'] = WidgetResults;
widgetRegistry['td-same-weights'] = WidgetSameWeights;
widgetRegistry['td-scoring'] = WidgetExplainScoring;
widgetRegistry['td-shift'] = WidgetShift;
widgetRegistry['td-temporal'] = WidgetTemporalWeights;
widgetRegistry['td-window'] = WidgetWindowLab;
