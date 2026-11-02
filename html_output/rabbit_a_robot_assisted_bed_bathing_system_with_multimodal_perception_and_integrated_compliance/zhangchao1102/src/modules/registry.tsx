import React from 'react';
import { RabbitBenchmark } from './rabbit-benchmark';
import { RabbitController } from './rabbit-controller';
import { CoverNew } from './rabbit-cover-new';
import { CoverOld } from './rabbit-cover-old';
import { RabbitDataset } from './rabbit-dataset';
import { RabbitFusion } from './rabbit-fusion';
import { RabbitLimits } from './rabbit-limits';
import { RabbitMotion } from './rabbit-motion';
import { RabbitScrubby } from './rabbit-scrubby';
import { RabbitSra } from './rabbit-sra';
import { RabbitStudy } from './rabbit-study';
import { RabbitTask } from './rabbit-task';
import { RabbitThermal } from './rabbit-thermal';
import { RabbitWaypoints } from './rabbit-waypoints';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['rabbit-benchmark'] = RabbitBenchmark;
widgetRegistry['rabbit-controller'] = RabbitController;
widgetRegistry['rabbit-cover-new'] = CoverNew;
widgetRegistry['rabbit-cover-old'] = CoverOld;
widgetRegistry['rabbit-dataset'] = RabbitDataset;
widgetRegistry['rabbit-fusion'] = RabbitFusion;
widgetRegistry['rabbit-limits'] = RabbitLimits;
widgetRegistry['rabbit-motion'] = RabbitMotion;
widgetRegistry['rabbit-scrubby'] = RabbitScrubby;
widgetRegistry['rabbit-sra'] = RabbitSra;
widgetRegistry['rabbit-study'] = RabbitStudy;
widgetRegistry['rabbit-task'] = RabbitTask;
widgetRegistry['rabbit-thermal'] = RabbitThermal;
widgetRegistry['rabbit-waypoints'] = RabbitWaypoints;
