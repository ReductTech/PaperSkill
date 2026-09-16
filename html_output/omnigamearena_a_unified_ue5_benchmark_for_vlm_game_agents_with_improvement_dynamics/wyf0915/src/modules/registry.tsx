import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { RegimeSelector } from './regimeSelector';
import { IDCCurvePlot } from './idcCurvePlot';
import { ReflectorStages } from './reflectorStages';
import { ColdStartBars } from './coldStartBars';
import { TransferBars } from './transferBars';
import { SkillCardPreview } from './skillCardPreview';
import { ComparisonTables } from './comparisonTables';
import { CapabilityRadar } from './capabilityRadar';
import { ContaminationAnalysis } from './contaminationAnalysis';
import { FairnessDesign } from './fairnessDesign';
import { IdcArchitecture } from './idcArchitecture';
import { ExperimentalResults } from './experimentalResults';
import { Limitations } from './limitations';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['regime-selector'] = RegimeSelector;
widgetRegistry['idc-curve-plot'] = IDCCurvePlot;
widgetRegistry['reflector-stages'] = ReflectorStages;
widgetRegistry['cold-start-bars'] = ColdStartBars;
widgetRegistry['transfer-bars'] = TransferBars;
widgetRegistry['skill-card-preview'] = SkillCardPreview;
widgetRegistry['comparison-tables'] = ComparisonTables;
widgetRegistry['capability-radar'] = CapabilityRadar;
widgetRegistry['contamination-analysis'] = ContaminationAnalysis;
widgetRegistry['fairness-design'] = FairnessDesign;
widgetRegistry['idc-architecture'] = IdcArchitecture;
widgetRegistry['experimental-results'] = ExperimentalResults;
widgetRegistry['limitations'] = Limitations;
