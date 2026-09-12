import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DegradationInspector } from './degradationInspector';
import { MultiLabelEncoder } from './multiLabelEncoder';
import { DecouplingDemo } from './decouplingDemo';
import { FDPMDetector } from './fdpmDetector';
import { CDMMRouter } from './cdmmRouter';
import { CDCBProcessor } from './cdcbProcessor';
import { TrainingMonitor } from './trainingMonitor';
import { ArchitectureExplorer } from './architectureExplorer';
import { DCMoERouter } from './dcmoeRouter';
import { AugmentationDemo } from './augmentationDemo';
import { ResultComparison } from './resultComparison';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. The generator ADDS entries here for every paper-specific canvas
// widget (hero sides, analogy animations, and interactive modules).

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Example kept so the scaffold runs out-of-the-box
widgetRegistry['example-slider'] = ExampleSlider;

// DAME-Net tutorial widgets
widgetRegistry['degradation-inspector'] = DegradationInspector;
widgetRegistry['multi-label-encoder'] = MultiLabelEncoder;
widgetRegistry['decoupling-demo'] = DecouplingDemo;
widgetRegistry['fdpm-detector'] = FDPMDetector;
widgetRegistry['cdmm-router'] = CDMMRouter;
widgetRegistry['cdcb-processor'] = CDCBProcessor;
widgetRegistry['training-monitor'] = TrainingMonitor;
widgetRegistry['architecture-explorer'] = ArchitectureExplorer;
widgetRegistry['dcmoe-router'] = DCMoERouter;
widgetRegistry['augmentation-demo'] = AugmentationDemo;
widgetRegistry['result-comparison'] = ResultComparison;
