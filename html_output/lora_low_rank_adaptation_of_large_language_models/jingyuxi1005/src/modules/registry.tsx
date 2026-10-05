import React from 'react';
import { LoraWidget } from './lora-widget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['lora-widget'] = LoraWidget;
