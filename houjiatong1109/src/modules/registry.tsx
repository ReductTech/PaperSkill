import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { PhotoAnalogy } from './photoAnalogy';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['photo-analogy'] = PhotoAnalogy;
