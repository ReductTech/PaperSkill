import React from 'react';
import { LoraBoundaries } from './le-boundaries';
import { LeBudget } from './le-budget';
import { LoraChallenge } from './le-challenge';
import { LoraContinual } from './le-continual';
import { LECover } from './le-cover';
import { LeDetect } from './le-detect';
import { LeDimension } from './le-dimension';
import { LeGradient } from './le-gradient';
import { LeIntervene } from './le-intervene';
import { LeMatched } from './le-matched';
import { LoraResults } from './le-results';
import { LeScaling } from './le-scaling';
import { LeSpectrum } from './le-spectrum';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['le-boundaries'] = LoraBoundaries;
widgetRegistry['le-budget'] = LeBudget;
widgetRegistry['le-challenge'] = LoraChallenge;
widgetRegistry['le-continual'] = LoraContinual;
widgetRegistry['le-cover'] = LECover;
widgetRegistry['le-detect'] = LeDetect;
widgetRegistry['le-dimension'] = LeDimension;
widgetRegistry['le-gradient'] = LeGradient;
widgetRegistry['le-intervene'] = LeIntervene;
widgetRegistry['le-matched'] = LeMatched;
widgetRegistry['le-results'] = LoraResults;
widgetRegistry['le-scaling'] = LeScaling;
widgetRegistry['le-spectrum'] = LeSpectrum;
