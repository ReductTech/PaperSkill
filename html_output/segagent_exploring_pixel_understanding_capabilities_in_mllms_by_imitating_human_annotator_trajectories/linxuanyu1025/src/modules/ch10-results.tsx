import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch10Results: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch10-results" />;
