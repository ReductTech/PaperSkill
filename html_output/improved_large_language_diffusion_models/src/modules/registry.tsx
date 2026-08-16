import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { IlladaWidget } from './illada-widget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['illada-widget'] = IlladaWidget;
