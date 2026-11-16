import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Average, Compare, Features, Game, Scale } from './compare';
import { Generator, Inference, Loss, Networks, Results, Training } from './generator';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { LifeScene } from './life-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['average'] = Average;
widgetRegistry['compare'] = Compare;
widgetRegistry['features'] = Features;
widgetRegistry['game'] = Game;
widgetRegistry['generator'] = Generator;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['inference'] = Inference;
widgetRegistry['life-scene'] = LifeScene;
widgetRegistry['loss'] = Loss;
widgetRegistry['networks'] = Networks;
widgetRegistry['results'] = Results;
widgetRegistry['scale'] = Scale;
widgetRegistry['training'] = Training;
