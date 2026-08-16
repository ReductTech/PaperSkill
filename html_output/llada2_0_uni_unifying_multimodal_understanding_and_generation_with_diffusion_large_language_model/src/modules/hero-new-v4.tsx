import React from 'react';
import type { WidgetProps } from './registry';
import { HeroNew } from './heroWidgets';
import { LearningGuide } from './learning-guide';

export const HeroNewV4: React.FC<WidgetProps> = (props) => (
  <>
    <HeroNew {...props} />
    <LearningGuide />
  </>
);
