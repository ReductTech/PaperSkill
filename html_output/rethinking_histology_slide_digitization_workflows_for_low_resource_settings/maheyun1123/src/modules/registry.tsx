import React from 'react';
import { Ch1Cost } from './ch1-cost';
import { Ch1Detail } from './ch1-detail';
import { Ch2Acquire } from './ch2-acquire';
import { Ch2Keyframes } from './ch2-keyframes';
import { Ch2Stitch } from './ch2-stitch';
import { Ch3Generator } from './ch3-generator';
import { Ch3Loss } from './ch3-loss';
import { Ch3Register } from './ch3-register';
import { Ch4Metrics } from './ch4-metrics';
import { Ch4Visual } from './ch4-visual';
import { Ch5Boundary } from './ch5-boundary';
import { Ch5Expert } from './ch5-expert';
import { Ch5Runtime } from './ch5-runtime';
import { HeroNewSequence } from './hero-new-sequence';
import { HeroOldSequence } from './hero-old-sequence';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['ch1-cost'] = Ch1Cost;
widgetRegistry['ch1-detail'] = Ch1Detail;
widgetRegistry['ch2-acquire'] = Ch2Acquire;
widgetRegistry['ch2-keyframes'] = Ch2Keyframes;
widgetRegistry['ch2-stitch'] = Ch2Stitch;
widgetRegistry['ch3-generator'] = Ch3Generator;
widgetRegistry['ch3-loss'] = Ch3Loss;
widgetRegistry['ch3-register'] = Ch3Register;
widgetRegistry['ch4-metrics'] = Ch4Metrics;
widgetRegistry['ch4-visual'] = Ch4Visual;
widgetRegistry['ch5-boundary'] = Ch5Boundary;
widgetRegistry['ch5-expert'] = Ch5Expert;
widgetRegistry['ch5-runtime'] = Ch5Runtime;
widgetRegistry['hero-new-sequence'] = HeroNewSequence;
widgetRegistry['hero-old-sequence'] = HeroOldSequence;
