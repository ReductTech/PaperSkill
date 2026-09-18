import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { MegaAsrScene } from './mega-asr-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['mega-asr-scene'] = MegaAsrScene;
