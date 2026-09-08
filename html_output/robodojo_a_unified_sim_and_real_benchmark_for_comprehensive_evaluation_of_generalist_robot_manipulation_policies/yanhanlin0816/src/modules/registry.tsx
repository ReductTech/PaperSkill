import React from 'react';
import {
  AnalogyScene,
  CapabilitySelector,
  DiagnosticPassport,
  EvalScopeSwitch,
  HeroNew,
  HeroOld,
  LayoutOverlayDrag,
  LeaderboardMountain,
  OverallCalculator,
  ParallelismStepper,
  ResultRace,
  ScoreStepper,
  SimRealSync,
  SingleScoreProbe,
  StabilitySwitch,
  SweepBlocksProbe,
  SystemArchitecture,
} from './robodojoModules';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['single-score-probe'] = SingleScoreProbe;
widgetRegistry['sweep-blocks-probe'] = SweepBlocksProbe;
widgetRegistry['eval-scope-switch'] = EvalScopeSwitch;
widgetRegistry['capability-selector'] = CapabilitySelector;
widgetRegistry['score-stepper'] = ScoreStepper;
widgetRegistry['overall-calculator'] = OverallCalculator;
widgetRegistry['sim-real-sync'] = SimRealSync;
widgetRegistry['system-architecture'] = SystemArchitecture;
widgetRegistry['parallelism-stepper'] = ParallelismStepper;
widgetRegistry['layout-overlay-drag'] = LayoutOverlayDrag;
widgetRegistry['stability-switch'] = StabilitySwitch;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['leaderboard-mountain'] = LeaderboardMountain;
widgetRegistry['diagnostic-passport'] = DiagnosticPassport;
