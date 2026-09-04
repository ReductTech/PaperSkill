import React from 'react';
import { BenchmarkGap } from './benchmark-gap';
import { ClueSearchV2 } from './clue-search-v2';
import { CourseAnalogy } from './course-analogy';
import { DifficultyProgressorV2 } from './difficulty-progressor-v2';
import { DifficultyRecipeV2 } from './difficulty-recipe-v2';
import { L2L3Transition } from './l2-l3-transition';
import { RescueStageStepperV2 } from './rescue-stage-stepper-v2';
import { HeroLoop } from './hero-loop';
import { PaperEvidence } from './paper-evidence';
import { FailureEpisodesV2, StageProfileV2, StageScoreDistanceV2, TcrJudgeV2 } from './metrics-v2';
import { L5CapabilityGapV2, MethodFamiliesV2, TsDifficultyCurveV2 } from './chapter5-results-v2';
import { ExplorationDeclineV2, ReturnMemoryGapV2, StageDiagnosisV2, TrajectoryLabV2 } from './chapter6-diagnosis-v2';
import { AdaptationAcrossLevelsV2, AutoDataPipelineV2, FinetuneBrowserV2, StageAdaptationV2 } from './chapter7-adaptation-v2';
import { Chapter8FinaleV2 } from './chapter8-finale-v2';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['benchmark-gap'] = BenchmarkGap;
widgetRegistry['clue-search-v2'] = ClueSearchV2;
widgetRegistry['course-analogy'] = CourseAnalogy;
widgetRegistry['difficulty-progressor-v2'] = DifficultyProgressorV2;
widgetRegistry['difficulty-recipe-v2'] = DifficultyRecipeV2;
widgetRegistry['l2-l3-transition'] = L2L3Transition;
widgetRegistry['rescue-stage-stepper-v2'] = RescueStageStepperV2;
widgetRegistry['hero-loop'] = HeroLoop;
widgetRegistry['paper-evidence'] = PaperEvidence;
widgetRegistry['failure-episodes-v2'] = FailureEpisodesV2;
widgetRegistry['tcr-judge-v2'] = TcrJudgeV2;
widgetRegistry['stage-score-distance-v2'] = StageScoreDistanceV2;
widgetRegistry['stage-profile-v2'] = StageProfileV2;
widgetRegistry['method-families-v2'] = MethodFamiliesV2;
widgetRegistry['ts-difficulty-curve-v2'] = TsDifficultyCurveV2;
widgetRegistry['l5-capability-gap-v2'] = L5CapabilityGapV2;
widgetRegistry['stage-diagnosis-v2'] = StageDiagnosisV2;
widgetRegistry['exploration-decline-v2'] = ExplorationDeclineV2;
widgetRegistry['return-memory-gap-v2'] = ReturnMemoryGapV2;
widgetRegistry['trajectory-lab-v2'] = TrajectoryLabV2;
widgetRegistry['auto-data-pipeline-v2'] = AutoDataPipelineV2;
widgetRegistry['finetune-browser-v2'] = FinetuneBrowserV2;
widgetRegistry['adaptation-across-levels-v2'] = AdaptationAcrossLevelsV2;
widgetRegistry['stage-adaptation-v2'] = StageAdaptationV2;
widgetRegistry['chapter8-finale-v2'] = Chapter8FinaleV2;
