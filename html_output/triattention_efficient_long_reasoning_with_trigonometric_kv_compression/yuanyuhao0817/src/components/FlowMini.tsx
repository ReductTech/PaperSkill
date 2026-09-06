import React from 'react';
import type { ChapterDef } from '../types';

// 章节进度条：每个节点显示「序号 + 短标题」，短标题取章节标题冒号前的主题词。
// `revealed` 是当前已展示的章节数，之前为 done，当前为 active，之后为待解锁。
export function FlowMini({ chapters, revealed }: { chapters: ChapterDef[]; revealed: number }) {
  return (
    <div className="flow-mini">
      {chapters.map((ch, i) => {
        const n = i + 1;
        const cls =
          n < revealed ? 'flow-step done' : n === revealed ? 'flow-step active' : 'flow-step';
        const short = ch.title.includes('：') ? ch.title.split('：')[0] : ch.title;
        return (
          <React.Fragment key={ch.id}>
            {i > 0 ? <span className="flow-arrow">→</span> : null}
            <div className={cls} data-step={n} title={ch.title}>
              <span className="flow-step-num">{n}</span>
              <span className="flow-step-label">{short}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}