import React from 'react';
import { TadsrAblation } from './tadsr-ablation';
import { TadsrArch } from './tadsr-arch';
import { TadsrBlur } from './tadsr-blur';
import { TadsrCover } from './tadsr-cover';
import { TadsrEfficiency } from './tadsr-efficiency';
import { TadsrFixedVsTimeaware } from './tadsr-fixed-vs-timeaware';
import { TadsrLimit } from './tadsr-limit';
import { TadsrResidual } from './tadsr-residual';
import { TadsrResults } from './tadsr-results';
import { TadsrTPrior } from './tadsr-t-prior';
import { TadsrTae } from './tadsr-tae';
import { TadsrTavsd } from './tadsr-tavsd';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['tadsr-ablation'] = TadsrAblation;
widgetRegistry['tadsr-arch'] = TadsrArch;
widgetRegistry['tadsr-blur'] = TadsrBlur;
widgetRegistry['tadsr-cover'] = TadsrCover;
widgetRegistry['tadsr-efficiency'] = TadsrEfficiency;
widgetRegistry['tadsr-fixed-vs-timeaware'] = TadsrFixedVsTimeaware;
widgetRegistry['tadsr-limit'] = TadsrLimit;
widgetRegistry['tadsr-residual'] = TadsrResidual;
widgetRegistry['tadsr-results'] = TadsrResults;
widgetRegistry['tadsr-t-prior'] = TadsrTPrior;
widgetRegistry['tadsr-tae'] = TadsrTae;
widgetRegistry['tadsr-tavsd'] = TadsrTavsd;
