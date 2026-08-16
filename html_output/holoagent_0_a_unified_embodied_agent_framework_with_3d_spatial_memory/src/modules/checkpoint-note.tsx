import React from 'react';
import type { WidgetProps } from './registry';

const notes: Record<string, string> = {
  '2.2': 'AgentOS 看到的是统一的 Skill contract，而不是每个底层模型的内部结构。',
  '3.2': 'SAM2 负责 mask，SigLIP 负责 descriptor，融合后形成开放词汇语义表示。',
  '3.3': 'HMSG 用 Floor -> Room -> View -> Object 把全局搜索变成粗到细检索。',
  '3.4': 'Temporal Memory 记执行过程，Spatial Update 改写世界记忆，然后触发 re-plan。',
};

export const CheckpointNote = ({ moduleId }: WidgetProps) => (
  <div className="feedback good">
    {notes[moduleId] ?? 'Checkpoint: 这一小节用于把主交互中的关键机制单独收束。'}
  </div>
);
