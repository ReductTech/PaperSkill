import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LessonWidget } from './lesson-widget';
import { PhotoScene } from './photo-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['lesson-widget'] = LessonWidget;
widgetRegistry['photo-scene'] = PhotoScene;
