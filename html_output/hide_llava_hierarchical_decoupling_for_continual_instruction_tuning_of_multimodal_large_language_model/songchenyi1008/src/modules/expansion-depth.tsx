import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy09: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-09" />;
export const ExpansionDepth: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="depth" />;
