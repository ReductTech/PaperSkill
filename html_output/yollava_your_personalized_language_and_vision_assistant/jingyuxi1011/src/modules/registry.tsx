import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AblationExplorerWidget } from './ablation-explorer';
import { AlbumAnalogyWidget } from './album-analogy';
import { ConversationSwitchWidget } from './conversation-switch';
import { FailureExplorerWidget } from './failure-explorer';
import { GenericCompareWidget } from './generic-compare';
import { HeroGenericWidget } from './hero-generic';
import { HeroPersonalizedWidget } from './hero-personalized';
import { OverviewMapWidget } from './overview-map';
import { PipelineSwitchWidget } from './pipeline-switch';
import { ResultsCardsWidget } from './results-cards';
import { SubjectArchitectureWidget } from './subject-architecture';
import { SummaryCheckWidget } from './summary-check';
import { TrainingObjectiveWidget } from './training-objective';
import { YoLLaVAWidgets } from './yollava-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation-explorer'] = AblationExplorerWidget;
widgetRegistry['album-analogy'] = AlbumAnalogyWidget;
widgetRegistry['conversation-switch'] = ConversationSwitchWidget;
widgetRegistry['failure-explorer'] = FailureExplorerWidget;
widgetRegistry['generic-compare'] = GenericCompareWidget;
widgetRegistry['hero-generic'] = HeroGenericWidget;
widgetRegistry['hero-personalized'] = HeroPersonalizedWidget;
widgetRegistry['overview-map'] = OverviewMapWidget;
widgetRegistry['pipeline-switch'] = PipelineSwitchWidget;
widgetRegistry['results-cards'] = ResultsCardsWidget;
widgetRegistry['subject-architecture'] = SubjectArchitectureWidget;
widgetRegistry['summary-check'] = SummaryCheckWidget;
widgetRegistry['training-objective'] = TrainingObjectiveWidget;
widgetRegistry['yollava-kit'] = YoLLaVAWidgets;
