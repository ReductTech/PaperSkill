import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1ClosedLoopLab } from './ch1-closed-loop-lab';
import { Ch10ResultsLab } from './ch10-results-lab';
import { Ch2SkillContractLab } from './ch2-skill-contract-lab';
import { Ch3MemoryMapLab } from './ch3-memory-map-lab';
import { Ch4FusionLab } from './ch4-fusion-lab';
import { Ch5NavigationLab } from './ch5-navigation-lab';
import { Ch6ExecutionLoopLab } from './ch6-execution-loop-lab';
import { Ch7BackendLab } from './ch7-backend-lab';
import { Ch8ArchitectureLab } from './ch8-architecture-lab';
import { Ch9MemoryUpdateLab } from './ch9-memory-update-lab';
import { CheckpointNote } from './checkpoint-note';
import { HeroLoop } from './hero-loop';
import { SailingAnalogy } from './sailing-analogy';
import { SailingKitWidget } from './sailing-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-closed-loop-lab'] = Ch1ClosedLoopLab;
widgetRegistry['ch10-results-lab'] = Ch10ResultsLab;
widgetRegistry['ch2-skill-contract-lab'] = Ch2SkillContractLab;
widgetRegistry['ch3-memory-map-lab'] = Ch3MemoryMapLab;
widgetRegistry['ch4-fusion-lab'] = Ch4FusionLab;
widgetRegistry['ch5-navigation-lab'] = Ch5NavigationLab;
widgetRegistry['ch6-execution-loop-lab'] = Ch6ExecutionLoopLab;
widgetRegistry['ch7-backend-lab'] = Ch7BackendLab;
widgetRegistry['ch8-architecture-lab'] = Ch8ArchitectureLab;
widgetRegistry['ch9-memory-update-lab'] = Ch9MemoryUpdateLab;
widgetRegistry['checkpoint-note'] = CheckpointNote;
widgetRegistry['hero-loop'] = HeroLoop;
widgetRegistry['sailing-analogy'] = SailingAnalogy;
widgetRegistry['sailing-kit'] = SailingKitWidget;
