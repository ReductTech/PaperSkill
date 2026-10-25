import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch10Failures: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch10-failures" />;
