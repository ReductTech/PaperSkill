import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1Offset } from './ch1-offset';
import { Ch10Race } from './ch10-race';
import { Ch2Embedding } from './ch2-embedding';
import { Ch3OnceVsMany } from './ch3-once-vs-many';
import { Ch4Velocity } from './ch4-velocity';
import { Ch5Guidance } from './ch5-guidance';
import { Ch6OdeSde } from './ch6-ode-sde';
import { Ch6Steps } from './ch6-steps';
import { Ch7TwoBranch } from './ch7-two-branch';
import { Ch8ArchMap } from './ch8-arch-map';
import { Ch8Bottleneck } from './ch8-bottleneck';
import { Ch9Budget } from './ch9-budget';
import { ClayAnalogy } from './clay-analogy';
import { ClayHeroCompare } from './clay-hero-compare';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-offset'] = Ch1Offset;
widgetRegistry['ch10-race'] = Ch10Race;
widgetRegistry['ch2-embedding'] = Ch2Embedding;
widgetRegistry['ch3-once-vs-many'] = Ch3OnceVsMany;
widgetRegistry['ch4-velocity'] = Ch4Velocity;
widgetRegistry['ch5-guidance'] = Ch5Guidance;
widgetRegistry['ch6-ode-sde'] = Ch6OdeSde;
widgetRegistry['ch6-steps'] = Ch6Steps;
widgetRegistry['ch7-two-branch'] = Ch7TwoBranch;
widgetRegistry['ch8-arch-map'] = Ch8ArchMap;
widgetRegistry['ch8-bottleneck'] = Ch8Bottleneck;
widgetRegistry['ch9-budget'] = Ch9Budget;
widgetRegistry['clay-analogy'] = ClayAnalogy;
widgetRegistry['clay-hero-compare'] = ClayHeroCompare;
