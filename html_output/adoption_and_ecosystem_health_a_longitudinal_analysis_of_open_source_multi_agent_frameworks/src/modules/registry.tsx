import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { EcosystemWidget } from './ecosystemWidgets';
import { FrameworkComparison } from './FrameworkComparison';
import { RetentionContextTable } from './RetentionContextTable';

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
widgetRegistry['eco-overview'] = EcosystemWidget;
widgetRegistry['eco-analogy'] = EcosystemWidget;
widgetRegistry['eco-framework-landscape'] = EcosystemWidget;
widgetRegistry['eco-framework-comparison'] = FrameworkComparison;
widgetRegistry['eco-metric-blindspots'] = EcosystemWidget;
widgetRegistry['eco-study-scope'] = EcosystemWidget;
widgetRegistry['eco-layer-lens'] = EcosystemWidget;
widgetRegistry['eco-star-trajectories'] = EcosystemWidget;
widgetRegistry['eco-anomaly-signals'] = EcosystemWidget;
widgetRegistry['eco-adoption-scatter'] = EcosystemWidget;
widgetRegistry['eco-density-ranking'] = EcosystemWidget;
widgetRegistry['eco-cross-network'] = EcosystemWidget;
widgetRegistry['eco-retention-curves'] = EcosystemWidget;
widgetRegistry['eco-retention-context'] = RetentionContextTable;
