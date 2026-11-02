import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1Cost } from './ch1-cost';
import { Ch1History } from './ch1-history';
import { Ch2Overview } from './ch2-overview';
import { Ch3QFormer } from './ch3-qformer';
import { Ch4Objectives } from './ch4-objectives';
import { Ch5Itg } from './ch5-itg';
import { Ch6Llm } from './ch6-llm';
import { Ch7Vqa } from './ch7-vqa';
import { Ch8Caption } from './ch8-caption';
import { Ch9Ablation } from './ch9-ablation';
import { Ch10Summary } from './ch10-summary';
import { ChHeroComic } from './ch-hero-comic';
import { ChHeroOld } from './ch-hero-old';
import ChHeroWordcloud from './ch-hero-wordcloud';
import Ch1AnalogyComic from './ch1-analogy-comic';
import {
  Ch2Comic, Ch3Comic, Ch4Comic, Ch5Comic, Ch6Comic,
  Ch7Comic, Ch8Comic, Ch9Comic, Ch10Comic
} from './chapter-comics';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Example kept so the scaffold runs out-of-the-box.
widgetRegistry['example-slider'] = ExampleSlider;

// BLIP-2 paper-specific widgets
widgetRegistry['ch1-cost'] = Ch1Cost;
widgetRegistry['ch1-history'] = Ch1History;
widgetRegistry['ch2-overview'] = Ch2Overview;
widgetRegistry['ch3-qformer'] = Ch3QFormer;
widgetRegistry['ch4-objectives'] = Ch4Objectives;
widgetRegistry['ch5-itg'] = Ch5Itg;
widgetRegistry['ch6-llm'] = Ch6Llm;
widgetRegistry['ch7-vqa'] = Ch7Vqa;
widgetRegistry['ch8-caption'] = Ch8Caption;
widgetRegistry['ch9-ablation'] = Ch9Ablation;
widgetRegistry['ch10-summary'] = Ch10Summary;
widgetRegistry['ch-hero-comic'] = ChHeroComic;
widgetRegistry['ch-hero-old'] = ChHeroOld;
widgetRegistry['ch-hero-wordcloud'] = ChHeroWordcloud;
widgetRegistry['ch1-analogy-comic'] = Ch1AnalogyComic;
widgetRegistry['ch2-comic'] = Ch2Comic;
widgetRegistry['ch3-comic'] = Ch3Comic;
widgetRegistry['ch4-comic'] = Ch4Comic;
widgetRegistry['ch5-comic'] = Ch5Comic;
widgetRegistry['ch6-comic'] = Ch6Comic;
widgetRegistry['ch7-comic'] = Ch7Comic;
widgetRegistry['ch8-comic'] = Ch8Comic;
widgetRegistry['ch9-comic'] = Ch9Comic;
widgetRegistry['ch10-comic'] = Ch10Comic;
