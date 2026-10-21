import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy05: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-05" />;
export const RoutingWeights: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="routing" />;
