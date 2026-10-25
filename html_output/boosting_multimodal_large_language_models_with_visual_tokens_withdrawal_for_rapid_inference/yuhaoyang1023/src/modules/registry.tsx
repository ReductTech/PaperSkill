import React from 'react';
import { HeroTide } from './hero-tide';
import { AnaTea, AnaTheater, AnaChef, AnaExam } from './analogies';
import { M1Bill } from './m1-bill';
import { M1Shatter } from './m1-shatter';
import { M5Withdraw } from './m5-withdraw';
import { M7Tradeoff } from './m7-tradeoff';
import { M9Morph } from './m9-morph';
import { M2Questions } from './m2-questions';
import { M2Hurdles } from './m2-hurdles';
import { M3Layers } from './m3-layers';
import { M3Outputs } from './m3-outputs';
import { M4Flow } from './m4-flow';
import { M4Table1 } from './m4-table1';
import { M5Stepper } from './m5-stepper';
import { M5Layers } from './m5-layers';
import { M6Pos } from './m6-pos';
import { M6Kv } from './m6-kv';
import { M7Kl } from './m7-kl';
import { M8Calc } from './m8-calc';
import { M8Metrics } from './m8-metrics';
import { M9Baseline } from './m9-baseline';
import { M10Cases } from './m10-cases';
import { M10Mme } from './m10-mme';

// Widget registry：把 tutorial.ts 中的 componentId 映射到组件。
// 依赖方向：components → registry → modules → (ui, lib, data)；modules 不引用 components 或 registry 之外的上层文件。

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-tide'] = HeroTide;

widgetRegistry['ana-tea'] = AnaTea;
widgetRegistry['ana-theater'] = AnaTheater;
widgetRegistry['ana-chef'] = AnaChef;
widgetRegistry['ana-exam'] = AnaExam;

widgetRegistry['m1-bill'] = M1Bill;
widgetRegistry['m1-shatter'] = M1Shatter;
widgetRegistry['m5-withdraw'] = M5Withdraw;
widgetRegistry['m7-tradeoff'] = M7Tradeoff;
widgetRegistry['m2-questions'] = M2Questions;
widgetRegistry['m2-hurdles'] = M2Hurdles;
widgetRegistry['m3-layers'] = M3Layers;
widgetRegistry['m3-outputs'] = M3Outputs;
widgetRegistry['m4-flow'] = M4Flow;
widgetRegistry['m4-table1'] = M4Table1;
widgetRegistry['m5-stepper'] = M5Stepper;
widgetRegistry['m5-layers'] = M5Layers;
widgetRegistry['m6-pos'] = M6Pos;
widgetRegistry['m6-kv'] = M6Kv;
widgetRegistry['m7-kl'] = M7Kl;
widgetRegistry['m8-calc'] = M8Calc;
widgetRegistry['m8-metrics'] = M8Metrics;
widgetRegistry['m9-morph'] = M9Morph;
widgetRegistry['m9-baseline'] = M9Baseline;
widgetRegistry['m10-cases'] = M10Cases;
widgetRegistry['m10-mme'] = M10Mme;
