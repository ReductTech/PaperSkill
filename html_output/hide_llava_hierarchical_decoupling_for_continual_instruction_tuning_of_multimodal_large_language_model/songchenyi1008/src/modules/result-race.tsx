import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy10: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-10" />;
export const ResultRace: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="race" />;
