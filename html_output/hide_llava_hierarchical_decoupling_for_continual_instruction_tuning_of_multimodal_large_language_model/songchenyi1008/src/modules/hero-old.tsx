import React from 'react';
import type { WidgetProps } from './registry';
import { HiDeAnalogy, HiDeModule } from './hide-shared';

export const Analogy01: React.FC<WidgetProps> = (props) => <HiDeAnalogy {...props} variant="wood-01" />;
export const LeakBenchmark: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="leak" />;
export const HeroOld: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="hero-old" />;
export const HeroNew: React.FC<WidgetProps> = (props) => <HiDeModule {...props} variant="hero-new" />;
