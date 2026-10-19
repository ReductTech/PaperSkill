import React from 'react';
import {
  Ana1, Ana2, Ana3, Ana4, Ana5, Ana6, Ana7, Ana8, Ana9, Ana10, HeroOld, HeroNew,
} from './analogies';
import StressTest from './stress-test';
import FeatureSpace from './feature-space';
import CompareMethods from './compare-methods';
import LambdaSlider from './lambda-slider';
import ThresholdSelect from './threshold-select';
import InferencePath from './inference-path';
import StageProgress from './stage-progress';
import AdapterArch from './adapter-arch';
import ReparamCompare from './reparam-compare';
import ResultRace from './result-race';
import Ablation from './ablation';

// 组件注册表：componentId -> React 组件
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 封面新旧对比
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;

// 每章类比动画（560 x 140，一人一动作一目标）
widgetRegistry['ana1'] = Ana1;
widgetRegistry['ana2'] = Ana2;
widgetRegistry['ana3'] = Ana3;
widgetRegistry['ana4'] = Ana4;
widgetRegistry['ana5'] = Ana5;
widgetRegistry['ana6'] = Ana6;
widgetRegistry['ana7'] = Ana7;
widgetRegistry['ana8'] = Ana8;
widgetRegistry['ana9'] = Ana9;
widgetRegistry['ana10'] = Ana10;

// 章节交互模块
widgetRegistry['stress-test'] = StressTest;
widgetRegistry['feature-space'] = FeatureSpace;
widgetRegistry['compare-methods'] = CompareMethods;
widgetRegistry['lambda-slider'] = LambdaSlider;
widgetRegistry['threshold-select'] = ThresholdSelect;
widgetRegistry['inference-path'] = InferencePath;
widgetRegistry['stage-progress'] = StageProgress;
widgetRegistry['adapter-arch'] = AdapterArch;
widgetRegistry['reparam-compare'] = ReparamCompare;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['ablation'] = Ablation;
