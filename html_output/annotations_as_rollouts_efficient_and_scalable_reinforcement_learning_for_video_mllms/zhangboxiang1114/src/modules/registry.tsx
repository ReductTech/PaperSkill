import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { OraAnalogy } from './ora-analogy';
import { OraExplorer } from './ora-explorer';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ora-analogy'] = OraAnalogy;
widgetRegistry['ora-explorer'] = OraExplorer;
