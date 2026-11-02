import React from 'react';
import { BatchScene } from './batch-scene';
import { CandidateScene } from './candidate-scene';
import { ClipCover } from './clip-cover';
import { CosineScene } from './cosine-scene';
import { CountingScene } from './counting-scene';
import { EncoderScene } from './encoder-scene';
import { EnsembleScene } from './ensemble-scene';
import { GradientScene } from './gradient-scene';
import { LabelsScene } from './labels-scene';
import { PairsScene } from './pairs-scene';
import { PromptScene } from './prompt-scene';
import { RobustnessScene } from './robustness-scene';
import { SymmetricScene } from './symmetric-scene';
import { TemperatureScene } from './temperature-scene';
import { TransferScene } from './transfer-scene';
import { ZeroShotScene } from './zero-shot-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['batch-scene'] = BatchScene;
widgetRegistry['candidate-scene'] = CandidateScene;
widgetRegistry['clip-cover'] = ClipCover;
widgetRegistry['cosine-scene'] = CosineScene;
widgetRegistry['counting-scene'] = CountingScene;
widgetRegistry['encoder-scene'] = EncoderScene;
widgetRegistry['ensemble-scene'] = EnsembleScene;
widgetRegistry['gradient-scene'] = GradientScene;
widgetRegistry['labels-scene'] = LabelsScene;
widgetRegistry['pairs-scene'] = PairsScene;
widgetRegistry['prompt-scene'] = PromptScene;
widgetRegistry['robustness-scene'] = RobustnessScene;
widgetRegistry['symmetric-scene'] = SymmetricScene;
widgetRegistry['temperature-scene'] = TemperatureScene;
widgetRegistry['transfer-scene'] = TransferScene;
widgetRegistry['zero-shot-scene'] = ZeroShotScene;
