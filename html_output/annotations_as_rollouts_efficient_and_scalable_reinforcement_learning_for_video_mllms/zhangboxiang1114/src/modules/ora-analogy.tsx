import React from 'react';
import type { WidgetProps } from './registry';

// MODEL HANDOFF: paper-specific visual; keep this component free of student metadata.
export const OraAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const scenes = [
    ['选中事件', '标注事件', 24, 48], ['浏览候选', '标注事件', 35, 42],
    ['加入参考', '标注事件', 32, 46], ['策略均值', '混合均值', 28, 57],
    ['策略均值', '独立标注', 35, 52], ['方向增益', '标注引导', 29, 60],
    ['平衡样本', '校正尺度', 30, 50], ['比较方法', '检查翻转', 38, 48],
    ['时间边界', '评测区间', 26, 60], ['核对证据', '标注边界', 32, 50],
  ];
  const n = Math.min(10, Math.max(1, Number(chapterId.replace('chap-', '')) || 1));
  const [a, b, left, width] = scenes[n - 1];
  return <div className="ora-story" role="img" aria-label={'剪辑师沿时间轴比较' + a + '和' + b}>
    <div className="ora-story-editor"><span className="ora-editor-mark" aria-hidden="true">▶</span><span>剪辑师</span></div>
    <div className="ora-story-timeline">
      <div className="ora-time-ruler" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
      <div className="ora-time-row"><span>{a}</span><div className="ora-time-track"><i style={{ left: left + '%', width: width + '%' }} /></div></div>
      <div className="ora-time-row"><span>{b}</span><div className="ora-time-track ora-reference"><i style={{ left: '25%', width: '46%' }} /></div></div>
    </div>
    <span className="ora-story-caption">同一条时间轴，分清候选与参照</span>
  </div>;
};
