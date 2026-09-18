import React from 'react';
import { FixedHMission, HorizonChoice } from './chapter1Experience';
import { ChunkBuilder, VlaroleMap } from './chapter2Basics';
import { CorrectorTrainer, ResidualObserver } from './chapter3Learning';
import { CosineChallenge, RobustTrigger } from './chapter4Play';
import { OggWorkshop, ReplanComparison } from './chapter5Play';
import { RecoveryMission, SystemPath } from './chapter6Play';
import { DeploymentJudge, ResultRace } from './chapter7Play';
import { StudioAnalogy } from './studioAnalogy';
import { StudioHero } from './studioHero';

if (typeof document !== 'undefined') document.title = 'VLA-Corrector｜检测、截断、纠正与恢复';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['studio-hero'] = StudioHero;
widgetRegistry['studio-analogy'] = StudioAnalogy;
widgetRegistry['fixed-h-mission'] = FixedHMission;
widgetRegistry['horizon-choice'] = HorizonChoice;
widgetRegistry['chunk-builder'] = ChunkBuilder;
widgetRegistry['vla-role-map'] = VlaroleMap;
widgetRegistry['residual-observer'] = ResidualObserver;
widgetRegistry['corrector-trainer'] = CorrectorTrainer;
widgetRegistry['cosine-challenge'] = CosineChallenge;
widgetRegistry['robust-trigger'] = RobustTrigger;
widgetRegistry['replan-comparison'] = ReplanComparison;
widgetRegistry['ogg-workshop'] = OggWorkshop;
widgetRegistry['recovery-mission'] = RecoveryMission;
widgetRegistry['system-path'] = SystemPath;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['deployment-judge'] = DeploymentJudge;
