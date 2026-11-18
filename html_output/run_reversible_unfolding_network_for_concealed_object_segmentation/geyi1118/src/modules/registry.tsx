import React from 'react';
import { CoverMask } from './cover-mask';
import { CoverRun } from './cover-run';
import { DomainConflictScene } from './domain-conflict-scene';
import { LimitsScene } from './limits-scene';
import { LossScene } from './loss-scene';
import { ResultsScene } from './results-scene';
import { RunPlusScene } from './runplus-scene';
import { SeparationScene } from './separation-scene';
import { SofsScene } from './sofs-scene';
import { SparsityScene } from './sparsity-scene';
import { TransferScene } from './transfer-scene';
import { UnfoldScene } from './unfold-scene';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-mask'] = CoverMask;
widgetRegistry['cover-run'] = CoverRun;
widgetRegistry['domain-conflict-scene'] = DomainConflictScene;
widgetRegistry['limits-scene'] = LimitsScene;
widgetRegistry['loss-scene'] = LossScene;
widgetRegistry['results-scene'] = ResultsScene;
widgetRegistry['runplus-scene'] = RunPlusScene;
widgetRegistry['separation-scene'] = SeparationScene;
widgetRegistry['sofs-scene'] = SofsScene;
widgetRegistry['sparsity-scene'] = SparsityScene;
widgetRegistry['transfer-scene'] = TransferScene;
widgetRegistry['unfold-scene'] = UnfoldScene;
