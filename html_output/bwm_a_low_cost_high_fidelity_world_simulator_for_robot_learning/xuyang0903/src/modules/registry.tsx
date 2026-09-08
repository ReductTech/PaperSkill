import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { BwmAnalogy } from './bwm-analogy';
import { BwmHeroRestored } from './bwm-hero-restored';
import { BwmInteractive } from './bwm-interactive';
import { BwmFoundations } from './bwm-foundations';
import { BwmFormalization } from './bwm-formalization';
import { BwmRelatedWork } from './bwm-related-work';
import { BwmCoreMechanics } from './bwm-core-mechanics';
import { BwmEvaluationLab } from './bwm-evaluation-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['bwm-analogy'] = BwmAnalogy;
widgetRegistry['bwm-hero'] = BwmHeroRestored;
widgetRegistry['bwm-interactive'] = BwmInteractive;
widgetRegistry['bwm-foundations'] = BwmFoundations;
widgetRegistry['bwm-formalization'] = BwmFormalization;
widgetRegistry['bwm-related-work'] = BwmRelatedWork;
widgetRegistry['bwm-core-mechanics'] = BwmCoreMechanics;
widgetRegistry['bwm-evaluation-lab'] = BwmEvaluationLab;
