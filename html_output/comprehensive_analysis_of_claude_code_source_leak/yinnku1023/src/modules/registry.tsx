import React from 'react';
import { Attribution } from './attribution';
import { BackgroundGates } from './background-gates';
import { DefenseTradeoffs } from './defense-tradeoffs';
import { EditorialCover } from './editorial-cover';
import { FutureExperiment } from './future-experiment';
import { PackageManifest } from './package-manifest';
import { ParserAgreement } from './parser-agreement';
import { ReleaseDefense } from './release-defense';
import { RetryBudget } from './retry-budget';
import { RunVerification } from './run-verification';
import { SourceBoundary } from './source-boundary';
import { TrustedSummary } from './trusted-summary';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['attribution'] = Attribution;
widgetRegistry['background-gates'] = BackgroundGates;
widgetRegistry['defense-tradeoffs'] = DefenseTradeoffs;
widgetRegistry['editorial-cover'] = EditorialCover;
widgetRegistry['future-experiment'] = FutureExperiment;
widgetRegistry['package-manifest'] = PackageManifest;
widgetRegistry['parser-agreement'] = ParserAgreement;
widgetRegistry['release-defense'] = ReleaseDefense;
widgetRegistry['retry-budget'] = RetryBudget;
widgetRegistry['run-verification'] = RunVerification;
widgetRegistry['source-boundary'] = SourceBoundary;
widgetRegistry['trusted-summary'] = TrustedSummary;
