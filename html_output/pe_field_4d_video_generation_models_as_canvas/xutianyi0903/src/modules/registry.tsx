import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AblationLab } from './ablation-lab';
import { AddressRouting } from './address-routing';
import { AttentionArchitecture } from './attention-architecture';
import { ControlGap } from './control-gap';
import { DepthOffset } from './depth-offset';
import { GuidedCompare } from './guided-compare';
import { Goal4D } from './goal-4d';
import { HeroCamera } from './hero-camera';
import { ImageViewpointDemo } from './image-viewpoint-demo';
import { ImplementationProblems } from './implementation-problems';
import { LoraMap } from './lora-map';
import { MetricRace } from './metric-race';
import { ProjectionDrag } from './projection-drag';
import { ProsCons } from './pros-cons';
import { Reflection } from './reflection';
import { StageAnalogy } from './stage-analogy';
import { SystemPipeline } from './system-pipeline';
import { TemporalUnmix } from './temporal-unmix';
import { TokenGrid } from './token-grid';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation-lab'] = AblationLab;
widgetRegistry['address-routing'] = AddressRouting;
widgetRegistry['attention-architecture'] = AttentionArchitecture;
widgetRegistry['control-gap'] = ControlGap;
widgetRegistry['depth-offset'] = DepthOffset;
widgetRegistry['guided-compare'] = GuidedCompare;
widgetRegistry['goal-4d'] = Goal4D;
widgetRegistry['hero-camera'] = HeroCamera;
widgetRegistry['image-viewpoint-demo'] = ImageViewpointDemo;
widgetRegistry['implementation-problems'] = ImplementationProblems;
widgetRegistry['lora-map'] = LoraMap;
widgetRegistry['metric-race'] = MetricRace;
widgetRegistry['projection-drag'] = ProjectionDrag;
widgetRegistry['pros-cons'] = ProsCons;
widgetRegistry['reflection'] = Reflection;
widgetRegistry['stage-analogy'] = StageAnalogy;
widgetRegistry['system-pipeline'] = SystemPipeline;
widgetRegistry['temporal-unmix'] = TemporalUnmix;
widgetRegistry['token-grid'] = TokenGrid;
