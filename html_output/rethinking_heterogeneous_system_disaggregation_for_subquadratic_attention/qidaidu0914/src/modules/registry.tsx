import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { SqdAnalogy } from './sqd-analogy';
import { SqdModule } from './sqd-module';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['sqd-analogy'] = SqdAnalogy;
widgetRegistry['sqd-module'] = SqdModule;
