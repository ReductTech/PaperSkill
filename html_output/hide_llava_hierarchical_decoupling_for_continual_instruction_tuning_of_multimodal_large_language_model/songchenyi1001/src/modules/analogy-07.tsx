import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy07: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-07" />;
export const TrainingSteps: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="training" />;
