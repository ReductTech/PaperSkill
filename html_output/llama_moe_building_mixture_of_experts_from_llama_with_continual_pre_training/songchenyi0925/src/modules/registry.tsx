import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyScene } from './analogy-scene';
import { AnalysisLab } from './analysis-lab';
import { BasicsLab } from './basics-lab';
import { HeroDense } from './hero-dense';
import { HeroSparse } from './hero-sparse';
import { RoutingLab } from './routing-lab';
import { TrainingLab } from './training-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['analysis-lab'] = AnalysisLab;
widgetRegistry['basics-lab'] = BasicsLab;
widgetRegistry['hero-dense'] = HeroDense;
widgetRegistry['hero-sparse'] = HeroSparse;
widgetRegistry['routing-lab'] = RoutingLab;
widgetRegistry['training-lab'] = TrainingLab;
