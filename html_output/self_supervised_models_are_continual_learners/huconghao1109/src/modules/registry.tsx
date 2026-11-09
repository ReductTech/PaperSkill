import React from 'react';
import { BandAnalogy } from './band-analogy';
import { Ch1Drift } from './ch1-drift';
import { Ch10Limits } from './ch10-limits';
import { Ch10Race } from './ch10-race';
import { Ch2Views } from './ch2-views';
import { Ch3Transpose } from './ch3-transpose';
import { Ch4Freeze } from './ch4-freeze';
import { Ch5Loss } from './ch5-loss';
import { Ch6Step } from './ch6-step';
import { Ch6Swap } from './ch6-swap';
import { Ch7Settings } from './ch7-settings';
import { Ch8Arch, Ch8Predictor } from './ch8-arch';
import { Ch9Ablation } from './ch9-ablation';
import { Ch9Longer } from './ch9-longer';
import { HeroTuning } from './hero-tuning';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['band-analogy'] = BandAnalogy;
widgetRegistry['ch1-drift'] = Ch1Drift;
widgetRegistry['ch10-limits'] = Ch10Limits;
widgetRegistry['ch10-race'] = Ch10Race;
widgetRegistry['ch2-views'] = Ch2Views;
widgetRegistry['ch3-transpose'] = Ch3Transpose;
widgetRegistry['ch4-freeze'] = Ch4Freeze;
widgetRegistry['ch5-loss'] = Ch5Loss;
widgetRegistry['ch6-step'] = Ch6Step;
widgetRegistry['ch6-swap'] = Ch6Swap;
widgetRegistry['ch7-settings'] = Ch7Settings;
widgetRegistry['ch8-arch'] = Ch8Arch;
widgetRegistry['ch8-predictor'] = Ch8Predictor;
widgetRegistry['ch9-ablation'] = Ch9Ablation;
widgetRegistry['ch9-longer'] = Ch9Longer;
widgetRegistry['hero-tuning'] = HeroTuning;
