import React from 'react';
import { RegimeExplorer } from './regimeExplorer';
export interface WidgetProps { chapterId: string; moduleId: string; }
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['regime-explorer'] = RegimeExplorer;
