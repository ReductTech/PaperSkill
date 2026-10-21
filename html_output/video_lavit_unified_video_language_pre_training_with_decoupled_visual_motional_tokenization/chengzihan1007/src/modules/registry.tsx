import React from 'react';
import type { WidgetProps } from './widgetTypes';
import { TimelineLab, CostLab, MpegLab, QuantizeLab } from './coreLabs';
import {
  MpegDecompositionLab, VisualBudgetLab, VisualPipelineLab, MotionFoldingLab,
  SequenceBuilderLab, NextTokenLab,
  DecodeFlowLab, EmcLab, ClipChainLab, DdimLab, TrainingStageLab, TrainingConfigLab,
  UnderstandingLab, GenerationLab, AblationFocusedLab, ReviewerLab,
} from './revisedLabs';
export type { WidgetProps } from './widgetTypes';

const fromLegacy = (Component: React.ComponentType<{ variant?: string }>, variant?: string): React.FC<WidgetProps> =>
  ({ onEvidenceFocus }) => <div onClickCapture={() => onEvidenceFocus?.(1)} onInputCapture={() => onEvidenceFocus?.(1)}><Component variant={variant}/></div>;

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['lab-timeline'] = fromLegacy(TimelineLab);
widgetRegistry['lab-cost'] = fromLegacy(CostLab, 'scale');
widgetRegistry['lab-mpeg'] = MpegDecompositionLab;
widgetRegistry['lab-motion-search'] = fromLegacy(MpegLab, 'search');
widgetRegistry['lab-visual-pipeline'] = VisualPipelineLab;
widgetRegistry['lab-visual-budget'] = VisualBudgetLab;
widgetRegistry['lab-motion-fold'] = MotionFoldingLab;
widgetRegistry['lab-quantize'] = QuantizeLab;
widgetRegistry['lab-sequence-builder'] = SequenceBuilderLab;
widgetRegistry['lab-next-token'] = NextTokenLab;
widgetRegistry['lab-decode-flow'] = DecodeFlowLab;
widgetRegistry['lab-emc'] = EmcLab;
widgetRegistry['lab-clip-chain'] = ClipChainLab;
widgetRegistry['lab-ddim'] = DdimLab;
widgetRegistry['lab-training-stage'] = TrainingStageLab;
widgetRegistry['lab-training-config'] = TrainingConfigLab;
widgetRegistry['lab-understanding'] = UnderstandingLab;
widgetRegistry['lab-generation'] = GenerationLab;
widgetRegistry['lab-ablation'] = AblationFocusedLab;
widgetRegistry['lab-review'] = ReviewerLab;
