import React from 'react';
import { CoverAdaptive } from './cover-adaptive';
import { CoverFixed } from './cover-fixed';
import { S1Unseen } from './s1-unseen';
import { S10Ablation } from './s10-ablation';
import { S11Boundary } from './s11-boundary';
import { S2Harness } from './s2-harness';
import { S3Ops } from './s3-ops';
import { S4Request } from './s4-request';
import { S5Stages } from './s5-stages';
import { S6Integrate } from './s6-integrate';
import { S7Coevolve } from './s7-coevolve';
import { S8Budget } from './s8-budget';
import { S9Results } from './s9-results';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-adaptive'] = CoverAdaptive;
widgetRegistry['cover-fixed'] = CoverFixed;
widgetRegistry['s1-unseen'] = S1Unseen;
widgetRegistry['s10-ablation'] = S10Ablation;
widgetRegistry['s11-boundary'] = S11Boundary;
widgetRegistry['s2-harness'] = S2Harness;
widgetRegistry['s3-ops'] = S3Ops;
widgetRegistry['s4-request'] = S4Request;
widgetRegistry['s5-stages'] = S5Stages;
widgetRegistry['s6-integrate'] = S6Integrate;
widgetRegistry['s7-coevolve'] = S7Coevolve;
widgetRegistry['s8-budget'] = S8Budget;
widgetRegistry['s9-results'] = S9Results;
