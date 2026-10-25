import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch2Click: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch2-click" />;
