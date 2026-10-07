import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy06: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-06" />;
export const FusionModes: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="fusion" />;
