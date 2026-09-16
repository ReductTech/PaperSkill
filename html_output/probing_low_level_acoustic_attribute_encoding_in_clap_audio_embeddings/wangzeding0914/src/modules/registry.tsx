import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AudioAnalogy } from './audio-analogy';
import { AudioLab } from './audio-lab';
import { HeroCompare } from './hero-compare';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['audio-analogy'] = AudioAnalogy;
widgetRegistry['audio-lab'] = AudioLab;
widgetRegistry['hero-compare'] = HeroCompare;
