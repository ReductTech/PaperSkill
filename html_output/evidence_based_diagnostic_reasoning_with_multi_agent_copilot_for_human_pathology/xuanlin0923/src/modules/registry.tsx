import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogySceneA } from './analogy-scene-a';
import { AnalogySceneB } from './analogy-scene-b';
import { HeroScan } from './hero-scan';
import { M1Coverage } from './m1-coverage';
import { M10ResultRace } from './m10-result-race';
import { M2ZoomInset } from './m2-zoom-inset';
import { M3RouteCompare } from './m3-route-compare';
import { M4BudgetSplit } from './m4-budget-split';
import { M4StopThreshold } from './m4-stop-threshold';
import { M5Conditions } from './m5-conditions';
import { M6CaseTrace } from './m6-case-trace';
import { M7TwoStageTraining } from './m7-two-stage-training';
import { M8SystemMap } from './m8-system-map';
import { M9ConfidenceTriage } from './m9-confidence-triage';
import { VizKit } from './viz-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene-a'] = AnalogySceneA;
widgetRegistry['analogy-scene-b'] = AnalogySceneB;
widgetRegistry['hero-scan'] = HeroScan;
widgetRegistry['m1-coverage'] = M1Coverage;
widgetRegistry['m10-result-race'] = M10ResultRace;
widgetRegistry['m2-zoom-inset'] = M2ZoomInset;
widgetRegistry['m3-route-compare'] = M3RouteCompare;
widgetRegistry['m4-budget-split'] = M4BudgetSplit;
widgetRegistry['m4-stop-threshold'] = M4StopThreshold;
widgetRegistry['m5-conditions'] = M5Conditions;
widgetRegistry['m6-case-trace'] = M6CaseTrace;
widgetRegistry['m7-two-stage-training'] = M7TwoStageTraining;
widgetRegistry['m8-system-map'] = M8SystemMap;
widgetRegistry['m9-confidence-triage'] = M9ConfidenceTriage;
widgetRegistry['viz-kit'] = VizKit;
