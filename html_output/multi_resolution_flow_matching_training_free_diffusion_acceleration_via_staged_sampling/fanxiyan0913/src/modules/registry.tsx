import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  TimeCost, ResolutionTokens, StagedSampling, EulerTrace, NoiseChips,
  CompareNav, TradeoffBars, PipelineMap, SpeedupRace, LrSources, SrChoices,
} from './mrfmModules';
import { SketchAnalogy } from './mrfmAnalogies';
import { StaticFigure } from './staticFigure';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Every paper-specific canvas widget must be registered here.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['sketch-analogy'] = SketchAnalogy;
widgetRegistry['static-figure'] = StaticFigure;

widgetRegistry['time-cost'] = TimeCost;
widgetRegistry['resolution-tokens'] = ResolutionTokens;
widgetRegistry['staged-sampling'] = StagedSampling;
widgetRegistry['euler-trace'] = EulerTrace;
widgetRegistry['noise-chips'] = NoiseChips;
widgetRegistry['compare-nav'] = CompareNav;
widgetRegistry['tradeoff-bars'] = TradeoffBars;
widgetRegistry['pipeline-map'] = PipelineMap;
widgetRegistry['speedup-race'] = SpeedupRace;
widgetRegistry['lr-sources'] = LrSources;
widgetRegistry['sr-choices'] = SrChoices;
