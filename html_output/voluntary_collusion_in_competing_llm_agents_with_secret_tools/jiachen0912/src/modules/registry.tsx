import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyScene } from './analogy-scene';
import { CollusionDrag } from './collusion-drag';
import { DecisionStep } from './decision-step';
import { EnvPick } from './env-pick';
import { HeroScene } from './hero-scene';
import { PipelineHotspot } from './pipeline-hotspot';
import { ResultRace } from './result-race';
import { RewardWeight } from './reward-weight';
import { ToolChip } from './tool-chip';
import { TraceStep } from './trace-step';
import { VariantChip } from './variant-chip';
import { WarnSlider } from './warn-slider';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['collusion-drag'] = CollusionDrag;
widgetRegistry['decision-step'] = DecisionStep;
widgetRegistry['env-pick'] = EnvPick;
widgetRegistry['hero-scene'] = HeroScene;
widgetRegistry['pipeline-hotspot'] = PipelineHotspot;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['reward-weight'] = RewardWeight;
widgetRegistry['tool-chip'] = ToolChip;
widgetRegistry['trace-step'] = TraceStep;
widgetRegistry['variant-chip'] = VariantChip;
widgetRegistry['warn-slider'] = WarnSlider;
