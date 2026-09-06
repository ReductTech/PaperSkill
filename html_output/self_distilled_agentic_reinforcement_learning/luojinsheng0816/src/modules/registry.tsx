import React from 'react';
import {
  HeroOld, HeroNew, Ana1, Ana2, Ana3, Ana4, Ana5, Ana6, Ana7, Ana8, Ana9, Ana10,
  SparseRewardLab, DriftCompare, ContextSwitcher, TrustComparison, GapRuler, SigmoidGate,
  TrainingLoop, HyperparameterBalance, ArchitectureExplorer, RetrievalRobustness,
  StopGradient, ResultsRace,
} from './SdarWidgets';

export interface WidgetProps { chapterId: string; moduleId: string; }
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['ana-7'] = Ana7;
widgetRegistry['ana-8'] = Ana8;
widgetRegistry['ana-9'] = Ana9;
widgetRegistry['ana-10'] = Ana10;
widgetRegistry['ch1-sparse-reward-lab'] = SparseRewardLab;
widgetRegistry['ch1-drift-compare'] = DriftCompare;
widgetRegistry['ch2-context-switcher'] = ContextSwitcher;
widgetRegistry['ch3-trust-comparison'] = TrustComparison;
widgetRegistry['ch4-gap-ruler'] = GapRuler;
widgetRegistry['ch5-sigmoid-gate'] = SigmoidGate;
widgetRegistry['ch6-training-loop'] = TrainingLoop;
widgetRegistry['ch7-hyperparameter-balance'] = HyperparameterBalance;
widgetRegistry['ch8-architecture-explorer'] = ArchitectureExplorer;
widgetRegistry['ch9-retrieval-robustness'] = RetrievalRobustness;
widgetRegistry['ch9-stop-gradient'] = StopGradient;
widgetRegistry['ch10-results-race'] = ResultsRace;
