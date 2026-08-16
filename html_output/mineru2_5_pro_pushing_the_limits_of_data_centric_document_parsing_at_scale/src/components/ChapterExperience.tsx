import type { ChapterExperienceProps } from '../types';
import { chapterExperienceRegistry, isChapterStepId } from '../experiences/registry';

export function ChapterExperience(props: ChapterExperienceProps) {
  if (!isChapterStepId(props.stepId)) return null;

  const Experience = chapterExperienceRegistry[props.stepId];
  return (
    <div className="chapter-experience" data-testid="chapter-experience" data-step-id={props.stepId}>
      <Experience {...props} />
    </div>
  );
}
