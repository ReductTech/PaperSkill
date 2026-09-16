import React from 'react';
import { PaperFigureScene, PaperHeroOverview } from './paper-figures';

export const WorldCh1: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId, moduleId }) => (
  chapterId === 'hero' ? <PaperHeroOverview variant={moduleId} /> : <PaperFigureScene chapter={1} />
);
