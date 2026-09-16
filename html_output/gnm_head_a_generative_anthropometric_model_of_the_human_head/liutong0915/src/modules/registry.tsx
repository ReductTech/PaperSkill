import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1Anatomy } from './ch1-anatomy';
import { Ch1Shell } from './ch1-shell';
import { Ch10Results } from './ch10-results';
import { Ch2Data } from './ch2-data';
import { Ch3Basis } from './ch3-basis';
import { Ch4Lbs } from './ch4-lbs';
import { Ch5Regions } from './ch5-regions';
import { Ch6Anatomy } from './ch6-anatomy';
import { Ch7Fit } from './ch7-fit';
import { Ch8Sampler } from './ch8-sampler';
import { Ch9Training } from './ch9-training';
import { HeroComparison } from './hero-comparison';
import { StudioAnalogy } from './studio-analogy';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-anatomy'] = Ch1Anatomy;
widgetRegistry['ch1-shell'] = Ch1Shell;
widgetRegistry['ch10-results'] = Ch10Results;
widgetRegistry['ch2-data'] = Ch2Data;
widgetRegistry['ch3-basis'] = Ch3Basis;
widgetRegistry['ch4-lbs'] = Ch4Lbs;
widgetRegistry['ch5-regions'] = Ch5Regions;
widgetRegistry['ch6-anatomy'] = Ch6Anatomy;
widgetRegistry['ch7-fit'] = Ch7Fit;
widgetRegistry['ch8-sampler'] = Ch8Sampler;
widgetRegistry['ch9-training'] = Ch9Training;
widgetRegistry['hero-comparison'] = HeroComparison;
widgetRegistry['studio-analogy'] = StudioAnalogy;
