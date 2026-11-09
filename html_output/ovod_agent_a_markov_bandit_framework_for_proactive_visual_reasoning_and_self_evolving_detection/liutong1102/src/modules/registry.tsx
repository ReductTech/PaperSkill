import React from 'react';
import { CoverNew } from './cover-new';
import { CoverOld } from './cover-old';
import { SceneDistill } from './ovod-distill';
import { SceneEvidence } from './ovod-evidence';
import { SceneFailure } from './ovod-failure';
import { SceneInference } from './ovod-inference';
import { SceneMarkov } from './ovod-markov';
import { SceneOperators } from './ovod-operators';
import { ScenePlan } from './ovod-plan';
import { SceneQuery } from './ovod-query';
import { SceneReward } from './ovod-reward';
import { SceneUCB } from './ovod-ucb';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-new'] = CoverNew;
widgetRegistry['cover-old'] = CoverOld;
widgetRegistry['ovod-distill'] = SceneDistill;
widgetRegistry['ovod-evidence'] = SceneEvidence;
widgetRegistry['ovod-failure'] = SceneFailure;
widgetRegistry['ovod-inference'] = SceneInference;
widgetRegistry['ovod-markov'] = SceneMarkov;
widgetRegistry['ovod-operators'] = SceneOperators;
widgetRegistry['ovod-plan'] = ScenePlan;
widgetRegistry['ovod-query'] = SceneQuery;
widgetRegistry['ovod-reward'] = SceneReward;
widgetRegistry['ovod-ucb'] = SceneUCB;
