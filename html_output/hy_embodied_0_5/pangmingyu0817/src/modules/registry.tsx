import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  AnalogyOne,
  AnalogyTwo,
  AnalogyThree,
  Analogy4,
  Analogy5,
  Analogy6,
  Analogy7,
  Analogy8,
  Analogy9,
  Analogy10,
  KitchenGapRepair,
  KitchenGapStress,
  KitchenNativeResolution,
} from './kitchen-scenes';
import { ArchitectureMap } from './architecture-map';
import { FrontierReward } from './frontier-reward';
import { LatentBridge } from './latent-bridge';
import { MotSplit } from './mot-split';
import { OnPolicyDistill } from './onpolicy-distill';
import { PosttrainLoop } from './posttrain-loop';
import { ResultRace } from './result-race';
import { ThreeLosses } from './three-losses';
import { PerceptionExplorer } from './perception-explorer';
import { AttentionMask } from './attention-mask';
import { NextCode } from './next-code';
import { AffordanceExplorer, RewardSelector, TrajectorySandbox } from './action-playgrounds';
import { CloudEdge, VlaReplay } from './deployment';
import { TrajectoryMetricsAnimation } from './trajectory-metrics-animation';
import { MotComparisonStatic } from './mot-comparison-static';
import { TrainingStrategyAnimation } from './training-strategy-animation';
import { ExperimentSummaryStatic } from './experiment-summary-static';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-1'] = AnalogyOne;
widgetRegistry['analogy-10'] = Analogy10;
widgetRegistry['analogy-2'] = AnalogyTwo;
widgetRegistry['analogy-3'] = AnalogyThree;
widgetRegistry['analogy-4'] = Analogy4;
widgetRegistry['analogy-5'] = Analogy5;
widgetRegistry['analogy-6'] = Analogy6;
widgetRegistry['analogy-7'] = Analogy7;
widgetRegistry['analogy-8'] = Analogy8;
widgetRegistry['analogy-9'] = Analogy9;
widgetRegistry['architecture-map'] = ArchitectureMap;
widgetRegistry['frontier-reward'] = FrontierReward;
widgetRegistry['gap-repair'] = KitchenGapRepair;
widgetRegistry['gap-stress'] = KitchenGapStress;
widgetRegistry['latent-bridge'] = LatentBridge;
widgetRegistry['mot-split'] = MotSplit;
widgetRegistry['native-resolution'] = KitchenNativeResolution;
widgetRegistry['onpolicy-distill'] = OnPolicyDistill;
widgetRegistry['posttrain-loop'] = PosttrainLoop;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['three-losses'] = ThreeLosses;
widgetRegistry['perception-explorer'] = PerceptionExplorer;
widgetRegistry['attention-mask'] = AttentionMask;
widgetRegistry['next-code'] = NextCode;
widgetRegistry['affordance-explorer'] = AffordanceExplorer;
widgetRegistry['trajectory-sandbox'] = TrajectorySandbox;
widgetRegistry['reward-selector'] = RewardSelector;
widgetRegistry['cloud-edge'] = CloudEdge;
widgetRegistry['vla-replay'] = VlaReplay;
widgetRegistry['trajectory-metrics-animation'] = TrajectoryMetricsAnimation;
widgetRegistry['mot-comparison-static'] = MotComparisonStatic;
widgetRegistry['training-strategy-animation'] = TrainingStrategyAnimation;
widgetRegistry['experiment-summary-static'] = ExperimentSummaryStatic;
