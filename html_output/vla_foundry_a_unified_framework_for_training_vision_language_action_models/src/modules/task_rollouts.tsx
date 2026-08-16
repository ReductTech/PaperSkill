import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Outcome = 'success' | 'failure';
type TaskKey = 'place_cup' | 'push_coaster' | 'turn_cup';

const tasks: Record<TaskKey, {
  title: string;
  category: string;
  success: string;
  failure: string;
}> = {
  place_cup: {
    title: '将杯子放到杯垫旁',
    category: '精细放置',
    success: '/videos/vla_foundry/place_cup_success.mp4',
    failure: '/videos/vla_foundry/place_cup_failure.mp4'
  },
  push_coaster: {
    title: '把杯垫推到桌面中心',
    category: '非抓取推送',
    success: '/videos/vla_foundry/push_coaster_success.mp4',
    failure: '/videos/vla_foundry/push_coaster_failure.mp4'
  },
  turn_cup: {
    title: '把杯子翻转',
    category: '姿态变化',
    success: '/videos/vla_foundry/turn_cup_success.mp4',
    failure: '/videos/vla_foundry/turn_cup_failure.mp4'
  }
};

export const TaskRollouts: React.FC<WidgetProps> = () => {
  const [taskKey, setTaskKey] = useState<TaskKey>('place_cup');
  const [outcome, setOutcome] = useState<Outcome>('success');
  const task = tasks[taskKey];
  const videoSrc = task[outcome];

  return (
    <div className="task-rollouts">
      <div className="rollout-stage">
        <div className="rollout-stage-meta">
          <span>官网 rollout · LBM Eval</span>
          <span className={'rollout-state ' + outcome}>{outcome === 'success' ? 'Success' : 'Failure'}</span>
        </div>
        <video key={videoSrc} src={videoSrc} autoPlay loop muted playsInline controls preload="metadata" />
      </div>

      <div className="rollout-caption">
        <strong>{task.title}</strong>
        <span>{task.category}</span>
      </div>

      <div className="rollout-control-group" aria-label="选择评估任务">
        {(Object.keys(tasks) as TaskKey[]).map((key) => (
          <button
            aria-pressed={taskKey === key}
            className={'rollout-task ' + (taskKey === key ? 'active' : '')}
            key={key}
            onClick={() => setTaskKey(key)}
          >
            {tasks[key].title}
          </button>
        ))}
      </div>

      <div className="rollout-outcome" aria-label="选择 rollout 结果">
        <button
          aria-pressed={outcome === 'success'}
          className={outcome === 'success' ? 'active success' : ''}
          onClick={() => setOutcome('success')}
        >
          Success rollout
        </button>
        <button
          aria-pressed={outcome === 'failure'}
          className={outcome === 'failure' ? 'active failure' : ''}
          onClick={() => setOutcome('failure')}
        >
          Failure rollout
        </button>
      </div>

      <p className="rollout-note">
        这些视频用于直观看闭环评估任务：策略根据观察持续输出动作，直到任务成功或失败。它们是论文官网的补充 rollout 展示，不是模型真实传感器输入。
      </p>
    </div>
  );
};
