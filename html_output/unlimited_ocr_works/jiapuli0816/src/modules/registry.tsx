import React from 'react';
import { DeepSeekCompression } from './deepseek-compression';
import { MemoryHero } from './memory-hero';
import { PrecisionScenes } from './precision-scenes';
import { UnlimitedInteractive } from './unlimited-interactive';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['deepseek-compression'] = DeepSeekCompression;
widgetRegistry['memory-hero'] = MemoryHero;
widgetRegistry['precision-scenes'] = PrecisionScenes;
widgetRegistry['unlimited-interactive'] = UnlimitedInteractive;
