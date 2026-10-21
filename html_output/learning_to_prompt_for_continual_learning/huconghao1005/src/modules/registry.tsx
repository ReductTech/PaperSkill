import React from 'react';
import { ChangeForme } from './change-forme';
import { CheckTags } from './check-tags';
import { ClassRecorder } from './class-recorder';
import { CombineCases } from './combine-cases';
import { ComposeHead } from './compose-head';
import { CutPaper } from './cut-paper';
import { DisputePanel } from './dispute-panel';
import { FiveStepPipeline } from './five-step-pipeline';
import { FormeArchitecture } from './forme-architecture';
import { LambdaCord } from './lambda-cord';
import { ResultRace } from './result-race';
import { SelectCount } from './select-count';
import { ShiftCell } from './shift-cell';
import { TaskIdToggle } from './task-id-toggle';
import { ThreeKnobs } from './three-knobs';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['change-forme'] = ChangeForme;
widgetRegistry['check-tags'] = CheckTags;
widgetRegistry['class-recorder'] = ClassRecorder;
widgetRegistry['combine-cases'] = CombineCases;
widgetRegistry['compose-head'] = ComposeHead;
widgetRegistry['cut-paper'] = CutPaper;
widgetRegistry['dispute-panel'] = DisputePanel;
widgetRegistry['five-step-pipeline'] = FiveStepPipeline;
widgetRegistry['forme-architecture'] = FormeArchitecture;
widgetRegistry['lambda-cord'] = LambdaCord;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['select-count'] = SelectCount;
widgetRegistry['shift-cell'] = ShiftCell;
widgetRegistry['task-id-toggle'] = TaskIdToggle;
widgetRegistry['three-knobs'] = ThreeKnobs;
