import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { TaskRollouts } from './task_rollouts';
import { VlaWidget } from './vla-widget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['task-rollouts'] = TaskRollouts;
widgetRegistry['vla-widget'] = VlaWidget;
