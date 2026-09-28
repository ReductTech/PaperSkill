import React from "react";

import {
  LwfHero,
  ProblemCompare,
} from "./problem-compare";

import { ArchitectureMap } from "./architecture-map";
import { SignalSource } from "./signal-source";
import { TrainingSteps } from "./training-steps";
import { TermHints } from "./term-hints";
import { v3WidgetRegistry } from "./v3-widgets";

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

function withChapterHints(
  Widget: React.FC<WidgetProps>,
): React.FC<WidgetProps> {
  return function PaperWidget(props: WidgetProps) {
    return (
      <>
        {props.moduleId.endsWith(".1") ? (
          <TermHints chapterId={props.chapterId} />
        ) : null}

        <Widget {...props} />
      </>
    );
  };
}

export const widgetRegistry: Record<
  string,
  React.FC<WidgetProps>
> = {};

/* -------------------------------------------------------------------------- */
/*  Chapters 00–03 / legacy-compatible widgets                               */
/* -------------------------------------------------------------------------- */

widgetRegistry["lwf-hero"] =
  withChapterHints(LwfHero);

widgetRegistry["problem-compare"] =
  withChapterHints(ProblemCompare);

widgetRegistry["architecture-map"] =
  withChapterHints(ArchitectureMap);

widgetRegistry["signal-source"] =
  withChapterHints(SignalSource);

widgetRegistry["training-steps"] =
  withChapterHints(TrainingSteps);

/* -------------------------------------------------------------------------- */
/*  Chapters 04–07 / LwF v3 widgets                                          */
/* -------------------------------------------------------------------------- */

widgetRegistry["lwf-preservation-compare"] =
  v3WidgetRegistry["lwf-preservation-compare"];

widgetRegistry["lwf-objective-balance"] =
  v3WidgetRegistry["lwf-objective-balance"];

widgetRegistry["lwf-coverage-boundary"] =
  v3WidgetRegistry["lwf-coverage-boundary"];

widgetRegistry["lwf-task-handoff"] =
  v3WidgetRegistry["lwf-task-handoff"];

widgetRegistry["lwf-evidence-explorer"] =
  v3WidgetRegistry["lwf-evidence-explorer"];

widgetRegistry["lwf-grand-trail"] =
  v3WidgetRegistry["lwf-grand-trail"];
