import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AblationExplorer } from './ablation';
import { EvidenceConditions } from './conditions';
import { MemoryMap } from './memory-map';
import { NotebookWidget } from './notebook-scene';
import { PersonaTimeline } from './persona-timeline';
import { TrainingInference } from './process';
import { ResultsExplorer } from './results';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation'] = AblationExplorer;
widgetRegistry['conditions'] = EvidenceConditions;
widgetRegistry['memory-map'] = MemoryMap;
widgetRegistry['notebook-scene'] = NotebookWidget;
widgetRegistry['persona-timeline'] = PersonaTimeline;
widgetRegistry['process'] = TrainingInference;
widgetRegistry['results'] = ResultsExplorer;
