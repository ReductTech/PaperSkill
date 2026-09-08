import type React from 'react';
import type { ChapterExperienceProps } from '../types';
import { CmcvRoutingChallenge } from './CmcvRoutingChallenge';
import { DataCounterfactual } from './DataCounterfactual';
import { DdasMicroscope } from './DdasMicroscope';
import { MgamMatchingPuzzle } from './MgamMatchingPuzzle';
import { RenderForensics } from './RenderForensics';
import { TrainingTimeline } from './TrainingTimeline';

export type ChapterStepId = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6';

export const chapterExperienceRegistry: Record<
  ChapterStepId,
  React.ComponentType<ChapterExperienceProps>
> = {
  'step-1': DataCounterfactual,
  'step-2': DdasMicroscope,
  'step-3': CmcvRoutingChallenge,
  'step-4': RenderForensics,
  'step-5': TrainingTimeline,
  'step-6': MgamMatchingPuzzle,
};

export function isChapterStepId(stepId: string): stepId is ChapterStepId {
  return Object.prototype.hasOwnProperty.call(chapterExperienceRegistry, stepId);
}
