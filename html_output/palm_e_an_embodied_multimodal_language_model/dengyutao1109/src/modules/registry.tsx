import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ArchOverview } from './arch-overview';
import { EncoderSelect } from './encoder-select';
import { EntityReferral } from './entity-referral';
import { GeneralistEvidence } from './generalist-evidence';
import { LimitationRecap } from './limitation-recap';
import { MultimodalSentence } from './multimodal-sentence';
import { ProblemBaseline } from './problem-baseline';
import { RealRobotScene } from './real-robot-scene';
import { RepresentationEvidence } from './representation-evidence';
import { ScaleForgetting } from './scale-forgetting';
import { TrainingRecipe } from './training-recipe';
import { TransferEvidence } from './transfer-evidence';
import { FigureNotes } from './figure-notes';
import { GlossaryOverview } from './glossary-overview';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['arch-overview'] = ArchOverview;
widgetRegistry['encoder-select'] = EncoderSelect;
widgetRegistry['entity-referral'] = EntityReferral;
widgetRegistry['generalist-evidence'] = GeneralistEvidence;
widgetRegistry['limitation-recap'] = LimitationRecap;
widgetRegistry['multimodal-sentence'] = MultimodalSentence;
widgetRegistry['problem-baseline'] = ProblemBaseline;
widgetRegistry['real-robot-scene'] = RealRobotScene;
widgetRegistry['representation-evidence'] = RepresentationEvidence;
widgetRegistry['scale-forgetting'] = ScaleForgetting;
widgetRegistry['training-recipe'] = TrainingRecipe;
widgetRegistry['transfer-evidence'] = TransferEvidence;
widgetRegistry['figure-notes'] = FigureNotes;
widgetRegistry['glossary-overview'] = GlossaryOverview;
