import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type StepKind = 'normal' | 'recover' | 'done';

const STEPS: { sub: string; note: string; kind: StepKind }[] = [
  { sub: '走到抽屉前', note: '高层子步骤：定位抽屉位置。', kind: 'normal' },
  { sub: '拉开顶层抽屉', note: '低层策略在 5Hz 闭环执行。', kind: 'normal' },
  { sub: '取出米饼', note: '按实体引用锁定目标物体。', kind: 'normal' },
  { sub: '扰动：米饼被撞回抽屉', note: '现场出现扰动，计划需要恢复。', kind: 'recover' },
  { sub: '重新取出米饼', note: '模型调整子步骤，重新完成。', kind: 'recover' },
  { sub: '递给用户', note: '长程序列回到正常推进。', kind: 'normal' },
  { sub: '放下（成功）', note: '任务完成，终态置灰。', kind: 'done' },
];

/**
 * §8 P2 步进可视化：上一步 / 下一步推进厨房长程序列；扰动步与恢复步用橙标，
 * 当前步与成功终态用绿标；真机原图 Fig 5 由模块 figure 挂载在上方。
 */
export const RealRobotScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isRecover = current.kind === 'recover';

  const dotClass = (i: number) => {
    if (i === step) return 'current';
    if (STEPS[i].kind === 'recover') return 'recover';
    return i < step ? 'reached' : '';
  };

  return (
    <div>
      <div className="step-track" id={`${chapterId}-${moduleId}`} role="group" aria-label="真机序列步骤">
        {STEPS.map((s, i) => (
          <button
            key={s.sub}
            type="button"
            className={`step-dot ${dotClass(i)}`}
            aria-label={`第 ${i + 1} 步：${s.sub}`}
            aria-pressed={i === step}
            onClick={() => setStep(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="panel-box">
        <h5>第 {step + 1} 步：{current.sub}</h5>
        <div className="panel-body">{current.note}</div>
      </div>

      <div className="chip-row" role="group" aria-label="真机序列导航">
        <button type="button" className="chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          上一步
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
        >
          下一步
        </button>
      </div>

      <div className={`feedback ${isRecover ? 'bad' : 'good'}`}>
        {isRecover
          ? '扰动步高亮：模型在现场被打乱后调整步骤、重新完成任务。'
          : '模型只输出高层子步骤，真正闭环动作由既有低层策略在 5Hz 执行。'}
      </div>
      <p className="module-desc" style={{ marginTop: 8 }}>
        桌面任务展示单样本（Move the remaining blocks to the group）与零样本（Move the green blocks to the turtle）泛化样例，属于演示，不是大样本统计基准。
      </p>
    </div>
  );
};

export default RealRobotScene;
