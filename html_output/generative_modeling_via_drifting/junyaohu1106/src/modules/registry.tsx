import React from 'react';
import { AlgorithmMlp } from './algorithm-mlp';
import { AntisymmetryBalance } from './antisymmetry-balance';
import { CfgNegatives } from './cfg-negatives';
import { CollapseRepair } from './collapse-repair';
import { CoverIteration } from './cover-iteration';
import { DriftField } from './drift-field';
import { FeatureSpace } from './feature-space';
import { FrozenTarget } from './frozen-target';
import { ImagenetResults } from './imagenet-results';
import { IterationPlace } from './iteration-place';
import { KernelTemperature } from './kernel-temperature';
import { OpenLimits } from './open-limits';
import { PushforwardFlags } from './pushforward-flags';
import { RobotPolicy } from './robot-policy';
import { SampleBudget } from './sample-budget';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['algorithm-mlp'] = AlgorithmMlp;
widgetRegistry['antisymmetry-balance'] = AntisymmetryBalance;
widgetRegistry['cfg-negatives'] = CfgNegatives;
widgetRegistry['collapse-repair'] = CollapseRepair;
widgetRegistry['cover-iteration'] = CoverIteration;
widgetRegistry['drift-field'] = DriftField;
widgetRegistry['feature-space'] = FeatureSpace;
widgetRegistry['frozen-target'] = FrozenTarget;
widgetRegistry['imagenet-results'] = ImagenetResults;
widgetRegistry['iteration-place'] = IterationPlace;
widgetRegistry['kernel-temperature'] = KernelTemperature;
widgetRegistry['open-limits'] = OpenLimits;
widgetRegistry['pushforward-flags'] = PushforwardFlags;
widgetRegistry['robot-policy'] = RobotPolicy;
widgetRegistry['sample-budget'] = SampleBudget;
