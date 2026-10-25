import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HeroCloud } from './hero-cloud';
import { HeroDuel } from './hero-duel';
import { AnalogyScene } from './analogy-scene';
import { Ch1Pipeline } from './ch1-pipeline';
import { Ch1Ledger } from './ch1-ledger';
import { Ch2Compare } from './ch2-compare';
import { Ch3Explosion } from './ch3-explosion';
import { Ch4Cosine } from './ch4-cosine';
import { Ch4Bottleneck } from './ch4-bottleneck';
import { Ch5Stepper } from './ch5-stepper';
import { Ch5Exact } from './ch5-exact';
import { Ch6CodeMap } from './ch6-codemap';
import { Ch6Keep } from './ch6-keep';
import { Ch7Budget } from './ch7-budget';
import { Ch7Causal } from './ch7-causal';
import { Ch8Strategies } from './ch8-strategies';
import { Ch9Calc } from './ch9-calc';
import { Ch9Race } from './ch9-race';
import { Ch10Results } from './ch10-results';
import { Ch10Fairness } from './ch10-fairness';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. A missing id renders a graceful placeholder, so the app never
// crashes on an unfinished id.
//
// 依赖方向：components → registry → modules → (ui, lib, data)。
// modules 不得 import components 或 registry 之外的上层文件，避免循环 import。

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 模板自带示例，保留不用。
widgetRegistry['example-slider'] = ExampleSlider;

widgetRegistry['hero-cloud'] = HeroCloud;
widgetRegistry['hero-duel'] = HeroDuel;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['ch1-pipeline'] = Ch1Pipeline;
widgetRegistry['ch1-ledger'] = Ch1Ledger;
widgetRegistry['ch2-compare'] = Ch2Compare;
widgetRegistry['ch3-explosion'] = Ch3Explosion;
widgetRegistry['ch4-cosine'] = Ch4Cosine;
widgetRegistry['ch4-bottleneck'] = Ch4Bottleneck;
widgetRegistry['ch5-stepper'] = Ch5Stepper;
widgetRegistry['ch5-exact'] = Ch5Exact;
widgetRegistry['ch6-codemap'] = Ch6CodeMap;
widgetRegistry['ch6-keep'] = Ch6Keep;
widgetRegistry['ch7-budget'] = Ch7Budget;
widgetRegistry['ch7-causal'] = Ch7Causal;
widgetRegistry['ch8-strategies'] = Ch8Strategies;
widgetRegistry['ch9-calc'] = Ch9Calc;
widgetRegistry['ch9-race'] = Ch9Race;
widgetRegistry['ch10-results'] = Ch10Results;
widgetRegistry['ch10-fairness'] = Ch10Fairness;
