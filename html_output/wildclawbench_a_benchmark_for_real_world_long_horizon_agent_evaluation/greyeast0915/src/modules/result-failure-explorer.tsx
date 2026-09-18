import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { FailureTrace } from './failure-trace';
import { VerdictRace } from './verdict-race';

type View = 'result' | 'failure';

export const ResultFailureExplorer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [view, setView] = useState<View>('result');

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择结果分析层次">
        <button
          type="button"
          className={`chip ${view === 'result' ? 'active' : ''}`}
          aria-pressed={view === 'result'}
          onClick={() => setView('result')}
        >
          先看总体结果
        </button>
        <button
          type="button"
          className={`chip ${view === 'failure' ? 'active' : ''}`}
          aria-pressed={view === 'failure'}
          onClick={() => setView('failure')}
        >
          再查失败轨迹
        </button>
      </div>

      {view === 'result' ? (
        <VerdictRace chapterId={chapterId} moduleId={`${moduleId}-result`} />
      ) : (
        <>
          <div className="feedback">
            <b>失败分析样本：</b>论文抽检 300 条轨迹，并把其中 169 条得分低于 0.5 的运行纳入失败分析；这里的条件是 S &lt; 0.5。
          </div>
          <FailureTrace chapterId={chapterId} moduleId={`${moduleId}-failure`} />
        </>
      )}
    </div>
  );
};

export default ResultFailureExplorer;
