import React from 'react';
import { BinaryBudget } from './binary-budget';
import { Closing } from './closing';
import { DispatchCover } from './dispatch-cover';
import { EngineTurn } from './engine-turn';
import { EvidenceTable } from './evidence-table';
import { FeatureFlags } from './feature-flags';
import { InkLayout } from './ink-layout';
import { PipelineFlow } from './pipeline-flow';
import { SourceCards } from './source-cards';
import { StartupBudget } from './startup-budget';
import { StateGraph } from './state-graph';
import { ToolContract } from './tool-contract';
import { TransferMap } from './transfer-map';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['binary-budget'] = BinaryBudget;
widgetRegistry['closing'] = Closing;
widgetRegistry['dispatch-cover'] = DispatchCover;
widgetRegistry['engine-turn'] = EngineTurn;
widgetRegistry['evidence-table'] = EvidenceTable;
widgetRegistry['feature-flags'] = FeatureFlags;
widgetRegistry['ink-layout'] = InkLayout;
widgetRegistry['pipeline-flow'] = PipelineFlow;
widgetRegistry['source-cards'] = SourceCards;
widgetRegistry['startup-budget'] = StartupBudget;
widgetRegistry['state-graph'] = StateGraph;
widgetRegistry['tool-contract'] = ToolContract;
widgetRegistry['transfer-map'] = TransferMap;
