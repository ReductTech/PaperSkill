import React from 'react';
import { L2PAblationWidget } from './l2p-ablation';
import { L2PBoundaryWidget } from './l2p-boundary';
import { L2PCoverNewWidget } from './l2p-cover-new';
import { L2PCoverOldWidget } from './l2p-cover-old';
import { L2PForgettingWidget } from './l2p-forgetting';
import { L2PHyperparamsWidget } from './l2p-hyperparams';
import { L2PLossWidget } from './l2p-loss';
import { L2PNarrativeAnchor } from './l2p-narrative-anchor';
import { L2PPoolWidget } from './l2p-pool';
import { L2PPretokensWidget } from './l2p-pretokens';
import { L2PProtocolWidget } from './l2p-protocol';
import { L2PQueryWidget } from './l2p-query';
import { L2PReadableAnchor } from './l2p-readable-anchor';
import { L2PResultsWidget } from './l2p-results';
import { L2PSelectionWidget } from './l2p-selection';
import { L2PTrainingWidget } from './l2p-training';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['l2p-ablation'] = L2PAblationWidget;
widgetRegistry['l2p-boundary'] = L2PBoundaryWidget;
widgetRegistry['l2p-cover-new'] = L2PCoverNewWidget;
widgetRegistry['l2p-cover-old'] = L2PCoverOldWidget;
widgetRegistry['l2p-forgetting'] = L2PForgettingWidget;
widgetRegistry['l2p-hyperparams'] = L2PHyperparamsWidget;
widgetRegistry['l2p-loss'] = L2PLossWidget;
widgetRegistry['l2p-narrative-anchor'] = L2PNarrativeAnchor;
widgetRegistry['l2p-pool'] = L2PPoolWidget;
widgetRegistry['l2p-pretokens'] = L2PPretokensWidget;
widgetRegistry['l2p-protocol'] = L2PProtocolWidget;
widgetRegistry['l2p-query'] = L2PQueryWidget;
widgetRegistry['l2p-readable-anchor'] = L2PReadableAnchor;
widgetRegistry['l2p-results'] = L2PResultsWidget;
widgetRegistry['l2p-selection'] = L2PSelectionWidget;
widgetRegistry['l2p-training'] = L2PTrainingWidget;
