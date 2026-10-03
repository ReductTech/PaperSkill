import { ConsistencyPaths, HybridResults } from './consistency-paths';
import { Limitations } from './limitations';
import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ActionSpace } from './action-space';
import { Analogy1 } from './analogy1';
import { Analogy10 } from './analogy10';
import { Analogy2 } from './analogy2';
import { Analogy3 } from './analogy3';
import { Analogy4 } from './analogy4';
import { Analogy5 } from './analogy5';
import { Analogy6 } from './analogy6';
import { Analogy7 } from './analogy7';
import { Analogy8 } from './analogy8';
import { Analogy9 } from './analogy9';
import { FailureModes } from './failure-modes';
import { FallbackRule } from './fallback-rule';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { MethodCompare } from './method-compare';
import { PromptModes } from './prompt-modes';
import { RepairTrace } from './repair-trace';
import { ResultRace } from './result-race';
import { SceneKit } from './scene-kit';
import { SourceDrag } from './source-drag';
import { SystemMap } from './system-map';
import { TrainingModes } from './training-modes';
import { WikiTools } from './wiki-tools';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['action-space'] = ActionSpace;
widgetRegistry['analogy1'] = Analogy1;
widgetRegistry['analogy10'] = Analogy10;
widgetRegistry['analogy2'] = Analogy2;
widgetRegistry['analogy3'] = Analogy3;
widgetRegistry['analogy4'] = Analogy4;
widgetRegistry['analogy5'] = Analogy5;
widgetRegistry['analogy6'] = Analogy6;
widgetRegistry['analogy7'] = Analogy7;
widgetRegistry['analogy8'] = Analogy8;
widgetRegistry['analogy9'] = Analogy9;
widgetRegistry['failure-modes'] = FailureModes;
widgetRegistry['fallback-rule'] = FallbackRule;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['method-compare'] = MethodCompare;
widgetRegistry['prompt-modes'] = PromptModes;
widgetRegistry['repair-trace'] = RepairTrace;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['scene-kit'] = SceneKit;
widgetRegistry['source-drag'] = SourceDrag;
widgetRegistry['system-map'] = SystemMap;
widgetRegistry['training-modes'] = TrainingModes;
widgetRegistry['wiki-tools'] = WikiTools;

widgetRegistry['limitations'] = Limitations;

widgetRegistry['consistency-paths'] = ConsistencyPaths;
widgetRegistry['hybrid-results'] = HybridResults;
