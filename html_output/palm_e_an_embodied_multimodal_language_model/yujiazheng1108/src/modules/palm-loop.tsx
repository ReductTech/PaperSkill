import { useState } from 'react';
import { Choice, Feedback, Kitchen } from './palm-kit';

const steps = [
  { seen: '抽屉合上', next: '打开右侧抽屉', opening: 0, sponge: 1, arm: 515 },
  { seen: '右抽屉里有海绵', next: '取出海绵', opening: 1, sponge: 1, arm: 515 },
  { seen: '夹具已抓住海绵', next: '把海绵放到台面', opening: 1, sponge: 2, arm: 554 },
  { seen: '海绵已放在台面', next: '结束', opening: .8, sponge: 3, arm: 615 },
];

export function PalmLoop() {
  const [step, setStep] = useState(0);
  const state = steps[step];
  return <div className="pk-body pk-stack pk-loop">
    <div className="pk-split pk-loop-main">
      <div className="pk-card pk-kitchen-stage">
        <Kitchen opening={state.opening} sponge={state.sponge} arm={state.arm} camera spill />
      </div>
      <div className="pk-card pk-stack">
        <h2>提示里的当前观测</h2><p>{state.seen}</p>
        <h2>生成的文本子任务</h2><p className="pk-emphasis">{state.next}</p>
      </div>
    </div>
    <div className="pk-history" aria-label="已执行的步骤">{steps.slice(0, 3).map((item, i) =>
      <div key={item.next} className={i < step ? 'done' : i === step ? 'current' : ''}>
        <strong>{i + 1}</strong>{item.next}
      </div>)}</div>
    <div className="pk-command">
      <Choice onClick={() => setStep(step === 3 ? 0 : step + 1)}>{step === 3 ? '重放任务' : '由低层策略执行'}</Choice>
      <Feedback tone={step === 3 ? 'green' : 'blue'}>{step === 3 ? '任务完成，下一条文本为结束。' : '规则演示。低层策略执行子任务，更新图像和步骤历史后再生成。'}</Feedback>
    </div>
  </div>;
}
