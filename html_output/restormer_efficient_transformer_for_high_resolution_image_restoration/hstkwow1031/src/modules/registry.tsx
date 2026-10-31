import React from 'react';
import { Ablations } from './rest-ablations';
import { AttentionScale } from './rest-alpha';
import { GlobalBoundary } from './rest-boundary';
import { ChannelAttention } from './rest-channel';
import { Complexity } from './rest-complexity';
import { RestCover } from './rest-cover';
import { GatedFeedforward } from './rest-gdfn';
import { LocalContext } from './rest-local';
import { MotionResults } from './rest-motion';
import { ResidualRestore } from './rest-residual';
import { Multiscale } from './rest-scale';
import { TaskResults } from './rest-tasks';
import { ProgressiveTraining } from './rest-training';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['rest-ablations'] = Ablations;
widgetRegistry['rest-alpha'] = AttentionScale;
widgetRegistry['rest-boundary'] = GlobalBoundary;
widgetRegistry['rest-channel'] = ChannelAttention;
widgetRegistry['rest-complexity'] = Complexity;
widgetRegistry['rest-cover'] = RestCover;
widgetRegistry['rest-gdfn'] = GatedFeedforward;
widgetRegistry['rest-local'] = LocalContext;
widgetRegistry['rest-motion'] = MotionResults;
widgetRegistry['rest-residual'] = ResidualRestore;
widgetRegistry['rest-scale'] = Multiscale;
widgetRegistry['rest-tasks'] = TaskResults;
widgetRegistry['rest-training'] = ProgressiveTraining;
