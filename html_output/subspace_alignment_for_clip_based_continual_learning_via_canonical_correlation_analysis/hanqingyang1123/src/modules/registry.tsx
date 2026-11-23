import React from 'react';
import { AblationBars } from './ablation-bars';
import { AccumStats } from './accum-stats';
import { BenchDots } from './bench-dots';
import { CcaAxis } from './cca-axis';
import { DriftChart } from './drift-chart';
import { DriftMarks } from './drift-marks';
import { EnergyCut } from './energy-cut';
import { FlowStage } from './flow-stage';
import { LimitCases } from './limit-cases';
import { RegCover } from './reg-cover';
import { RfpWave } from './rfp-wave';
import { WhitenPlate } from './whiten-plate';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['ablation-bars'] = AblationBars;
widgetRegistry['accum-stats'] = AccumStats;
widgetRegistry['bench-dots'] = BenchDots;
widgetRegistry['cca-axis'] = CcaAxis;
widgetRegistry['drift-chart'] = DriftChart;
widgetRegistry['drift-marks'] = DriftMarks;
widgetRegistry['energy-cut'] = EnergyCut;
widgetRegistry['flow-stage'] = FlowStage;
widgetRegistry['limit-cases'] = LimitCases;
widgetRegistry['reg-cover'] = RegCover;
widgetRegistry['rfp-wave'] = RfpWave;
widgetRegistry['whiten-plate'] = WhitenPlate;
