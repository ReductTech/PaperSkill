import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { CameraAnalogy } from './camera-analogy';
import { Chap01StabilityClaim } from './chap01-stability-claim';
import { Chap01SynchronizedComparison } from './chap01-synchronized-comparison';
import { Chap02CausalTask } from './chap02-causal-task';
import { Chap03LifetimeSorter } from './chap03-lifetime-sorter';
import { Chap03PathologyInspector } from './chap03-pathology-inspector';
import { Chap04BoundednessTest } from './chap04-boundedness-test';
import { Chap04KernelComposer } from './chap04-kernel-composer';
import { Chap05RetentionSpectrum } from './chap05-retention-spectrum';
import { Chap05StateUpdate } from './chap05-state-update';
import { Chap06HeadGate } from './chap06-head-gate';
import { Chap06RopeAxes } from './chap06-rope-axes';
import { Chap07MetricScale } from './chap07-metric-scale';
import { Chap07PoseFusion } from './chap07-pose-fusion';
import { Chap08LoopClosure } from './chap08-loop-closure';
import { Chap08PipelineHotspots } from './chap08-pipeline-hotspots';
import { Chap09AblationTable } from './chap09-ablation-table';
import { Chap09StreamingEvidence } from './chap09-streaming-evidence';
import { Chap10BoundaryCheck } from './chap10-boundary-check';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['camera-analogy'] = CameraAnalogy;
widgetRegistry['chap01-stability-claim'] = Chap01StabilityClaim;
widgetRegistry['chap01-synchronized-comparison'] = Chap01SynchronizedComparison;
widgetRegistry['chap02-causal-task'] = Chap02CausalTask;
widgetRegistry['chap03-lifetime-sorter'] = Chap03LifetimeSorter;
widgetRegistry['chap03-pathology-inspector'] = Chap03PathologyInspector;
widgetRegistry['chap04-boundedness-test'] = Chap04BoundednessTest;
widgetRegistry['chap04-kernel-composer'] = Chap04KernelComposer;
widgetRegistry['chap05-retention-spectrum'] = Chap05RetentionSpectrum;
widgetRegistry['chap05-state-update'] = Chap05StateUpdate;
widgetRegistry['chap06-head-gate'] = Chap06HeadGate;
widgetRegistry['chap06-rope-axes'] = Chap06RopeAxes;
widgetRegistry['chap07-metric-scale'] = Chap07MetricScale;
widgetRegistry['chap07-pose-fusion'] = Chap07PoseFusion;
widgetRegistry['chap08-loop-closure'] = Chap08LoopClosure;
widgetRegistry['chap08-pipeline-hotspots'] = Chap08PipelineHotspots;
widgetRegistry['chap09-ablation-table'] = Chap09AblationTable;
widgetRegistry['chap09-streaming-evidence'] = Chap09StreamingEvidence;
widgetRegistry['chap10-boundary-check'] = Chap10BoundaryCheck;
