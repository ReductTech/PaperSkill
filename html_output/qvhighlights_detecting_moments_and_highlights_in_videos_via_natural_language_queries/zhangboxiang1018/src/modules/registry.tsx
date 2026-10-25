import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Analogy1 } from './analogy-1';
import { Analogy2 } from './analogy-2';
import { Analogy3 } from './analogy-3';
import { Analogy4 } from './analogy-4';
import { Analogy5 } from './analogy-5';
import { Analogy6 } from './analogy-6';
import { Analogy7 } from './analogy-7';
import { Analogy8 } from './analogy-8';
import { AnnotationLab } from './annotation-lab';
import { Architecture } from './architecture';
import { EquationReveal } from './equation-reveal';
import { IouLab } from './iou-lab';
import { LossLab } from './loss-lab';
import { MatchingLab } from './matching-lab';
import { PretrainLab } from './pretrain-lab';
import { QueryQuiz } from './query-quiz';
import { ResultsLab } from './results-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-1'] = Analogy1;
widgetRegistry['analogy-2'] = Analogy2;
widgetRegistry['analogy-3'] = Analogy3;
widgetRegistry['analogy-4'] = Analogy4;
widgetRegistry['analogy-5'] = Analogy5;
widgetRegistry['analogy-6'] = Analogy6;
widgetRegistry['analogy-7'] = Analogy7;
widgetRegistry['analogy-8'] = Analogy8;
widgetRegistry['annotation-lab'] = AnnotationLab;
widgetRegistry['architecture'] = Architecture;
widgetRegistry['equation-reveal'] = EquationReveal;
widgetRegistry['iou-lab'] = IouLab;
widgetRegistry['loss-lab'] = LossLab;
widgetRegistry['matching-lab'] = MatchingLab;
widgetRegistry['pretrain-lab'] = PretrainLab;
widgetRegistry['query-quiz'] = QueryQuiz;
widgetRegistry['results-lab'] = ResultsLab;
