import React from 'react';
import { HeroScale } from './heroScale';
import { AnalogyScale } from './analogyScale';
import { Ch1Problem } from './ch1Problem';
import { Ch2Rtn } from './ch2Rtn';
import { Ch3Compensate } from './ch3Compensate';
import { Ch4Hessian } from './ch4Hessian';
import { Ch6Order } from './ch6Order';
import { Ch5LazyBatch } from './ch5LazyBatch';
import { Ch6Cholesky } from './ch6Cholesky';
import { Ch7Group } from './ch7Group';
import { Ch8Alg } from './ch8Alg';
import { Ch9Results } from './ch9Results';
import { Ch10Bounds } from './ch10Bounds';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. The generator ADDS entries here for every paper-specific canvas
// widget (hero sides, analogy animations, and interactive modules).

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-scale'] = HeroScale;
widgetRegistry['analogy-scale'] = AnalogyScale;
widgetRegistry['ch1-problem'] = Ch1Problem;
widgetRegistry['ch2-rtn'] = Ch2Rtn;
widgetRegistry['ch3-compensate'] = Ch3Compensate;
widgetRegistry['ch4-hessian'] = Ch4Hessian;
widgetRegistry['ch6-order'] = Ch6Order;
widgetRegistry['ch5-lazy-batch'] = Ch5LazyBatch;
widgetRegistry['ch6-cholesky'] = Ch6Cholesky;
widgetRegistry['ch7-group'] = Ch7Group;
widgetRegistry['ch8-alg'] = Ch8Alg;
widgetRegistry['ch9-results'] = Ch9Results;
widgetRegistry['ch10-bounds'] = Ch10Bounds;
