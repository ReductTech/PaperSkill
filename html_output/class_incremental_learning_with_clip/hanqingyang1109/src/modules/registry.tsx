import React from 'react';
import { RapfAblation } from './rapf-ablation';
import { RapfBasis } from './rapf-basis';
import { RapfCover } from './rapf-cover';
import { RapfFusion } from './rapf-fusion';
import { RapfGaussian } from './rapf-gaussian';
import { RapfHinge } from './rapf-hinge';
import { RapfLimits } from './rapf-limits';
import { RapfPairMatrix } from './rapf-pairmatrix';
import { RapfRack } from './rapf-rack';
import { RapfResults } from './rapf-results';
import { RapfSamplePush } from './rapf-samplepush';
import { RapfSoftMask } from './rapf-softmask';
import { RapfTextDistance } from './rapf-textdistance';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['rapf-ablation'] = RapfAblation;
widgetRegistry['rapf-basis'] = RapfBasis;
widgetRegistry['rapf-cover'] = RapfCover;
widgetRegistry['rapf-fusion'] = RapfFusion;
widgetRegistry['rapf-gaussian'] = RapfGaussian;
widgetRegistry['rapf-hinge'] = RapfHinge;
widgetRegistry['rapf-limits'] = RapfLimits;
widgetRegistry['rapf-pairmatrix'] = RapfPairMatrix;
widgetRegistry['rapf-rack'] = RapfRack;
widgetRegistry['rapf-results'] = RapfResults;
widgetRegistry['rapf-samplepush'] = RapfSamplePush;
widgetRegistry['rapf-softmask'] = RapfSoftMask;
widgetRegistry['rapf-textdistance'] = RapfTextDistance;
