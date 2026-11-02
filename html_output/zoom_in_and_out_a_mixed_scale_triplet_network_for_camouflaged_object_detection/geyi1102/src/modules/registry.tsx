import React from 'react';
import { ZnAblation } from './zn-ablation';
import { ZnBoundary } from './zn-boundary';
import { ZnHmu } from './zn-hmu';
import { ZnResults } from './zn-results';
import { ZnScale } from './zn-scale';
import { ZnSiu } from './zn-siu';
import { ZnTriplet } from './zn-triplet';
import { ZnUal } from './zn-ual';
import { ZoomnetCover } from './zoomnet-cover';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['zn-ablation'] = ZnAblation;
widgetRegistry['zn-boundary'] = ZnBoundary;
widgetRegistry['zn-hmu'] = ZnHmu;
widgetRegistry['zn-results'] = ZnResults;
widgetRegistry['zn-scale'] = ZnScale;
widgetRegistry['zn-siu'] = ZnSiu;
widgetRegistry['zn-triplet'] = ZnTriplet;
widgetRegistry['zn-ual'] = ZnUal;
widgetRegistry['zoomnet-cover'] = ZoomnetCover;
