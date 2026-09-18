import React from 'react';
import type { WidgetProps } from './registry';

// 文字版 Hero 对比面板（PaperSkill 允许区域内的替换实现）。
// 原「传统 vs 本文」徒步 Canvas 动画已按用户要求移除；本组件用语义色
// 要点清单承载同一对比：红 = 失败 / 旧方法，绿 = 成功 / 本文方法
// （contract.md §5 颜色语义）。

const POINTS: Record<string, string[]> = {
  old: [
    '返回码被当成任务完成',
    '抽象层级不兼容，临时转换器满天飞',
    '黑盒叠加，十步任务失败无法归因',
    '失败经验随会话结束被丢弃',
  ],
  new: [
    'Session：调度、预检与验收的最小单位',
    'State-as-a-File：跨层状态可读、可审计',
    'SessionVerifier：区分「执行结束」与「任务完成」',
    '验证过的经验沉淀为记忆，模型权重零改动',
    '预检 → 桥接 → SafetyGuard → 心跳 → 目标端',
  ],
};

export const HeroPoints: React.FC<WidgetProps> = ({ moduleId }) => {
  const list = POINTS[moduleId];
  if (!list) return null;
  const isOld = moduleId === 'old';
  return (
    <ul className={`hp-list ${isOld ? 'is-old' : 'is-new'}`} aria-label={isOld ? '传统方法的失败模式' : '本文方法的系统保证'}>
      {list.map((t) => (
        <li key={t}>
          <span className="hp-dot" aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
};

export default HeroPoints;
