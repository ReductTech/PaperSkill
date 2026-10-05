import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 三层软件栈步进（P5）：Datasets → Simulators → Tasks，最后 Habitat 统一平台。
const STEPS = [
  { title: 'Datasets（数据集）', desc: '提供带语义标注的 3D 资产：Matterport3D、Gibson、Replica…', color: '#7c3aed' },
  { title: 'Simulators（模拟器）', desc: '渲染资产、模拟具身 agent：Habitat-Sim 高性能仿真。', color: '#2563eb' },
  { title: 'Tasks（任务）', desc: '定义可评测问题与基准：导航、问答、指令跟随…', color: '#ea580c' },
  { title: 'Habitat 平台', desc: 'Generic Dataset Support + Habitat-Sim + Habitat-API，统一全栈。', color: '#16a34a' },
];

export const P5SoftwareStack: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  return (
    <div className="mod-stack">
      <div className="stack-layers">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className={`stack-layer ${i <= step ? 'done' : ''} ${i === step ? 'active' : ''}`}
            style={{ borderColor: s.color }}
          >
            <span className="stack-num">{i + 1}</span>
            <span className="stack-title">{s.title}</span>
            {i <= step ? <span className="stack-check">✓</span> : null}
          </div>
        ))}
      </div>
      <div className="stack-detail" key={step}>
        <strong>{cur.title}</strong>
        <p>{cur.desc}</p>
      </div>
      <div className="stack-ctl">
        <button disabled={step === 0} onClick={() => setStep(step - 1)}>← 上一步</button>
        <span className="stack-pos">{step + 1} / {STEPS.length}</span>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
          {step === STEPS.length - 1 ? '完成' : '下一步 →'}
        </button>
      </div>
      <div className="feedback good">
        标准化的软件栈让“换数据集”像改个名字一样简单，规模化实验成为可能（§1–§3）。
      </div>
    </div>
  );
};

export default P5SoftwareStack;
