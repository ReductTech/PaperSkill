import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyScene } from './analogy-scene';
import { InteractiveLab } from './interactive-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['interactive-lab'] = InteractiveLab;
