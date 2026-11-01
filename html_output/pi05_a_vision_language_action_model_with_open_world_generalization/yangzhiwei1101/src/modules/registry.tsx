import React from 'react';
import { StrangerKitchen } from './c1s1-stranger-kitchen';
import { FiveSources } from './c1s2-five-sources';
import { SubtaskGate } from './c2s1-subtask-gate';
import { LevelRhythm } from './c2s2-level-rhythm';
import { FlowDenoise } from './c3s1-flow-denoise';
import { AttentionDual } from './c3s2-attention-dual';
import { LocationScale } from './c4s1-location-scale';
import { IngredientAblation } from './c5s1-ingredient-ablation';
import { ModelDuel } from './c5s2-model-duel';
import { WhoCommands } from './c6s1-who-commands';
import { DrawerLoop } from './c7s1-drawer-loop';
import { RecipeBoundary } from './c7s2-recipe-boundary';
import { CoverNewPi05 } from './cover-new-pi05';
import { CoverOldPi0 } from './cover-old-pi0';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['c1s1-stranger-kitchen'] = StrangerKitchen;
widgetRegistry['c1s2-five-sources'] = FiveSources;
widgetRegistry['c2s1-subtask-gate'] = SubtaskGate;
widgetRegistry['c2s2-level-rhythm'] = LevelRhythm;
widgetRegistry['c3s1-flow-denoise'] = FlowDenoise;
widgetRegistry['c3s2-attention-dual'] = AttentionDual;
widgetRegistry['c4s1-location-scale'] = LocationScale;
widgetRegistry['c5s1-ingredient-ablation'] = IngredientAblation;
widgetRegistry['c5s2-model-duel'] = ModelDuel;
widgetRegistry['c6s1-who-commands'] = WhoCommands;
widgetRegistry['c7s1-drawer-loop'] = DrawerLoop;
widgetRegistry['c7s2-recipe-boundary'] = RecipeBoundary;
widgetRegistry['cover-new-pi05'] = CoverNewPi05;
widgetRegistry['cover-old-pi0'] = CoverOldPi0;
