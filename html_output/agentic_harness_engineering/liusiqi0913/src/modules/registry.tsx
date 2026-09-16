import React from 'react';
import { HeroLoops } from './hero-loops';
import { ModAheLoop } from './mod-ahe-loop';
import { ModAlgLoop } from './mod-alg-loop';
import { ModCompObs } from './mod-comp-obs';
import { ModCompValue } from './mod-comp-value';
import { ModDecObs } from './mod-dec-obs';
import { ModExpObs } from './mod-exp-obs';
import { ModFig1 } from './mod-fig1';
import { ModFig4 } from './mod-fig4';
import { ModFuture } from './mod-future';
import { ModHarnessIntro } from './mod-harness-intro';
import { ModLimitations } from './mod-limitations';
import { ModPaperMap } from './mod-paper-map';
import { ModRace } from './mod-race';
import { ModSetup } from './mod-setup';
import { ModTransfer } from './mod-transfer';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hero-loops'] = HeroLoops;
widgetRegistry['mod-ahe-loop'] = ModAheLoop;
widgetRegistry['mod-alg-loop'] = ModAlgLoop;
widgetRegistry['mod-comp-obs'] = ModCompObs;
widgetRegistry['mod-comp-value'] = ModCompValue;
widgetRegistry['mod-dec-obs'] = ModDecObs;
widgetRegistry['mod-exp-obs'] = ModExpObs;
widgetRegistry['mod-fig1'] = ModFig1;
widgetRegistry['mod-fig4'] = ModFig4;
widgetRegistry['mod-future'] = ModFuture;
widgetRegistry['mod-harness-intro'] = ModHarnessIntro;
widgetRegistry['mod-limitations'] = ModLimitations;
widgetRegistry['mod-paper-map'] = ModPaperMap;
widgetRegistry['mod-race'] = ModRace;
widgetRegistry['mod-setup'] = ModSetup;
widgetRegistry['mod-transfer'] = ModTransfer;
