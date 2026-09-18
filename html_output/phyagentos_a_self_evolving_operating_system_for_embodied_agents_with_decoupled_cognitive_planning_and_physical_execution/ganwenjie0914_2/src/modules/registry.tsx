import React from 'react';
import { AnalogyScene } from './AnalogyScene';
import { RoleMap } from './RoleMap';
import { ReturnCodeLab } from './ReturnCodeLab';
import { OSLayerBuilder } from './OSLayerBuilder';
import { ArchGraph } from './ArchGraph';
import { ProtocolViews } from './ProtocolViews';
import { SessionLifecycle } from './SessionLifecycle';
import { PreflightLab } from './PreflightLab';
import { DualFlow } from './DualFlow';
import { VerifierLab } from './VerifierLab';
import { ArchMap } from './ArchMap';
import { GrandLoop } from './GrandLoop';
import { TierLadder } from './TierLadder';
import { FiveLayers } from './FiveLayers';
import { BenchmarkLab } from './BenchmarkLab';
import { ClaimChecker } from './ClaimChecker';
import { GrandTrail } from './GrandTrail';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hike-analogy'] = AnalogyScene;
widgetRegistry['role-map'] = RoleMap;
widgetRegistry['return-code-lab'] = ReturnCodeLab;
widgetRegistry['os-layer-builder'] = OSLayerBuilder;
widgetRegistry['arch-graph'] = ArchGraph;
widgetRegistry['protocol-views'] = ProtocolViews;
widgetRegistry['session-lifecycle'] = SessionLifecycle;
widgetRegistry['preflight-lab'] = PreflightLab;
widgetRegistry['dual-flow'] = DualFlow;
widgetRegistry['verifier-lab'] = VerifierLab;
widgetRegistry['arch-map'] = ArchMap;
widgetRegistry['grand-loop'] = GrandLoop;
widgetRegistry['tier-ladder'] = TierLadder;
widgetRegistry['five-layers'] = FiveLayers;
widgetRegistry['benchmark-lab'] = BenchmarkLab;
widgetRegistry['claim-checker'] = ClaimChecker;
widgetRegistry['grand-trail'] = GrandTrail;
