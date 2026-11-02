import React from 'react';
import { DerCover } from './c-der-cover';
import { S1MixedDrawer } from './s1-mixed-drawer';
import { S10Cifar } from './s10-cifar';
import { S10Protocol } from './s10-protocol';
import { S11Imagenet } from './s11-imagenet';
import { S12Transfer } from './s12-transfer';
import { S13Budget } from './s13-budget';
import { S2ThreeRoutes } from './s2-three-routes';
import { S3FreezeExpand } from './s3-freeze-expand';
import { S4SuperFeature } from './s4-super-feature';
import { S5AuxLoss } from './s5-aux-loss';
import { S6Mask } from './s6-mask';
import { S7Anneal } from './s7-anneal';
import { S8PruneCost } from './s8-prune-cost';
import { S9BalancedHead } from './s9-balanced-head';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['c-der-cover'] = DerCover;
widgetRegistry['s1-mixed-drawer'] = S1MixedDrawer;
widgetRegistry['s10-cifar'] = S10Cifar;
widgetRegistry['s10-protocol'] = S10Protocol;
widgetRegistry['s11-imagenet'] = S11Imagenet;
widgetRegistry['s12-transfer'] = S12Transfer;
widgetRegistry['s13-budget'] = S13Budget;
widgetRegistry['s2-three-routes'] = S2ThreeRoutes;
widgetRegistry['s3-freeze-expand'] = S3FreezeExpand;
widgetRegistry['s4-super-feature'] = S4SuperFeature;
widgetRegistry['s5-aux-loss'] = S5AuxLoss;
widgetRegistry['s6-mask'] = S6Mask;
widgetRegistry['s7-anneal'] = S7Anneal;
widgetRegistry['s8-prune-cost'] = S8PruneCost;
widgetRegistry['s9-balanced-head'] = S9BalancedHead;
