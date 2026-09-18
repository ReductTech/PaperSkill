import type { FC } from "react";
import { equationTwoSymbols } from "../data/vista4d";
import { FormulaExplorer } from "./FormulaExplorer";
import {
  ApplicationCards,
  CameraDeviationLab,
  ConditioningOverview,
  FinalQuiz,
  FullPipelineOverview,
  HeroCameraLab,
  HeroMethodComparison,
  PlaybackReview,
  PointCloudSourceComparison,
  ProblemMonitor,
  TemporalPersistenceLab,
  TrainingComparison,
} from "./LearningLabs";
import { HeroOfficialDemo } from "./OfficialMedia";
import { PointCloudLab } from "./PointCloudLab";

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

const PointCloudLabMetadataAdapter = () => <PointCloudLab />;
const ConditioningOverviewMetadataAdapter = () => <ConditioningOverview />;
const FormulaExplorerMetadataAdapter = () => (
  <FormulaExplorer
    number="公式 2"
    title="条件 Flow Matching 目标"
    symbols={equationTwoSymbols}
    renderFormula={(s) => <>ℒ = ‖ {s("model", <>ε<sub>θ</sub></>)}( {s("Xtgt", <>X<sub>t</sub><sup>tgt</sup></>)}, {s("render", <>X<sup>src→tgt</sup></>)}, {s("mask", <>M<sup>src→tgt</sup></>)}, {s("source", <>X<sup>src</sup></>)}, {s("camera", <>C<sup>tgt</sup></>)}, {s("time")} ) − {s("velocity", <>V</>)} ‖<sup>2</sup></>}
  />
);
const FinalQuizMetadataAdapter = () => (
  <FinalQuiz onComplete={() => {}} onRestart={() => {}} />
);

export const widgetRegistry: Record<string, FC<WidgetProps>> = {};
widgetRegistry["hero-method-comparison"] = HeroMethodComparison;
widgetRegistry["hero-camera-lab"] = HeroCameraLab;
widgetRegistry["hero-official-demo"] = HeroOfficialDemo;
widgetRegistry["problem-monitor"] = ProblemMonitor;
widgetRegistry["point-cloud-lab"] = PointCloudLabMetadataAdapter;
widgetRegistry["temporal-persistence-lab"] = TemporalPersistenceLab;
widgetRegistry["camera-deviation-lab"] = CameraDeviationLab;
widgetRegistry["training-comparison"] = TrainingComparison;
widgetRegistry["point-cloud-source-comparison"] = PointCloudSourceComparison;
widgetRegistry["conditioning-overview"] = ConditioningOverviewMetadataAdapter;
widgetRegistry["formula-explorer"] = FormulaExplorerMetadataAdapter;
widgetRegistry["full-pipeline-overview"] = FullPipelineOverview;
widgetRegistry["playback-review"] = PlaybackReview;
widgetRegistry["application-cards"] = ApplicationCards;
widgetRegistry["final-quiz"] = FinalQuizMetadataAdapter;
