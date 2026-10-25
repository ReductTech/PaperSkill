import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ChapterQuiz } from './chapter-quiz';
import { HeroTimeline } from './hero-timeline';
import { Ch1Lab } from './lab-ch1';
import { Ch10Lab } from './lab-ch10';
import { Ch2Lab } from './lab-ch2';
import { Ch3Lab } from './lab-ch3';
import { Ch4Lab } from './lab-ch4';
import { Ch5Lab } from './lab-ch5';
import { Ch6Lab } from './lab-ch6';
import { Ch7Lab } from './lab-ch7';
import { Ch8Lab } from './lab-ch8';
import { Ch9Lab } from './lab-ch9';
import { SubtitleAnalogy } from './subtitle-analogy';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['chapter-quiz'] = ChapterQuiz;
widgetRegistry['hero-timeline'] = HeroTimeline;
widgetRegistry['lab-ch1'] = Ch1Lab;
widgetRegistry['lab-ch10'] = Ch10Lab;
widgetRegistry['lab-ch2'] = Ch2Lab;
widgetRegistry['lab-ch3'] = Ch3Lab;
widgetRegistry['lab-ch4'] = Ch4Lab;
widgetRegistry['lab-ch5'] = Ch5Lab;
widgetRegistry['lab-ch6'] = Ch6Lab;
widgetRegistry['lab-ch7'] = Ch7Lab;
widgetRegistry['lab-ch8'] = Ch8Lab;
widgetRegistry['lab-ch9'] = Ch9Lab;
widgetRegistry['subtitle-analogy'] = SubtitleAnalogy;
