import React from 'react';
import { YwContrastive } from './yw-contrastive';
import { YwCoverNew } from './yw-cover-new';
import { YwCoverOld } from './yw-cover-old';
import { YwFinetune } from './yw-finetune';
import { YwFixedVocab } from './yw-fixed-vocab';
import { YwLimits } from './yw-limits';
import { YwLvis } from './yw-lvis';
import { YwPretrain } from './yw-pretrain';
import { YwReferring } from './yw-referring';
import { YwRegionText } from './yw-region-text';
import { YwReparam } from './yw-reparam';
import { YwRepvl } from './yw-repvl';
import { YwTextEncoder } from './yw-text-encoder';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['yw-contrastive'] = YwContrastive;
widgetRegistry['yw-cover-new'] = YwCoverNew;
widgetRegistry['yw-cover-old'] = YwCoverOld;
widgetRegistry['yw-finetune'] = YwFinetune;
widgetRegistry['yw-fixed-vocab'] = YwFixedVocab;
widgetRegistry['yw-limits'] = YwLimits;
widgetRegistry['yw-lvis'] = YwLvis;
widgetRegistry['yw-pretrain'] = YwPretrain;
widgetRegistry['yw-referring'] = YwReferring;
widgetRegistry['yw-region-text'] = YwRegionText;
widgetRegistry['yw-reparam'] = YwReparam;
widgetRegistry['yw-repvl'] = YwRepvl;
widgetRegistry['yw-text-encoder'] = YwTextEncoder;
