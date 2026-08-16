import React from 'react';
import {
  BoundaryMapAnimation,
  CascadeAnimation,
  ChallengeMapAnimation,
  ConceptFlowAnimation,
  ConvergenceAnimation,
  CouplingGapAnimation,
  DataLandscapeAnimation,
  EssenceAnimation,
  EvaluationAnimation,
  ForesightAnimation,
  JointAnimation,
  TransferAnimation
} from './wam-redesign';

export interface WidgetProps { chapterId: string; moduleId: string; }

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['wam-foresight-animation'] = ForesightAnimation;
widgetRegistry['wam-concept-flow-animation'] = ConceptFlowAnimation;
widgetRegistry['wam-boundary-map'] = BoundaryMapAnimation;
widgetRegistry['wam-convergence-animation'] = ConvergenceAnimation;
widgetRegistry['wam-cascade-animation'] = CascadeAnimation;
widgetRegistry['wam-joint-animation'] = JointAnimation;
widgetRegistry['wam-data-landscape'] = DataLandscapeAnimation;
widgetRegistry['wam-transfer-animation'] = TransferAnimation;
widgetRegistry['wam-evaluation-animation'] = EvaluationAnimation;
widgetRegistry['wam-coupling-gap'] = CouplingGapAnimation;
widgetRegistry['wam-challenge-map'] = ChallengeMapAnimation;
widgetRegistry['wam-essence-animation'] = EssenceAnimation;
