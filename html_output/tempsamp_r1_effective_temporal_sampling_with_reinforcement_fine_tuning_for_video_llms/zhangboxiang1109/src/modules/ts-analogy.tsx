/* Refined 2026-11-09. Internal provenance; not rendered. */
import React from 'react';
import type { WidgetProps } from './registry';

export const TsAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const index = Math.max(0, Math.min(9, (Number(chapterId.replace('chap-', '')) || 1) - 1));
  const actions = [
    '对准事件', '移动播放头', '放入参考段', '校准刻度', '选择校准方式',
    '调节评分曲线', '切换工作轨道', '并排核对结果', '抽取样本复查', '放大检查边界',
  ];
  const cursor = [28, 36, 50, 63, 72, 60, 45, 78, 30, 84][index];

  return (
    <div className="ts-analogy" aria-hidden="true">
      <div className="ts-analogy-top">
        <span className="ts-analogy-label">剪辑台 · 教学示意</span>
        <span className="ts-analogy-action">{actions[index]}</span>
      </div>
      <div className="ts-analogy-frames">
        <span className="ts-analogy-frame" />
        <span className="ts-analogy-frame" />
        <span className="ts-analogy-frame" />
      </div>
      <div className="ts-analogy-timeline">
        <div className="ts-analogy-row">
          <span>参考片段</span>
          <span className="ts-analogy-rail"><i className="ts-analogy-segment reference" /></span>
        </div>
        <div className="ts-analogy-row">
          <span>待检查</span>
          <span className="ts-analogy-rail">
            <i className="ts-analogy-segment candidate" />
            <i className="ts-analogy-cursor" style={{ left: cursor + '%' }} />
          </span>
        </div>
      </div>
    </div>
  );
};