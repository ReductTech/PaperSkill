import React from 'react';
import { MgAblation } from './mg-ablation';
import { MgCostLimits } from './mg-cost-limits';
import { MgCover } from './mg-cover';
import { MgEpochTurn } from './mg-epoch-turn';
import { MgFuseBeta } from './mg-fuse-beta';
import { MgGapBase } from './mg-gap-base';
import { MgMainResults } from './mg-main-results';
import { MgPipeline } from './mg-pipeline';
import { MgRankBound } from './mg-rank-bound';
import { MgStopRule } from './mg-stop-rule';
import { MgTwoFailures } from './mg-two-failures';
import { MgVisualClf } from './mg-visual-clf';
import { MgZeroshot } from './mg-zeroshot';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['mg-ablation'] = MgAblation;
widgetRegistry['mg-cost-limits'] = MgCostLimits;
widgetRegistry['mg-cover'] = MgCover;
widgetRegistry['mg-epoch-turn'] = MgEpochTurn;
widgetRegistry['mg-fuse-beta'] = MgFuseBeta;
widgetRegistry['mg-gap-base'] = MgGapBase;
widgetRegistry['mg-main-results'] = MgMainResults;
widgetRegistry['mg-pipeline'] = MgPipeline;
widgetRegistry['mg-rank-bound'] = MgRankBound;
widgetRegistry['mg-stop-rule'] = MgStopRule;
widgetRegistry['mg-two-failures'] = MgTwoFailures;
widgetRegistry['mg-visual-clf'] = MgVisualClf;
widgetRegistry['mg-zeroshot'] = MgZeroshot;
