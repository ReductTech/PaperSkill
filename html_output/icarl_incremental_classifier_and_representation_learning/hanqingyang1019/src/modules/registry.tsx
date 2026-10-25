import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { C1Drift } from './c1drift';
import { C1Criteria } from './c1criteria';
import { C2Feature } from './c2feature';
import { C3Coupled } from './c3coupled';
import { C4Prototype } from './c4prototype';
import { C5Distill } from './c5distill';
import { C6Pipeline } from './c6pipeline';
import { C7Loss } from './c7loss';
import { C8Arch } from './c8arch';
import { C9Herding } from './c9herding';
import { C9Budget } from './c9budget';
import { C10Race } from './c10race';
import { C10Ablation } from './c10ablation';
import { GardenAnalogy } from './gardenAnalogy';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Every paper-specific Canvas widget is registered here.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['c1-drift'] = C1Drift;
widgetRegistry['c1-criteria'] = C1Criteria;
widgetRegistry['c2-feature'] = C2Feature;
widgetRegistry['c3-coupled'] = C3Coupled;
widgetRegistry['c4-prototype'] = C4Prototype;
widgetRegistry['c5-distill'] = C5Distill;
widgetRegistry['c6-pipeline'] = C6Pipeline;
widgetRegistry['c7-loss'] = C7Loss;
widgetRegistry['c8-arch'] = C8Arch;
widgetRegistry['c9-herding'] = C9Herding;
widgetRegistry['c9-budget'] = C9Budget;
widgetRegistry['c10-race'] = C10Race;
widgetRegistry['c10-ablation'] = C10Ablation;
widgetRegistry['garden-analogy'] = GardenAnalogy;
