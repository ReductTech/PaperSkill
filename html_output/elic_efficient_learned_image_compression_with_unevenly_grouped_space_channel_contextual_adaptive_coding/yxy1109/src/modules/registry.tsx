import React from 'react';
import { ElicAnalogy, ElicHeroSide } from './elicScenes';
import { ElicWidget } from './elicModules';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['elic-ana'] = ElicAnalogy;
widgetRegistry['elic-hero-old'] = ElicHeroSide;
widgetRegistry['elic-hero-new'] = ElicHeroSide;
widgetRegistry['elic-module'] = ElicWidget;
