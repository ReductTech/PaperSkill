import React from 'react';
import { ArchitectureFlowExplorer } from './architecture-flow';
import { DedupSimulation } from './dedup-simulation';
import { HiDreamUnifiedAnimationWidget } from '../components/animations/HiDreamUnifiedAnimation';
import { LDMPipelineAnimationWidget } from '../components/animations/LDMPipelineAnimation';
import { WashingVeggiesCanvas } from './washing-veggies-canvas';
import { ConveyorSortCanvas } from './conveyor-sort-canvas';
import { QcPipelineSection } from './qc-pipeline-game';
import { MoldCutCanvas } from './mold-cut-canvas';
import { AnnotationWorkshopSection } from './annotation-workshop';
import { CookingCanvas, PostTrainingCanvas, S5CanvasFrame, StageProgressCanvas } from './s5-training-canvases';
import { DistillCanvas, QuickRecipeCanvas, S6CanvasFrame, S6LossFormula } from './s6-fast-inference';
import {
  ApplicationGallery,
  EfficiencyCanvas,
  FinalCanvasFrame,
  InsightCanvas,
  JourneyCanvas,
  KeywordFormula,
  ObjectiveStackPanel,
  PromptAgentCanvas,
  S7RadarPanel,
} from './s7-s8-final';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

const PlaceholderWidget: React.FC<WidgetProps> = ({ moduleId }) => (
  <div className="hd-placeholder-widget" aria-hidden="true">
    <span className="hd-placeholder-num">{moduleId}</span>
  </div>
);

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = PlaceholderWidget;
widgetRegistry['ldm-pipeline-animation'] = LDMPipelineAnimationWidget;
widgetRegistry['hidream-unified-animation'] = HiDreamUnifiedAnimationWidget;
widgetRegistry['hidream-architecture-flow'] = ArchitectureFlowExplorer;
widgetRegistry['washing-veggies-canvas'] = () => <WashingVeggiesCanvas size={120} />;
widgetRegistry['data-sources-dedup'] = DedupSimulation;
widgetRegistry['conveyor-sort-canvas'] = () => <ConveyorSortCanvas size={120} />;
widgetRegistry['quality-filter-challenge'] = QcPipelineSection;
widgetRegistry['mold-cut-canvas'] = () => <MoldCutCanvas size={120} />;
widgetRegistry['prompt-construction-workshop'] = AnnotationWorkshopSection;
widgetRegistry['s5-cooking-canvas'] = () => <CookingCanvas />;
widgetRegistry['s5-stage-progress'] = () => (
  <S5CanvasFrame>
    <StageProgressCanvas />
  </S5CanvasFrame>
);
widgetRegistry['s5-post-training'] = () => (
  <S5CanvasFrame>
    <PostTrainingCanvas />
  </S5CanvasFrame>
);
widgetRegistry['s6-quick-recipe-canvas'] = () => <QuickRecipeCanvas />;
widgetRegistry['s6-distill-canvas'] = () => (
  <S6CanvasFrame>
    <DistillCanvas />
  </S6CanvasFrame>
);
widgetRegistry['s6-loss-formula'] = S6LossFormula;
widgetRegistry['s7-efficiency-canvas'] = () => <EfficiencyCanvas />;
widgetRegistry['s7-geneval-radar'] = S7RadarPanel;
widgetRegistry['s7-objective-stack'] = ObjectiveStackPanel;
widgetRegistry['s8-journey-canvas'] = () => <JourneyCanvas />;
widgetRegistry['s8-application-gallery'] = ApplicationGallery;
widgetRegistry['s8-prompt-agent-canvas'] = () => (
  <FinalCanvasFrame>
    <PromptAgentCanvas />
  </FinalCanvasFrame>
);
widgetRegistry['s8-insight-canvas'] = () => (
  <FinalCanvasFrame>
    <InsightCanvas />
  </FinalCanvasFrame>
);
widgetRegistry['s8-keyword-formula'] = KeywordFormula;

