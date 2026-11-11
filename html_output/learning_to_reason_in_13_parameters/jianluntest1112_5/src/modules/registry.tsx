import React from 'react';
import { AbstractNote } from './abstract-note';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['abstract-note'] = AbstractNote;
