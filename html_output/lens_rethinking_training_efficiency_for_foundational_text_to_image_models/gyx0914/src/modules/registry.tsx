import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LensInteractive } from './lens-interactive';
import { ResolutionBuckets } from './resolution-buckets';
import { FlowMatchingLab } from './flow-matching-lab';
import { PostTrainingLab } from './post-training-lab';
import { MMDiTExplorer } from './mmdit-explorer';
import { BenchmarkExplorer } from './benchmark-explorer';
import { TurboDistillation } from './turbo-distillation';
import { TeachingIllustration } from './teaching-visuals';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['lens-interactive'] = LensInteractive;
widgetRegistry['resolution-buckets'] = ResolutionBuckets;
widgetRegistry['flow-matching-lab'] = FlowMatchingLab;
widgetRegistry['post-training-lab'] = PostTrainingLab;
widgetRegistry['mmdit-explorer'] = MMDiTExplorer;
widgetRegistry['benchmark-explorer'] = BenchmarkExplorer;
widgetRegistry['turbo-distillation'] = TurboDistillation;
widgetRegistry['teaching-illustration'] = TeachingIllustration;
