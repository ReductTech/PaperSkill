import React from 'react';

// 论文阅读阶段导航（辅助）：六阶段随滚动联动，仅作流程指示与快速跳转，
// 不承载正文内容、不改变页面结构。

export interface JourneyStage {
  id: string;
  label: string;
  target: string;
}

interface Props {
  stages: JourneyStage[];
  active: number;
  onJump: (target: string) => void;
}

export const ReadingJourney: React.FC<Props> = ({ stages, active, onJump }) => {
  return (
    <nav className="reading-journey" aria-label="论文阅读阶段">
      {stages.map((stage, i) => {
        const state = i < active ? 'done' : i === active ? 'current' : 'upcoming';
        const mark = i < active ? '✓' : i === active ? '●' : '○';
        return (
          <button
            key={stage.id}
            type="button"
            className={`journey-step ${state}`}
            onClick={() => onJump(stage.target)}
            aria-current={i === active ? 'step' : undefined}
            title={`跳转到：${stage.label}`}
          >
            <span className="journey-mark" aria-hidden="true">
              {mark}
            </span>
            <span className="journey-label">{stage.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ReadingJourney;
