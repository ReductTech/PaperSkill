import React from 'react';
import { ExampleSlider } from './exampleSlider';

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
