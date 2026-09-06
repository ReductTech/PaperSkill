import React from 'react';
import { CodecSignalInspector } from './codec-signal-inspector';
import { CoreLinesExplainer } from './core-lines-explainer';
import { DenseTokenGrowth } from './dense-token-growth';
import { FootballAnalogy } from './football-analogy';
import { FramePatchComparison } from './frame-patch-comparison';
import { HeroFootballComparison } from './hero-football-comparison';
import { ImportanceModeSwitcher } from './importance-mode-switcher';
import { MatchedBudgetExplorer } from './matched-budget-explorer';
import { MotionCompensationLab } from './motion-compensation-lab';
import { RopePositionInspector } from './rope-position-inspector';
import { StreamingArchitectureMap } from './streaming-architecture-map';
import { TokenBudgetSelector } from './token-budget-selector';
import { TrainingCurriculumStepper } from './training-curriculum-stepper';
import { UnifiedInputRouter } from './unified-input-router';
import { VerifiedResultRace } from './verified-result-race';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['codec-signal-inspector'] = CodecSignalInspector;
widgetRegistry['core-lines-explainer'] = CoreLinesExplainer;
widgetRegistry['dense-token-growth'] = DenseTokenGrowth;
widgetRegistry['football-analogy'] = FootballAnalogy;
widgetRegistry['frame-patch-comparison'] = FramePatchComparison;
widgetRegistry['hero-football-comparison'] = HeroFootballComparison;
widgetRegistry['importance-mode-switcher'] = ImportanceModeSwitcher;
widgetRegistry['matched-budget-explorer'] = MatchedBudgetExplorer;
widgetRegistry['motion-compensation-lab'] = MotionCompensationLab;
widgetRegistry['rope-position-inspector'] = RopePositionInspector;
widgetRegistry['streaming-architecture-map'] = StreamingArchitectureMap;
widgetRegistry['token-budget-selector'] = TokenBudgetSelector;
widgetRegistry['training-curriculum-stepper'] = TrainingCurriculumStepper;
widgetRegistry['unified-input-router'] = UnifiedInputRouter;
widgetRegistry['verified-result-race'] = VerifiedResultRace;
