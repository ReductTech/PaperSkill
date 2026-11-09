import React from 'react';
import { ClosedFormDerive } from './closedform-derive';
import { ConflictDist } from './conflict-dist';
import { CoverShelf } from './cover-shelf';
import { MotiveCurve } from './motive-curve';
import { PipelineSteps } from './pipeline-steps';
import { ResultsLimits } from './results-limits';
import { SourceBase } from './source-base';
import { Summary } from './summary';
import { TransferSets } from './transfer-sets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-old'] = CoverShelf;
widgetRegistry['cover-new'] = CoverShelf;
widgetRegistry['motive-curve'] = MotiveCurve;
widgetRegistry['conflict-dist'] = ConflictDist;
widgetRegistry['pipeline-steps'] = PipelineSteps;
widgetRegistry['transfer-sets'] = TransferSets;
widgetRegistry['closedform-derive'] = ClosedFormDerive;
widgetRegistry['source-base'] = SourceBase;
widgetRegistry['results-limits'] = ResultsLimits;
widgetRegistry['summary'] = Summary;
