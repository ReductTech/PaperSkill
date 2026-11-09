import React from 'react';
import { CategoryWidget } from './category';
import { EmbedWidget } from './embed';
import { ArchWidget } from './arch';
import { CompareWidget } from './compare';
import { MatrixWidget } from './matrix';
import { LossWidget } from './loss';
import { ZeroShotWidget } from './zeroShot';
import { PromptWidget } from './prompt';
import { ScaleWidget } from './scale';
import { OverlapWidget } from './overlap';
import { RobustWidget } from './robust';
import { AuditWidget } from './audit';
import { AnalogyWidget } from './analogy';
import { PathwayWidget } from './pathway';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['category'] = CategoryWidget;
widgetRegistry['embed'] = EmbedWidget;
widgetRegistry['arch'] = ArchWidget;
widgetRegistry['compare'] = CompareWidget;
widgetRegistry['matrix'] = MatrixWidget;
widgetRegistry['loss'] = LossWidget;
widgetRegistry['zeroshot'] = ZeroShotWidget;
widgetRegistry['prompt'] = PromptWidget;
widgetRegistry['scale'] = ScaleWidget;
widgetRegistry['overlap'] = OverlapWidget;
widgetRegistry['robust'] = RobustWidget;
widgetRegistry['audit'] = AuditWidget;
widgetRegistry['analogy'] = AnalogyWidget;
widgetRegistry['pathway'] = PathwayWidget;
