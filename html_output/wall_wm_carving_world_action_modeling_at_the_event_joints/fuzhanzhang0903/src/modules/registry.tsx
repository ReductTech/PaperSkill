import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  WmAlignment,
  WmAnalogy,
  WmArchitecture,
  WmCut,
  WmData,
  WmEvent,
  WmFrameworkFusion,
  WmFrameworkOverview,
  WmFrameworkReasoning,
  WmFrameworkWorld,
  WmHeroNew,
  WmHeroOld,
  WmInference,
  WmMultiView,
  WmObjective,
  WmReasoning,
  WmResults,
  WmResultsWins,
  WmSummary,
  WmTraining,
} from './wallWmFormal';

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
widgetRegistry['wm-hero-old'] = WmHeroOld;
widgetRegistry['wm-hero-new'] = WmHeroNew;
widgetRegistry['wm-analogy'] = WmAnalogy;
widgetRegistry['wm-cut'] = WmCut;
widgetRegistry['wm-alignment'] = WmAlignment;
widgetRegistry['wm-event'] = WmEvent;
widgetRegistry['wm-objective'] = WmObjective;
widgetRegistry['wm-reasoning'] = WmReasoning;
widgetRegistry['wm-inference'] = WmInference;
widgetRegistry['wm-training'] = WmTraining;
widgetRegistry['wm-architecture'] = WmArchitecture;
widgetRegistry['wm-framework-overview'] = WmFrameworkOverview;
widgetRegistry['wm-framework-reasoning'] = WmFrameworkReasoning;
widgetRegistry['wm-framework-world'] = WmFrameworkWorld;
widgetRegistry['wm-framework-fusion'] = WmFrameworkFusion;
widgetRegistry['wm-multiview'] = WmMultiView;
widgetRegistry['wm-data'] = WmData;
widgetRegistry['wm-results'] = WmResults;
widgetRegistry['wm-results-wins'] = WmResultsWins;
widgetRegistry['wm-summary'] = WmSummary;
