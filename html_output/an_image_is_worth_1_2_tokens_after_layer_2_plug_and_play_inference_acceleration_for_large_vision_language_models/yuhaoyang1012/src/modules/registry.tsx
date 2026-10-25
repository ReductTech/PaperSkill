import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HeroStage } from './heroStage';
import { Ana1, Ana2, Ana3, Ana4, Ana5, Ana6, Ana7, Ana8, Ana9, Ana10 } from './analogies';
import { VideoFrames, BenchExplorer } from './chVideoBench';
import { MethodMap, ConfigAdvisor } from './chPosition';
import { TokenExplosion } from './ch1TokenExplosion';
import { PatchSequence } from './ch2PatchSequence';
import { LayerScrubber, AttentionMap } from './ch3Attention';
import { AnchorFlow } from './ch4AnchorFlow';
import { RankPrune, LayerGate } from './ch5Prune';
import { KRHeatmap, OcrCurves } from './ch6Tradeoff';
import { PruneWhat } from './ch7Ablation';
import { LatencyRace, Pareto } from './ch8Results';
import { installCinema } from './cinema';
import { installPopover } from './popover';
import { PaperVsCode, FlopsAudit, EvalProtocol, ImplModes, Verdict } from './panels';

// 全屏电影感背景层（体积光 + 微尘 + 跟随鼠标的柔光）
installCinema();
// 术语弹注 / 证据定位（悬停、键盘、触摸）
installPopover();

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. A missing id renders a graceful placeholder.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;

// Hero（左右两侧共用一个组件，按 moduleId = old / new 区分）
widgetRegistry['hero-stage'] = HeroStage;

// 类比动画（夜间剧场主题）
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['ana-7'] = Ana7;
widgetRegistry['ana-8'] = Ana8;
widgetRegistry['ana-9'] = Ana9;
widgetRegistry['ana-10'] = Ana10;
widgetRegistry['video-frames'] = VideoFrames;
widgetRegistry['bench-explorer'] = BenchExplorer;
widgetRegistry['method-map'] = MethodMap;
widgetRegistry['config-advisor'] = ConfigAdvisor;

// 章节内嵌的证据 / 对比面板
widgetRegistry['paper-vs-code'] = PaperVsCode;
widgetRegistry['flops-audit'] = FlopsAudit;
widgetRegistry['eval-protocol'] = EvalProtocol;
widgetRegistry['impl-modes'] = ImplModes;
widgetRegistry['verdict'] = Verdict;

// 交互模块
widgetRegistry['token-explosion'] = TokenExplosion;
widgetRegistry['patch-sequence'] = PatchSequence;
widgetRegistry['layer-scrubber'] = LayerScrubber;
widgetRegistry['attention-map'] = AttentionMap;
widgetRegistry['anchor-flow'] = AnchorFlow;
widgetRegistry['rank-prune'] = RankPrune;
widgetRegistry['layer-gate'] = LayerGate;
widgetRegistry['kr-heatmap'] = KRHeatmap;
widgetRegistry['ocr-curves'] = OcrCurves;
widgetRegistry['prune-what'] = PruneWhat;
widgetRegistry['latency-race'] = LatencyRace;
widgetRegistry['pareto'] = Pareto;
