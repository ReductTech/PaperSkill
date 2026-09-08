import React from 'react';
import { HeroCompare } from './heroCompare';
import { AnalogyScene } from './analogyScene';
import { StateScanner } from './stateScanner';
import { ActionTable } from './actionTable';
import { RouteReplan } from './routeReplan';
import { OrigamiAna } from './origamiAna';
import { OrigamiLayers } from './origamiLayers';
import { OrigamiFold } from './origamiFold';
import { OrigamiPlanner } from './origamiPlanner';
import { StageMixAna } from './stageMixAna';
import { DataDistiller } from './dataDistiller';
import { DaggerDial } from './daggerDial';
import { DataJars } from './dataJars';
import { PrismAna } from './prismAna';
import { NativeWindow } from './nativeWindow';
import { MoeFibers } from './moeFibers';
import { TeacherAna } from './teacherAna';
import { GrpoBalance } from './grpoBalance';
import { RewardGauges } from './rewardGauges';
import { TrainHelix } from './trainHelix';
import { RulerAna } from './rulerAna';
import { BenchPodium } from './benchPodium';
import { NavLoopmap } from './navLoopmap';
import { EvidenceScale } from './evidenceScale';
import { RouteMap } from './routeMap';
import { SummaryAna } from './summaryAna';
import { SummaryHive } from './summaryHive';
import { RftStamps } from './rftStamps';
import { ProtocolBoard } from './protocolBoard';

// Widget registry: maps componentId from src/data/tutorial.ts to a React component.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-compare'] = HeroCompare;
widgetRegistry['ana-scene'] = AnalogyScene;
widgetRegistry['state-scanner'] = StateScanner;
widgetRegistry['action-table'] = ActionTable;
widgetRegistry['route-replan'] = RouteReplan;
widgetRegistry['origami-ana'] = OrigamiAna;
widgetRegistry['origami-layers'] = OrigamiLayers;
widgetRegistry['origami-fold'] = OrigamiFold;
widgetRegistry['origami-planner'] = OrigamiPlanner;
widgetRegistry['stage-mix-ana'] = StageMixAna;
widgetRegistry['data-distiller'] = DataDistiller;
widgetRegistry['dagger-dial'] = DaggerDial;
widgetRegistry['data-jars'] = DataJars;
widgetRegistry['prism-ana'] = PrismAna;
widgetRegistry['native-window'] = NativeWindow;
widgetRegistry['moe-fibers'] = MoeFibers;
widgetRegistry['teacher-ana'] = TeacherAna;
widgetRegistry['grpo-balance'] = GrpoBalance;
widgetRegistry['reward-gauges'] = RewardGauges;
widgetRegistry['train-helix'] = TrainHelix;
widgetRegistry['ruler-ana'] = RulerAna;
widgetRegistry['bench-podium'] = BenchPodium;
widgetRegistry['nav-loopmap'] = NavLoopmap;
widgetRegistry['evidence-scale'] = EvidenceScale;
widgetRegistry['route-map'] = RouteMap;
widgetRegistry['summary-ana'] = SummaryAna;
widgetRegistry['summary-hive'] = SummaryHive;
widgetRegistry['rft-stamps'] = RftStamps;
widgetRegistry['protocol-board'] = ProtocolBoard;
