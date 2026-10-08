import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy08: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-08" />;
export const ArchitectureMap: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="architecture" />;
export const TrainInferSync: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="sync" />;
