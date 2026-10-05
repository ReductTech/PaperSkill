import React from 'react';
import { VlWidget } from './vl-widget';

export interface WidgetProps { chapterId: string; moduleId: string; }
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['vl-widget'] = VlWidget;
