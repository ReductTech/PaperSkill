import React from 'react';
import { LearningStoryMap } from './learning-story-map';
import { SmartPhotoLab } from './smart-photo-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {
  'learning-story-map': LearningStoryMap,
  'smart-photo-lab': SmartPhotoLab,
};
