import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { KqAnalogy } from './kq-analogy';
import { KqHeroNew } from './kq-hero-new';
import { KqHeroOld } from './kq-hero-old';
import { KqKit } from './kq-kit';
import { M1Trunk } from './m1-trunk';
import { M10Race } from './m10-race';
import { M2Layout } from './m2-layout';
import { M3Axis } from './m3-axis';
import { M4PreRope } from './m4-prerope';
import { M5Nuq } from './m5-nuq';
import { M5Outlier } from './m5-outlier';
import { M6Kernel } from './m6-kernel';
import { M7Calib } from './m7-calib';
import { M8Pipeline } from './m8-pipeline';
import { M9Bits } from './m9-bits';
import { M9Compare } from './m9-compare';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['kq-analogy'] = KqAnalogy;
widgetRegistry['kq-hero-new'] = KqHeroNew;
widgetRegistry['kq-hero-old'] = KqHeroOld;
widgetRegistry['kq-kit'] = KqKit;
widgetRegistry['m1-trunk'] = M1Trunk;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-layout'] = M2Layout;
widgetRegistry['m3-axis'] = M3Axis;
widgetRegistry['m4-prerope'] = M4PreRope;
widgetRegistry['m5-nuq'] = M5Nuq;
widgetRegistry['m5-outlier'] = M5Outlier;
widgetRegistry['m6-kernel'] = M6Kernel;
widgetRegistry['m7-calib'] = M7Calib;
widgetRegistry['m8-pipeline'] = M8Pipeline;
widgetRegistry['m9-bits'] = M9Bits;
widgetRegistry['m9-compare'] = M9Compare;
