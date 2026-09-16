import React from 'react';
import { LegacyIsland, type LegacyView } from './legacyIsland';
import { ExampleSlider } from './exampleSlider';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

function legacyWidget(view: LegacyView): React.FC<WidgetProps> {
  return function LegacyWidget() {
    return <LegacyIsland view={view} />;
  };
}

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['paradigm-showcase'] = legacyWidget('paradigm');
widgetRegistry['method-lab'] = legacyWidget('method');
widgetRegistry['evidence-matrix'] = legacyWidget('evidence');
widgetRegistry['textldm-pipeline'] = legacyWidget('pipeline');
widgetRegistry['denoising-playground'] = legacyWidget('denoising');
widgetRegistry['experiment-flow'] = legacyWidget('flow');
widgetRegistry['results-lab'] = legacyWidget('results');
widgetRegistry['experiment-simulator'] = legacyWidget('simulator');
