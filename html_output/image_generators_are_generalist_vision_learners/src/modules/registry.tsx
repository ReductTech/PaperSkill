import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ClaimStamp } from './claim-stamp';
import { DecodeReversibility } from './decode-reversibility';
import { DepthColorBijection } from './depth-color-bijection';
import { InferenceSteps } from './inference-steps';
import { InstructionMix } from './instruction-mix';
import { PromptColor } from './prompt-color';
import { RgbTaskMap } from './rgb-task-map';
import { SharedModelArchitecture } from './shared-model-architecture';
import { SpecialistSilo } from './specialist-silo';
import { SurfaceNormalEncoding } from './surface-normal-encoding';
import { UnifiedGenerator } from './unified-generator';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['claim-stamp'] = ClaimStamp;
widgetRegistry['decode-reversibility'] = DecodeReversibility;
widgetRegistry['depth-color-bijection'] = DepthColorBijection;
widgetRegistry['inference-steps'] = InferenceSteps;
widgetRegistry['instruction-mix'] = InstructionMix;
widgetRegistry['prompt-color'] = PromptColor;
widgetRegistry['rgb-task-map'] = RgbTaskMap;
widgetRegistry['shared-model-architecture'] = SharedModelArchitecture;
widgetRegistry['specialist-silo'] = SpecialistSilo;
widgetRegistry['surface-normal-encoding'] = SurfaceNormalEncoding;
widgetRegistry['unified-generator'] = UnifiedGenerator;
