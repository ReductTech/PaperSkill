import React from 'react';
import { AffineFreedom } from './affine-freedom';
import { AffineSpecials } from './affine-specials';
import { BlockMse } from './block-mse';
import { CoverNew } from './cover-new';
import { CoverOld } from './cover-old';
import { DiagDominant } from './diag-dominant';
import { EqTransform } from './eq-transform';
import { GradualMask } from './gradual-mask';
import { LimitedTransforms } from './limited-transforms';
import { ResultsBars } from './results-bars';
import { StabilityAlpha } from './stability-alpha';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['affine-freedom'] = AffineFreedom;
widgetRegistry['affine-specials'] = AffineSpecials;
widgetRegistry['block-mse'] = BlockMse;
widgetRegistry['cover-new'] = CoverNew;
widgetRegistry['cover-old'] = CoverOld;
widgetRegistry['diag-dominant'] = DiagDominant;
widgetRegistry['eq-transform'] = EqTransform;
widgetRegistry['gradual-mask'] = GradualMask;
widgetRegistry['limited-transforms'] = LimitedTransforms;
widgetRegistry['results-bars'] = ResultsBars;
widgetRegistry['stability-alpha'] = StabilityAlpha;
