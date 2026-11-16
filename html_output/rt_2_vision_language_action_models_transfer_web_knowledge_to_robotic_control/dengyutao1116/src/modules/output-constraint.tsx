import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type TaskKey = 'strawberry' | 'sevenUp';
type Candidate = {
  label: string;
  score: number;
  inScene: boolean;
  inInstruction: boolean;
};

const tasks: Record<TaskKey, {
  name: string;
  instruction: string;
  sceneObjects: string[];
  candidates: Candidate[];
  validOutput: string;
}> = {
  strawberry: {
    name: '把草莓放进碗',
    instruction: '把草莓放进正确的碗',
    sceneObjects: ['碗', '草莓', '夹爪'],
    validOutput: 'pick bowl #2',
    candidates: [
      { label: 'bowl（碗）', score: 42, inScene: true, inInstruction: true },
      { label: 'strawberry（草莓）', score: 31, inScene: true, inInstruction: true },
      { label: 'drawer（抽屉）', score: 18, inScene: false, inInstruction: false },
      { label: 'donkey（驴）', score: 49, inScene: false, inInstruction: false },
    ],
  },
  sevenUp: {
    name: '拿起 7up 罐',
    instruction: '拿起 7up 罐',
    sceneObjects: ['7up 罐', '可乐罐', '夹爪'],
    validOutput: 'pick 7up can',
    candidates: [
      { label: '7up 罐', score: 44, inScene: true, inInstruction: true },
      { label: 'coke 罐', score: 39, inScene: true, inInstruction: false },
      { label: 'drawer（抽屉）', score: 18, inScene: false, inInstruction: false },
      { label: 'donkey（驴）', score: 49, inScene: false, inInstruction: false },
    ],
  },
};

export const OutputConstraint: React.FC<WidgetProps> = () => {
  const [taskKey, setTaskKey] = useState<TaskKey>('strawberry');
  const [constrained, setConstrained] = useState(true);
  const task = tasks[taskKey];

  const isAllowed = (candidate: Candidate) => !constrained || candidate.inScene || candidate.inInstruction;
  const visibleCandidates = task.candidates.filter(isAllowed);
  const bestCandidate = constrained
    ? visibleCandidates.reduce((best, item) => (item.score > best.score ? item : best), visibleCandidates[0])
    : task.candidates.reduce((best, item) => (item.score > best.score ? item : best), task.candidates[0]);

  return (
    <div className="oc42">
      <div className="oc42-controls">
        {(['strawberry', 'sevenUp'] as TaskKey[]).map((key) => (
          <button
            type="button"
            key={key}
            className={`rt2-btn ${taskKey === key ? 'is-active' : ''}`}
            onClick={() => setTaskKey(key)}
          >
            {tasks[key].name}
          </button>
        ))}
        <button
          type="button"
          className={`rt2-btn ${constrained ? 'is-green is-active' : 'is-bad'}`}
          onClick={() => setConstrained((value) => !value)}
        >
          约束：{constrained ? '开' : '关'}
        </button>
      </div>

      <section className="oc42-task">
        <div>
          <span>当前指令</span>
          <b>{task.instruction}</b>
        </div>
        <div>
          <span>场景物体</span>
          <div>
            {task.sceneObjects.map((object) => <i key={object}>{object}</i>)}
          </div>
        </div>
      </section>

      <div className="oc42-rule">
        <b>允许规则</b>
        <span>场景中可见，或指令中出现的名词才允许通过</span>
      </div>

      <section className="oc42-candidate-list">
        <div className="oc42-table-head">
          <span>候选名词</span>
          <span>模型分数</span>
          <span>状态</span>
        </div>
        {task.candidates.map((candidate) => {
          const allowed = isAllowed(candidate);
          const selected = bestCandidate.label === candidate.label;
          return (
            <div className={`oc42-row ${allowed ? 'is-allowed' : 'is-blocked'} ${selected ? 'is-selected' : ''}`} key={candidate.label}>
              <b>{candidate.label}</b>
              <div className="oc42-bar">
                <i style={{ width: allowed ? `${candidate.score}%` : '0%' }} />
              </div>
              <em>{allowed ? `${candidate.score}%` : '屏蔽'}</em>
              <span>{allowed ? '允许' : '屏蔽'}</span>
            </div>
          );
        })}
      </section>

      <section className={`oc42-output ${constrained ? 'is-valid' : 'is-invalid'}`}>
        <div>
          <span>{constrained ? '约束后的输出' : '关闭约束后的输出'}</span>
          <b>{constrained ? task.validOutput : 'pick donkey'}</b>
        </div>
        <p>
          {constrained
            ? 'donkey 分数虽高，但不在场景中、也不在指令里，因此被屏蔽；动作整数仍照常预测。'
            : 'donkey 成为最高分，即使画面里没有驴，模型也可能输出这个名词，导致抓取对象不可靠。'}
        </p>
      </section>

      <p className="oc42-footnote">分数为教学示意，不是论文原始概率；论文要求机器人动作任务只采样有效动作 token，普通视觉语言任务仍可使用完整词表。</p>
    </div>
  );
};

export default OutputConstraint;
