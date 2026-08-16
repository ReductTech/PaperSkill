import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DebatePanel } from './debate-panel';
import { EvidenceGate } from './evidence-gate';
import { FailureRoute } from './failure-route';
import { HeroFlow } from './hero-flow';
import { HitlModes } from './hitl-modes';
import { LessonDecay } from './lesson-decay';
import { LinearContrast } from './linear-contrast';
import { NotebookAnalogy } from './notebook-analogy';
import { PhaseMap } from './phase-map';
import { PivotRefine } from './pivot-refine';
import { ProtocolLab } from './protocol-lab';
import { SystemMap } from './system-map';
import { T10Race } from './t10-race';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['debate-panel'] = DebatePanel;
widgetRegistry['evidence-gate'] = EvidenceGate;
widgetRegistry['failure-route'] = FailureRoute;
widgetRegistry['hero-flow'] = HeroFlow;
widgetRegistry['hitl-modes'] = HitlModes;
widgetRegistry['lesson-decay'] = LessonDecay;
widgetRegistry['linear-contrast'] = LinearContrast;
widgetRegistry['notebook-analogy'] = NotebookAnalogy;
widgetRegistry['phase-map'] = PhaseMap;
widgetRegistry['pivot-refine'] = PivotRefine;
widgetRegistry['protocol-lab'] = ProtocolLab;
widgetRegistry['system-map'] = SystemMap;
widgetRegistry['t10-race'] = T10Race;
