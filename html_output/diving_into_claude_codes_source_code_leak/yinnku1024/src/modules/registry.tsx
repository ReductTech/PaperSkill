import React from 'react';
import { CacheBoundary } from './cache-boundary';
import { Closing } from './closing';
import { DecoyTools } from './decoy-tools';
import { EvidenceStrength } from './evidence-strength';
import { KairosHeartbeat } from './kairos-heartbeat';
import { LayerLedger } from './layer-ledger';
import { LeakAftermath } from './leak-aftermath';
import { MemoryShelves } from './memory-shelves';
import { OneWayDoors } from './one-way-doors';
import { OpenQuestions } from './open-questions';
import { PrintCover } from './print-cover';
import { ReleaseManifest } from './release-manifest';
import { SourceCards } from './source-cards';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cache-boundary'] = CacheBoundary;
widgetRegistry['closing'] = Closing;
widgetRegistry['decoy-tools'] = DecoyTools;
widgetRegistry['evidence-strength'] = EvidenceStrength;
widgetRegistry['kairos-heartbeat'] = KairosHeartbeat;
widgetRegistry['layer-ledger'] = LayerLedger;
widgetRegistry['leak-aftermath'] = LeakAftermath;
widgetRegistry['memory-shelves'] = MemoryShelves;
widgetRegistry['one-way-doors'] = OneWayDoors;
widgetRegistry['open-questions'] = OpenQuestions;
widgetRegistry['print-cover'] = PrintCover;
widgetRegistry['release-manifest'] = ReleaseManifest;
widgetRegistry['source-cards'] = SourceCards;
