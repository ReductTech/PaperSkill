import React from 'react';
import { SGAblation } from './s-g-ablation';
import { SGBackbone } from './s-g-backbone';
import { SGBoundary } from './s-g-boundary';
import { SGCover } from './s-g-cover';
import { SGDomain } from './s-g-domain';
import { SGGroundgate } from './s-g-groundgate';
import { SGResidual } from './s-g-residual';
import { SGResults } from './s-g-results';
import { SGScenegate } from './s-g-scenegate';
import { SGSemantics } from './s-g-semantics';
import { SGShared } from './s-g-shared';
import { SGTraining } from './s-g-training';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['s-g-ablation'] = SGAblation;
widgetRegistry['s-g-backbone'] = SGBackbone;
widgetRegistry['s-g-boundary'] = SGBoundary;
widgetRegistry['s-g-cover'] = SGCover;
widgetRegistry['s-g-domain'] = SGDomain;
widgetRegistry['s-g-groundgate'] = SGGroundgate;
widgetRegistry['s-g-residual'] = SGResidual;
widgetRegistry['s-g-results'] = SGResults;
widgetRegistry['s-g-scenegate'] = SGScenegate;
widgetRegistry['s-g-semantics'] = SGSemantics;
widgetRegistry['s-g-shared'] = SGShared;
widgetRegistry['s-g-training'] = SGTraining;
