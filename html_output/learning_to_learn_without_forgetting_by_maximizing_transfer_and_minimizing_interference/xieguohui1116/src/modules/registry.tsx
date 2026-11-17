import React from 'react';
import { MerAlgorithm } from './mer-algorithm';
import { MerAlpha } from './mer-alpha';
import { MerBaselines } from './mer-baselines';
import { MerBench } from './mer-bench';
import { MerCover } from './mer-cover';
import { MerDot } from './mer-dot';
import { MerLimits } from './mer-limits';
import { MerMetrics } from './mer-metrics';
import { MerReptile } from './mer-reptile';
import { MerReservoir } from './mer-reservoir';
import { MerSequential } from './mer-sequential';
import { MerSharing } from './mer-sharing';
import { MerStationarity } from './mer-stationarity';
import { MerTakeaway } from './mer-takeaway';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['mer-algorithm'] = MerAlgorithm;
widgetRegistry['mer-alpha'] = MerAlpha;
widgetRegistry['mer-baselines'] = MerBaselines;
widgetRegistry['mer-bench'] = MerBench;
widgetRegistry['mer-cover'] = MerCover;
widgetRegistry['mer-dot'] = MerDot;
widgetRegistry['mer-limits'] = MerLimits;
widgetRegistry['mer-metrics'] = MerMetrics;
widgetRegistry['mer-reptile'] = MerReptile;
widgetRegistry['mer-reservoir'] = MerReservoir;
widgetRegistry['mer-sequential'] = MerSequential;
widgetRegistry['mer-sharing'] = MerSharing;
widgetRegistry['mer-stationarity'] = MerStationarity;
widgetRegistry['mer-takeaway'] = MerTakeaway;
