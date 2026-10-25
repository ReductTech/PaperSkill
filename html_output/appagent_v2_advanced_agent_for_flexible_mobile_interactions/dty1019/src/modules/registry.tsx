import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { FieldStudio } from './field-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['field-scene'] = FieldStudio;
