import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DarkWidget } from './dark-widget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['dark-widget'] = DarkWidget;
