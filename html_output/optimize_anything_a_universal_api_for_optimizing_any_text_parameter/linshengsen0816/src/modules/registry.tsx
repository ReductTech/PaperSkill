import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { OptimizeAnythingLab } from './optimize-anything-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['optimize-anything-lab'] = OptimizeAnythingLab;
