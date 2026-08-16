import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1MotivationWidget } from './ch1-motivation';
import { Ch10ResultsWidget } from './ch10-results';
import { Ch2RepresentationWidget } from './ch2-representation';
import { Ch3DataWidget } from './ch3-data';
import { Ch4CurriculumWidget } from './ch4-curriculum';
import { Ch5PeWidget } from './ch5-pe';
import { Ch5SftWidget } from './ch5-sft';
import { Ch6DpoWidget } from './ch6-dpo';
import { Ch7TurboWidget } from './ch7-turbo';
import { Ch9AestheticWidget } from './ch9-aesthetic';
import { PosterAnalogiesWidget } from './poster-analogies';
import { PosterHeroWidget } from './poster-hero';
import { PosterKitWidget } from './poster-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-motivation'] = Ch1MotivationWidget;
widgetRegistry['ch10-results'] = Ch10ResultsWidget;
widgetRegistry['ch2-representation'] = Ch2RepresentationWidget;
widgetRegistry['ch3-data'] = Ch3DataWidget;
widgetRegistry['ch4-curriculum'] = Ch4CurriculumWidget;
widgetRegistry['ch5-pe'] = Ch5PeWidget;
widgetRegistry['ch5-sft'] = Ch5SftWidget;
widgetRegistry['ch6-dpo'] = Ch6DpoWidget;
widgetRegistry['ch7-turbo'] = Ch7TurboWidget;
widgetRegistry['ch9-aesthetic'] = Ch9AestheticWidget;
widgetRegistry['poster-analogies'] = PosterAnalogiesWidget;
widgetRegistry['poster-hero'] = PosterHeroWidget;
widgetRegistry['poster-kit'] = PosterKitWidget;
