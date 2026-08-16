import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { StageScenes } from './stage-scenes';
import { UnisonActive } from './unison-active';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['stage-scenes'] = StageScenes;
widgetRegistry['unison-active'] = UnisonActive;
