import { FpnComparison } from './FpnComparison';
import React from 'react';
import { FpnAblation } from './fpn-ablation';
import { FpnBoundary } from './fpn-boundary';
import { FpnCover } from './fpn-cover';
import { FpnDetection } from './fpn-detection';
import { FpnFusion } from './FpnVisualBenefits';
import { FpnPyramid } from './fpn-pyramid';
import { FpnRoi } from './fpn-roi';
import { FpnRpn } from './fpn-rpn';
import { FpnScale } from './fpn-scale';
import { FpnSemantics } from './fpn-semantics';
import { FpnStrategies } from './FpnVisualMerge';
import { FpnTransfer } from './fpn-transfer';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['fpn-ablation'] = FpnAblation;
widgetRegistry['fpn-boundary'] = FpnBoundary;
widgetRegistry['fpn-cover'] = FpnCover;
widgetRegistry['fpn-detection'] = FpnDetection;
widgetRegistry['fpn-fusion'] = FpnFusion;
widgetRegistry['fpn-pyramid'] = FpnPyramid;
widgetRegistry['fpn-roi'] = FpnRoi;
widgetRegistry['fpn-rpn'] = FpnRpn;
widgetRegistry['fpn-scale'] = FpnScale;
widgetRegistry['fpn-semantics'] = FpnSemantics;
widgetRegistry['fpn-strategies'] = FpnStrategies;
widgetRegistry['fpn-transfer'] = FpnTransfer;

widgetRegistry['fpn-comparison'] = FpnComparison;
