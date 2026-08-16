import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { VideoCoCoLab } from './videococo-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['videococo-lab'] = VideoCoCoLab;
