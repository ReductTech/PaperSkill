import React from 'react';
import { AnalysisStage } from './analysis-stage';
import { BenchmarkFunnelStage } from './benchmark-funnel-stage';
import { FragmentationCompare } from './fragmentation-compare';
import { MetricBordaLab } from './metric-borda-lab';
import { ModelLandscape } from './model-landscape';
import { MtebSystemMap } from './mteb-system-map';
import { TaskFamilyExplorer } from './task-family-explorer';
import { TakeawayStage } from './takeaway-stage';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['analysis-stage'] = AnalysisStage;
widgetRegistry['benchmark-funnel-stage'] = BenchmarkFunnelStage;
widgetRegistry['fragmentation-compare'] = FragmentationCompare;
widgetRegistry['metric-borda-lab'] = MetricBordaLab;
widgetRegistry['model-landscape'] = ModelLandscape;
widgetRegistry['mteb-system-map'] = MtebSystemMap;
widgetRegistry['task-family-explorer'] = TaskFamilyExplorer;
widgetRegistry['takeaway-stage'] = TakeawayStage;
