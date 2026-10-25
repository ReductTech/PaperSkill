import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch3Simulator: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch3-simulator" />;
