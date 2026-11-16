import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type TaskId = 'hammer' | 'green' | 'different' | 'drink';
type Stage = 0 | 1 | 2 | 3;

type ReasoningTask = {
  id: TaskId;
  shortLabel: string;
  prompt: string;
  plan: string;
  action: string;
  execution: string;
  planNote: string;
};

const tasks: ReasoningTask[] = [
  {
    id: 'hammer',
    shortLabel: '石头当锤子',
    prompt: 'I need to hammer a nail, what object from the scene might be useful?',
    plan: 'Rocks.',
    action: '1 129 138 122 132 135 106 127',
    execution: '抓起石头，对准钉子并下压',
    planNote: '这条原始输出没有写 Plan 前缀，但“Rocks.”先回答了该用什么物体。',
  },
  {
    id: 'green',
    shortLabel: '绿色物体放一起',
    prompt: 'Move the green objects together.',
    plan: 'Plan: move green can near green rice chip bag.',
    action: '1 130 129 121 131 127 128 127',
    execution: '把绿色罐子移到绿色米片袋附近',
    planNote: '计划先明确目标关系，再让动作 token 去实现这个关系。',
  },
  {
    id: 'different',
    shortLabel: '挑出不同物体',
    prompt: 'Pick the object that is different from all other objects.',
    plan: 'Plan: pick rxbar chocolate.',
    action: '1 128 129 125 131 125 128 127',
    execution: '抓起与其他物体不同的 RXBar 巧克力',
    planNote: '模型先把“不同”落到具体物体，再生成抓取动作。',
  },
  {
    id: 'drink',
    shortLabel: '拿饮料',
    prompt: 'Bring me a drink.',
    plan: 'Plan: pick 7up can.',
    action: '1 143 129 123 145 114 115 127',
    execution: '拿起 7up 罐并交给用户',
    planNote: '自然语言计划把饮料类别收束到场景中的 7up 罐。',
  },
];

const stageNames = ['Prompt', 'Plan', 'Action', '执行'];

export const CotRollout: React.FC<WidgetProps> = () => {
  const [taskId, setTaskId] = useState<TaskId>('hammer');
  const [stage, setStage] = useState<Stage>(0);
  const [message, setMessage] = useState('先点击 Prompt，确认模型看到的任务。');
  const task = tasks.find((item) => item.id === taskId)!;

  useEffect(() => {
    setStage(0);
    setMessage('已切换任务：先点击 Prompt，再按顺序解锁 Plan 和 Action。');
  }, [taskId]);

  const clickStage = (nextStage: Stage) => {
    if (nextStage === stage) {
      setMessage(stage === 3 ? '本次链式输出已完成。' : '这一步已经解锁，请继续下一步。');
      return;
    }
    if (nextStage > stage) {
      setMessage('顺序不对：需要先写自然语言计划，再生成动作 token。');
      return;
    }
    setStage(nextStage);
    setMessage('已回到前面的步骤，后续内容需要重新解锁。');
  };

  const advance = () => {
    if (stage < 3) {
      const next = (stage + 1) as Stage;
      setStage(next);
      setMessage(
        next === 1
          ? '计划已解锁：先用自然语言说明要做什么。'
          : next === 2
            ? '动作已解锁：同一输出中继续生成整数 token。'
            : '执行已解锁：动作仍来自机器人数据中已学过的技能。',
      );
    }
  };

  return (
    <div className="cr92">
      <div className="cr92-task-tabs">
        {tasks.map((item) => (
          <button
            type="button"
            key={item.id}
            className={taskId === item.id ? 'is-active' : ''}
            onClick={() => setTaskId(item.id)}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div className="cr92-output">
        <button type="button" className="cr92-stage is-unlocked" onClick={() => clickStage(0)}>
          <span>Prompt</span>
          <b>{task.prompt}</b>
        </button>

        <button
          type="button"
          className={`cr92-stage ${stage >= 1 ? 'is-unlocked' : 'is-locked'}`}
          onClick={() => clickStage(1)}
        >
          <span>Plan</span>
          <b>{stage >= 1 ? task.plan : '未解锁：先确认 Prompt'}</b>
          {stage >= 1 && <small>{task.planNote}</small>}
        </button>

        <button
          type="button"
          className={`cr92-stage ${stage >= 2 ? 'is-unlocked' : 'is-locked'}`}
          onClick={() => clickStage(2)}
        >
          <span>Action</span>
          <b>{stage >= 2 ? task.action : '未解锁：不能跳过 Plan 直接生成动作'}</b>
        </button>

        <button
          type="button"
          className={`cr92-stage cr92-execution ${stage >= 3 ? 'is-unlocked' : 'is-locked'}`}
          onClick={() => clickStage(3)}
        >
          <span>执行</span>
          <b>{stage >= 3 ? task.execution : '完成 Action 后解锁'}</b>
        </button>
      </div>

      <div className="cr92-progress">
        {stageNames.map((name, index) => (
          <div key={name} className={index <= stage ? 'is-done' : ''}>
            <span>{index + 1}</span>
            <b>{name}</b>
          </div>
        ))}
      </div>

      <div className="cr92-footer">
        <p>{message}</p>
        <button type="button" onClick={advance} disabled={stage === 3}>
          {stage === 3 ? '已完成' : '解锁下一步'}
        </button>
      </div>

      <p className="cr92-note">
        论文 §4.4：PaLM-E 版本经过几百步梯度微调，并在数据中加入自然语言 Plan；它改变的是输出格式，让模型先说明动作目的，再输出动作 token，并不是新增网络结构或新动作。
      </p>
    </div>
  );
};

export default CotRollout;
