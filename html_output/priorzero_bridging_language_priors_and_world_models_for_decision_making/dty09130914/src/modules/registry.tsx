import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { PriorzeroCanvas } from './priorzero-canvas';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['priorzero-canvas'] = PriorzeroCanvas;
