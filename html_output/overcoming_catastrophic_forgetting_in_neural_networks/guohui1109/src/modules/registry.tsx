import React from 'react';
import { EwcAtari } from './ewc-atari';
import { EwcCover } from './ewc-cover';
import { EwcFisher } from './ewc-fisher';
import { EwcFmn } from './ewc-fmn';
import { EwcForget } from './ewc-forget';
import { EwcLaplace } from './ewc-laplace';
import { EwcLimits } from './ewc-limits';
import { EwcMerge } from './ewc-merge';
import { EwcMnist } from './ewc-mnist';
import { EwcOverlap } from './ewc-overlap';
import { EwcRepair } from './ewc-repair';
import { EwcRoutes } from './ewc-routes';
import { EwcSprings } from './ewc-springs';
import { EwcWorkbench } from './ewc-workbench';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['ewc-atari'] = EwcAtari;
widgetRegistry['ewc-cover'] = EwcCover;
widgetRegistry['ewc-fisher'] = EwcFisher;
widgetRegistry['ewc-fmn'] = EwcFmn;
widgetRegistry['ewc-forget'] = EwcForget;
widgetRegistry['ewc-laplace'] = EwcLaplace;
widgetRegistry['ewc-limits'] = EwcLimits;
widgetRegistry['ewc-merge'] = EwcMerge;
widgetRegistry['ewc-mnist'] = EwcMnist;
widgetRegistry['ewc-overlap'] = EwcOverlap;
widgetRegistry['ewc-repair'] = EwcRepair;
widgetRegistry['ewc-routes'] = EwcRoutes;
widgetRegistry['ewc-springs'] = EwcSprings;
widgetRegistry['ewc-workbench'] = EwcWorkbench;
