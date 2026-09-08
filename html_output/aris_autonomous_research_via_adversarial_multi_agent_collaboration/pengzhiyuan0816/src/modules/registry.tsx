import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  AnalogyNotebook,
  AuditCascade,
  ClaimEvidenceMatcher,
  HarnessTriad,
  HeroNew,
  HeroOld,
  LayerMap,
  LimitSwitch,
  ResponsibilitySorter,
  ReviewModeSwitch,
  RiskLens,
  RunCase,
  WorkflowTimeline,
} from './arisWidgets';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. The generator ADDS entries here for every paper-specific canvas
// widget (hero sides, analogy animations, and interactive modules). A missing id
// renders a graceful placeholder, so the app never crashes on an unfinished id.
//
// Pattern to add a widget:
//   import { Ch1Mod1 } from './ch1mod1';
//   widgetRegistry['ch1mod1'] = Ch1Mod1;
// and create src/modules/ch1mod1.tsx exporting a component of type React.FC<WidgetProps>.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Example kept so the scaffold runs out-of-the-box. Replace/extend as needed.
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['analogy-notebook'] = AnalogyNotebook;
widgetRegistry['risk-lens'] = RiskLens;
widgetRegistry['review-mode-switch'] = ReviewModeSwitch;
widgetRegistry['harness-triad'] = HarnessTriad;
widgetRegistry['layer-map'] = LayerMap;
widgetRegistry['responsibility-sorter'] = ResponsibilitySorter;
widgetRegistry['workflow-timeline'] = WorkflowTimeline;
widgetRegistry['audit-cascade'] = AuditCascade;
widgetRegistry['claim-evidence-matcher'] = ClaimEvidenceMatcher;
widgetRegistry['run-case'] = RunCase;
widgetRegistry['limit-switch'] = LimitSwitch;
