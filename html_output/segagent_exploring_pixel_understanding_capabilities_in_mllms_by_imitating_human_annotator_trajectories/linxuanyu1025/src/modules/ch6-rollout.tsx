import React from 'react';
import { ChapterLab } from './chapter-labs';
import type { WidgetProps } from './registry';
export const Ch6Rollout: React.FC<WidgetProps> = (props) => <ChapterLab {...props} mode="ch6-rollout" />;
