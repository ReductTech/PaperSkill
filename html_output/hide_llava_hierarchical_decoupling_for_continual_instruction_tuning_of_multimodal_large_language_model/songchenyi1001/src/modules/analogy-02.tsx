import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy02: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-02" />;
export const CkaLayers: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="cka" />;
