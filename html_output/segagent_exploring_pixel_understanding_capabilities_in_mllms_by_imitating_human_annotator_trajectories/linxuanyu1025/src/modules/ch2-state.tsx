import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch2State: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch2-state" />;
