import React from 'react';
import { CafeCover } from './cafe-cover';
import { DecoyTools } from './decoy-tools';
import { FeatureGates } from './feature-gates';
import { FrustrationRegex } from './frustration-regex';
import { IncidentEvidence } from './incident-evidence';
import { NativeSeal } from './native-seal';
import { NightPermissions } from './night-permissions';
import { PrivacyCredit } from './privacy-credit';
import { PromptPrefix } from './prompt-prefix';
import { RetryBudget } from './retry-budget';
import { RoadmapBoundary } from './roadmap-boundary';
import { SourceBoundary } from './source-boundary';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cafe-cover'] = CafeCover;
widgetRegistry['decoy-tools'] = DecoyTools;
widgetRegistry['feature-gates'] = FeatureGates;
widgetRegistry['frustration-regex'] = FrustrationRegex;
widgetRegistry['incident-evidence'] = IncidentEvidence;
widgetRegistry['native-seal'] = NativeSeal;
widgetRegistry['night-permissions'] = NightPermissions;
widgetRegistry['privacy-credit'] = PrivacyCredit;
widgetRegistry['prompt-prefix'] = PromptPrefix;
widgetRegistry['retry-budget'] = RetryBudget;
widgetRegistry['roadmap-boundary'] = RoadmapBoundary;
widgetRegistry['source-boundary'] = SourceBoundary;
