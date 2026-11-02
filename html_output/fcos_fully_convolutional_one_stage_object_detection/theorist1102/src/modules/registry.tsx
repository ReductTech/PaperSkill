import React from 'react';
import { AnchorDrawer } from './anchor-drawer';
import { CenterNess } from './center-ness';
import { CoverAnchors } from './cover-anchors';
import { CoverFcos } from './cover-fcos';
import { EdgeMeasure } from './edge-measure';
import { FpnLevels } from './fpn-levels';
import { LimitDesk } from './limit-desk';
import { MinivalBars } from './minival-bars';
import { NmsKeep } from './nms-keep';
import { OverlapChoice } from './overlap-choice';
import { OverlapRepair } from './overlap-repair';
import { TestdevBars } from './testdev-bars';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['anchor-drawer'] = AnchorDrawer;
widgetRegistry['center-ness'] = CenterNess;
widgetRegistry['cover-anchors'] = CoverAnchors;
widgetRegistry['cover-fcos'] = CoverFcos;
widgetRegistry['edge-measure'] = EdgeMeasure;
widgetRegistry['fpn-levels'] = FpnLevels;
widgetRegistry['limit-desk'] = LimitDesk;
widgetRegistry['minival-bars'] = MinivalBars;
widgetRegistry['nms-keep'] = NmsKeep;
widgetRegistry['overlap-choice'] = OverlapChoice;
widgetRegistry['overlap-repair'] = OverlapRepair;
widgetRegistry['testdev-bars'] = TestdevBars;
