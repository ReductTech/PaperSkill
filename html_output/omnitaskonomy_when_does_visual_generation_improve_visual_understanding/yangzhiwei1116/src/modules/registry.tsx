import React from 'react';
import { CoverShop } from './cover-shop';
import { S1PairedTask } from './s1-paired-task';
import { S10Correlation } from './s10-correlation';
import { S11Gain } from './s11-gain';
import { S12RecipeCard } from './s12-recipe-card';
import { S2Recipes } from './s2-recipes';
import { S3Substitute } from './s3-substitute';
import { S4Instance } from './s4-instance';
import { S5Taxonomy } from './s5-taxonomy';
import { S6Build } from './s6-build';
import { S7Transfer } from './s7-transfer';
import { S8Alignment } from './s8-alignment';
import { S9Where } from './s9-where';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-shop'] = CoverShop;
widgetRegistry['s1-paired-task'] = S1PairedTask;
widgetRegistry['s10-correlation'] = S10Correlation;
widgetRegistry['s11-gain'] = S11Gain;
widgetRegistry['s12-recipe-card'] = S12RecipeCard;
widgetRegistry['s2-recipes'] = S2Recipes;
widgetRegistry['s3-substitute'] = S3Substitute;
widgetRegistry['s4-instance'] = S4Instance;
widgetRegistry['s5-taxonomy'] = S5Taxonomy;
widgetRegistry['s6-build'] = S6Build;
widgetRegistry['s7-transfer'] = S7Transfer;
widgetRegistry['s8-alignment'] = S8Alignment;
widgetRegistry['s9-where'] = S9Where;
