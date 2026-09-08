import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Figure2Guide } from './figure2-guide';
import { GraphLab3D } from './graph-lab-3d';
import { TrailWidget } from './trail-widget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['figure2-guide'] = Figure2Guide;
widgetRegistry['graph-lab-3d'] = GraphLab3D;
widgetRegistry['trail-widget'] = TrailWidget;
