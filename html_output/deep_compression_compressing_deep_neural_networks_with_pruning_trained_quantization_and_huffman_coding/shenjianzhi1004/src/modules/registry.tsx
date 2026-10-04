import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { DcAnalogy } from './dc-analogy';
import { DcHeroNew } from './dc-hero-new';
import { DcHeroOld } from './dc-hero-old';
import { DcKit } from './dc-kit';
import { M1Budget } from './m1-budget';
import { M10Race } from './m10-race';
import { M2Dist } from './m2-dist';
import { M3Prune } from './m3-prune';
import { M4Loop } from './m4-loop';
import { M5Cluster } from './m5-cluster';
import { M6Codebook } from './m6-codebook';
import { M7Finetune } from './m7-finetune';
import { M7Gradient } from './m7-gradient';
import { M8Pipeline } from './m8-pipeline';
import { M9Huffman } from './m9-huffman';
import { M9Index } from './m9-index';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['dc-analogy'] = DcAnalogy;
widgetRegistry['dc-hero-new'] = DcHeroNew;
widgetRegistry['dc-hero-old'] = DcHeroOld;
widgetRegistry['dc-kit'] = DcKit;
widgetRegistry['m1-budget'] = M1Budget;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m2-dist'] = M2Dist;
widgetRegistry['m3-prune'] = M3Prune;
widgetRegistry['m4-loop'] = M4Loop;
widgetRegistry['m5-cluster'] = M5Cluster;
widgetRegistry['m6-codebook'] = M6Codebook;
widgetRegistry['m7-finetune'] = M7Finetune;
widgetRegistry['m7-gradient'] = M7Gradient;
widgetRegistry['m8-pipeline'] = M8Pipeline;
widgetRegistry['m9-huffman'] = M9Huffman;
widgetRegistry['m9-index'] = M9Index;
