import type { ComponentType, FC } from 'react';
import { SamplingLab, QuestionLab } from '../components/S1VisualLabs';
import { S2Flow, S2Replan } from '../components/S2Flow';
import { S3What, S3WhereHow, S3Replanning } from '../components/S3Planner';
import { S4Observation, S4EvidenceMemory } from '../components/S4Observer';
import { S5EvidenceGap, S5StopDecision } from '../components/S5Reflector';
import { S6Search, S6Trace } from '../components/S6Case';
import { S7Allocation, S7Results } from '../components/S7Efficiency';
import { S8Benchmarks, S8Results } from '../components/S8Benchmarks';
import { S9Assembly, S9Explorer } from '../components/S9Ablations';
import { S10Replay, S10Evidence, S10Research } from '../components/S10Limits';

// Maps validator IDs to the existing interactive widgets. App.tsx remains the runtime entry.
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
  onComplete?: () => void;
}

const wrap = (Widget: ComponentType<{ onComplete: () => void }>): FC<WidgetProps> =>
  ({ onComplete }) => <Widget onComplete={onComplete ?? (() => {})} />;

export const widgetRegistry: Record<string, FC<WidgetProps>> = {
  'avp-sampling': wrap(SamplingLab),
  'avp-question': wrap(QuestionLab),
  'avp-flow': wrap(S2Flow),
  'avp-replan': wrap(S2Replan),
  'avp-what': wrap(S3What),
  'avp-where-how': wrap(S3WhereHow),
  'avp-replanning': wrap(S3Replanning),
  'avp-observation': wrap(S4Observation),
  'avp-evidence-memory': wrap(S4EvidenceMemory),
  'avp-evidence-gap': wrap(S5EvidenceGap),
  'avp-stop-decision': wrap(S5StopDecision),
  'avp-search': wrap(S6Search),
  'avp-trace': wrap(S6Trace),
  'avp-allocation': wrap(S7Allocation),
  'avp-results': wrap(S7Results),
  'avp-benchmarks': wrap(S8Benchmarks),
  'avp-baseline-results': wrap(S8Results),
  'avp-assembly': wrap(S9Assembly),
  'avp-explorer': wrap(S9Explorer),
  'avp-replay': wrap(S10Replay),
  'avp-evidence': wrap(S10Evidence),
  'avp-research': wrap(S10Research),
};