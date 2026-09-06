import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  SltAnalogy,
  SltArchitecture,
  SltAttention,
  SltCost,
  SltData,
  SltDecision,
  SltEncoder,
  SltHeroIntro,
  SltHeroNew,
  SltHeroOld,
  SltModelCompare,
  SltPipeline,
  SltSignIcon,
  SltPose,
  SltProjection,
  SltSize,
  SltTraining,
} from './sltWidgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['slt-hero-old'] = SltHeroOld;
widgetRegistry['slt-hero-new'] = SltHeroNew;
widgetRegistry['slt-hero-intro'] = SltHeroIntro;
widgetRegistry['slt-sign-icon'] = SltSignIcon;
widgetRegistry['slt-model-compare'] = SltModelCompare;
widgetRegistry['slt-analogy'] = SltAnalogy;
widgetRegistry['slt-cost'] = SltCost;
widgetRegistry['slt-pose'] = SltPose;
widgetRegistry['slt-projection'] = SltProjection;
widgetRegistry['slt-attention'] = SltAttention;
widgetRegistry['slt-size'] = SltSize;
widgetRegistry['slt-pipeline'] = SltPipeline;
widgetRegistry['slt-training'] = SltTraining;
widgetRegistry['slt-architecture'] = SltArchitecture;
widgetRegistry['slt-encoder'] = SltEncoder;
widgetRegistry['slt-data'] = SltData;
widgetRegistry['slt-decision'] = SltDecision;
