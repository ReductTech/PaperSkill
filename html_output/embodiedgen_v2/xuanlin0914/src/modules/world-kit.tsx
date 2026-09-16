import React from 'react';
import { PaperFigureScene, PaperHeroOverview } from './paper-figures';

export type InteractionType = 'compare' | 'chips' | 'steps' | 'drag' | 'hotspots' | 'race';

export interface WidgetMode {
  type: InteractionType;
  options: string[];
  feedback: string[];
  values?: number[];
  valueSets?: number[][];
  canvasLabels: [string, string];
}

export interface WorldConfig extends WidgetMode {
  chapter: number;
  action: string;
  goal: string;
  secondary?: WidgetMode;
}

export function createWorldWidget(config: WorldConfig): React.FC<{ chapterId: string; moduleId: string }> {
  return function WorldWidget({ moduleId }) {
    if (moduleId === 'old' || moduleId === 'new') {
      return <PaperHeroOverview variant={moduleId} />;
    }
    if (moduleId === 'ana') {
      return null;
    }
    return <PaperFigureScene chapter={config.chapter} />;
  };
}

export const WorldKitWidget: React.FC<{ chapterId: string; moduleId: string }> = () => null;
