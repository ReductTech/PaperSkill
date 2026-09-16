import React from 'react';
import { HeroPoints } from './hero-points';
import { AnalogyNote } from './analogy-note';
import { RoleMap } from './RoleMap';
import { ReturnCodeLab } from './ReturnCodeLab';
import { OSLayerBuilder } from './OSLayerBuilder';
import { ProtocolViews } from './ProtocolViews';
import { SessionLifecycle } from './SessionLifecycle';
import { DualFlow } from './DualFlow';
import { VerifierLab } from './VerifierLab';
import { ArchMap } from './ArchMap';
import { TierLadder } from './TierLadder';
import { FiveLayers } from './FiveLayers';
import { BenchmarkLab } from './BenchmarkLab';
import { ClaimChecker } from './ClaimChecker';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hero-points'] = HeroPoints;
widgetRegistry['analogy-note'] = AnalogyNote;
widgetRegistry['role-map'] = RoleMap;
widgetRegistry['return-code-lab'] = ReturnCodeLab;
widgetRegistry['os-layer-builder'] = OSLayerBuilder;
widgetRegistry['protocol-views'] = ProtocolViews;
widgetRegistry['session-lifecycle'] = SessionLifecycle;
widgetRegistry['dual-flow'] = DualFlow;
widgetRegistry['verifier-lab'] = VerifierLab;
widgetRegistry['arch-map'] = ArchMap;
widgetRegistry['tier-ladder'] = TierLadder;
widgetRegistry['five-layers'] = FiveLayers;
widgetRegistry['benchmark-lab'] = BenchmarkLab;
widgetRegistry['claim-checker'] = ClaimChecker;
