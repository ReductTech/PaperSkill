import React from 'react';
import {
  ScanNetAnalogy, HeroContrast, ScaleExplorer, CaptureExplorer, ReconstructionExplorer,
  AnnotationExplorer, CrowdExplorer, CadExplorer, VoxelExplorer, NetworkExplorer,
  LossExplorer, BenchmarkExplorer, ResultsExplorer,
} from './scanNetWidgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['scannet-analogy'] = ScanNetAnalogy;
widgetRegistry['hero-contrast'] = HeroContrast;
widgetRegistry['scale-explorer'] = ScaleExplorer;
widgetRegistry['capture-explorer'] = CaptureExplorer;
widgetRegistry['reconstruction-explorer'] = ReconstructionExplorer;
widgetRegistry['annotation-explorer'] = AnnotationExplorer;
widgetRegistry['crowd-explorer'] = CrowdExplorer;
widgetRegistry['cad-explorer'] = CadExplorer;
widgetRegistry['voxel-explorer'] = VoxelExplorer;
widgetRegistry['network-explorer'] = NetworkExplorer;
widgetRegistry['loss-explorer'] = LossExplorer;
widgetRegistry['benchmark-explorer'] = BenchmarkExplorer;
widgetRegistry['results-explorer'] = ResultsExplorer;
