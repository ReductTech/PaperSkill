import React from 'react';
import { GriffonArch } from './griffon-arch';
import { GriffonBound } from './griffon-bound';
import { GriffonBrief } from './griffon-brief';
import { GriffonCoco } from './griffon-coco';
import { GriffonCoverNew } from './griffon-cover-new';
import { GriffonCoverOld } from './griffon-cover-old';
import { GriffonDataset } from './griffon-dataset';
import { GriffonFormat } from './griffon-format';
import { GriffonFour } from './griffon-four';
import { GriffonLimit } from './griffon-limit';
import { GriffonQual } from './griffon-qual';
import { GriffonRec } from './griffon-rec';
import { GriffonScore } from './griffon-score';
import { GriffonStages } from './griffon-stages';
import { GriffonTokens } from './griffon-tokens';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['griffon-arch'] = GriffonArch;
widgetRegistry['griffon-bound'] = GriffonBound;
widgetRegistry['griffon-brief'] = GriffonBrief;
widgetRegistry['griffon-coco'] = GriffonCoco;
widgetRegistry['griffon-cover-new'] = GriffonCoverNew;
widgetRegistry['griffon-cover-old'] = GriffonCoverOld;
widgetRegistry['griffon-dataset'] = GriffonDataset;
widgetRegistry['griffon-format'] = GriffonFormat;
widgetRegistry['griffon-four'] = GriffonFour;
widgetRegistry['griffon-limit'] = GriffonLimit;
widgetRegistry['griffon-qual'] = GriffonQual;
widgetRegistry['griffon-rec'] = GriffonRec;
widgetRegistry['griffon-score'] = GriffonScore;
widgetRegistry['griffon-stages'] = GriffonStages;
widgetRegistry['griffon-tokens'] = GriffonTokens;
