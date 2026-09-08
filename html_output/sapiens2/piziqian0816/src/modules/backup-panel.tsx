import React from 'react';
import type { WidgetProps } from './registry';

const content: Record<string, { leftTitle: string; left: string[]; rightTitle: string; right: string[] }> = {
  B1: { leftTitle: 'Q · 想找什么', left: ['当前 token 发出查询', '与所有 Key 计算相关性'], rightTitle: 'K / V · 提供什么', right: ['Key 是可检索索引', 'Value 是实际聚合内容'] },
  B2: { leftTitle: '表示坍塌', left: ['不同图像输出同一向量', '自蒸馏失去区分信号'], rightTitle: '稳定机制', right: ['EMA Teacher 提供平滑目标', '分布校准控制偏置', 'KoLeo 鼓励样本分散'] },
  B3: { leftTitle: '越高越好 ↑', left: ['Pose mAP：关键点质量', 'mIoU：分割区域重合'], rightTitle: '越低越好 ↓', right: ['Pointmap L2：三维坐标误差', 'Normal MAE：法线角度误差'] },
  B4: { leftTitle: '系统结论', left: ['完整 Sapiens2 系统明显更强', '多任务结果支持整体能力'], rightTitle: '未隔离变量', right: ['自蒸馏与 KoLeo', '300M → 1B 数据', '模型、架构与任务标签'] },
};

export const BackupPanel: React.FC<WidgetProps> = ({ moduleId }) => {
  const item = content[moduleId] || content.B4;
  return <div className="backup-panel"><section><h3>{item.leftTitle}</h3>{item.left.map((line)=><p key={line}>{line}</p>)}</section><div className="backup-arrow">→</div><section><h3>{item.rightTitle}</h3>{item.right.map((line)=><p key={line}>{line}</p>)}</section></div>;
};
