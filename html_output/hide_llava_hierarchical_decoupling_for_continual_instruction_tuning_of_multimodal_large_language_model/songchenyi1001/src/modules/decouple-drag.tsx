import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy03: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-03" />;
export const DecoupleDrag: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="decouple" />;
