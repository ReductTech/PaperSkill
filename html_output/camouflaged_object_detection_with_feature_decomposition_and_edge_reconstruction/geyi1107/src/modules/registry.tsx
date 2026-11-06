import React from 'react';
import { FederAblation } from './feder-ablation';
import { FederAttention } from './feder-attention';
import { FederBoundary } from './feder-boundary';
import { FederChallenge } from './feder-challenge';
import { FederCover } from './feder-cover';
import { FederDwd } from './feder-dwd';
import { FederLoss } from './feder-loss';
import { FederOer } from './feder-oer';
import { FederResults } from './feder-results';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['feder-ablation'] = FederAblation;
widgetRegistry['feder-attention'] = FederAttention;
widgetRegistry['feder-boundary'] = FederBoundary;
widgetRegistry['feder-challenge'] = FederChallenge;
widgetRegistry['feder-cover'] = FederCover;
widgetRegistry['feder-dwd'] = FederDwd;
widgetRegistry['feder-loss'] = FederLoss;
widgetRegistry['feder-oer'] = FederOer;
widgetRegistry['feder-results'] = FederResults;
