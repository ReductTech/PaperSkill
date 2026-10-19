import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LoRALab } from './lora-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['lora-lab'] = LoRALab;
