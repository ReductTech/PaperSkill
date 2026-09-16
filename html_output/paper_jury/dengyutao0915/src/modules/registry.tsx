import React from 'react';
import {
  Ana1CourtFile, Ana2Scales, Ana3Gavel, Ana4Bind, Ana5Readers,
  Ana6Route, Ana7Vote, Ana8Guard, Ana9Adjourn, Ana10Race,
} from './analogyAnimations';
import { Ch1SurfaceSound, Ch2Trilemma, Ch3ArchCompare } from './modulesCh1_3';
import { Ch4SetupSteps, Ch5ReviewerN, Ch6Routing } from './modulesCh4_6';
import { Ch7JuryVote, Ch8GuardChain, Ch9Convergence } from './modulesCh7_9';
import { Ch10Race, Ch10Ablation } from './modulesCh10';
import { QuizBlock } from './legacyQuiz';
import { ComicStrip, SymbolCardGrid, FigureGalleryWidget, StepAnimatorWidget } from './legacyWidgets';
import {
  TrilemmaSliders, ResponsibilityMatch,
  MainResults, CostQualityScatter, DomainSlice, EditSafetyFunnel,
} from './legacyCharts';
import {
  LegacySurfaceVsSoundView, LegacyGavelComparison, LegacyReviewerCount,
  LegacyRoutingSimulator, LegacyJuryVote, LegacyGuardChain,
  LegacyConvergence, LegacyAblationWaterfall,
} from './legacyChapters';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Every componentId used in tutorial.ts MUST be registered here.
// A missing id renders a graceful placeholder, so the app never crashes on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// --- 10 analogy animations (life-based, 560x140) ---
widgetRegistry['ana1'] = Ana1CourtFile;
widgetRegistry['ana2'] = Ana2Scales;
widgetRegistry['ana3'] = Ana3Gavel;
widgetRegistry['ana4'] = Ana4Bind;
widgetRegistry['ana5'] = Ana5Readers;
widgetRegistry['ana6'] = Ana6Route;
widgetRegistry['ana7'] = Ana7Vote;
widgetRegistry['ana8'] = Ana8Guard;
widgetRegistry['ana9'] = Ana9Adjourn;
widgetRegistry['ana10'] = Ana10Race;

// --- 11 interactive modules (1080x280) ---
widgetRegistry['ch1mod1'] = Ch1SurfaceSound;
widgetRegistry['ch2mod1'] = Ch2Trilemma;
widgetRegistry['ch3mod1'] = Ch3ArchCompare;
widgetRegistry['ch4mod1'] = Ch4SetupSteps;
widgetRegistry['ch5mod1'] = Ch5ReviewerN;
widgetRegistry['ch6mod1'] = Ch6Routing;
widgetRegistry['ch7mod1'] = Ch7JuryVote;
widgetRegistry['ch8mod1'] = Ch8GuardChain;
widgetRegistry['ch9mod1'] = Ch9Convergence;
widgetRegistry['ch10mod1'] = Ch10Race;
widgetRegistry['ch10mod2'] = Ch10Ablation;

// --- 旧版教程移入的互动（测验 / 漫画 / 符号卡 / 图表库 / 动画 / 图表模块） ---
widgetRegistry['quiz-block'] = QuizBlock;
widgetRegistry['comic-strip'] = ComicStrip;
widgetRegistry['symbol-cards'] = SymbolCardGrid;
widgetRegistry['figure-gallery'] = FigureGalleryWidget;
widgetRegistry['step-animator'] = StepAnimatorWidget;
widgetRegistry['ch2sliders'] = TrilemmaSliders;
widgetRegistry['ch4match'] = ResponsibilityMatch;
widgetRegistry['ch10main'] = MainResults;
widgetRegistry['ch10cost'] = CostQualityScatter;
widgetRegistry['ch10domain'] = DomainSlice;
widgetRegistry['ch10funnel'] = EditSafetyFunnel;

// --- 旧版教程剩余 8 个章节模块（全量移入） ---
widgetRegistry['ch1view'] = LegacySurfaceVsSoundView;
widgetRegistry['ch3gavel'] = LegacyGavelComparison;
widgetRegistry['ch5count'] = LegacyReviewerCount;
widgetRegistry['ch6route'] = LegacyRoutingSimulator;
widgetRegistry['ch7vote'] = LegacyJuryVote;
widgetRegistry['ch8guard'] = LegacyGuardChain;
widgetRegistry['ch9rounds'] = LegacyConvergence;
widgetRegistry['ch10water'] = LegacyAblationWaterfall;
