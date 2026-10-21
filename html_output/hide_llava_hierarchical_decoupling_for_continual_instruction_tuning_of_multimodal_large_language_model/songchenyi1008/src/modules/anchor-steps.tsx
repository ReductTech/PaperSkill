import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy04: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-04" />;
export const AnchorSteps: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="anchors" />;
