import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Step = 'sample' | 'prefer' | 'dpo' | 'stop';

const STEPS: Record<
  Step,
  { title: string; body: string; fb: string }
> = {
  sample: {
    title: 'SAMPLE：从当前 A_θ 采提示',
    body: '循环从 ℬ 取行为 b，由 A_θ 生成 p，经防御流水线得到 y，用 h(b, y) 打分，收集一批三元组。',
    fb: '这一步只查询黑盒目标，不计算经过 M 的梯度。',
  },
  prefer: {
    title: '构造偏好集 𝒫',
    body: '按分位数把高分提示标为 chosen p⁺、低分标为 rejected p⁻。论文消融表明：中等规模偏好集即饱和，更应提高 chosen 质量，而不是盲目加大 N。',
    fb: '质量优先于数量：更高质量的 p⁺ 持续有用，单纯扩大样本很快收益递减。',
  },
  dpo: {
    title: 'DPO-TRAIN',
    body: '在 𝒫 上最小化 ℒ_DPO。θ 是 LoRA，冻结基座同时作为 π_θ₀。周期内在留出评估集上监视平均评判分；不再提升则早停，保存最优 θ*。',
    fb: 'β 对结果影响小；学习率过大会造成分布塌缩（EVUS 相近但多样性变差）。',
  },
  stop: {
    title: '重采样，进入下一周期',
    body: '单周期内增益约 100 epoch 后趋近零。收敛后用改进的攻击器重新采样偏好，形成自举。图 5 显示周期推进时评判分分布右移；周期 6 时高困惑度输出基本消失。',
    fb: 'IHO 是自适应过程：用目标反馈重塑自己的采样分布，而不是只刷过拒答。',
  },
};

const ORDER: Step[] = ['sample', 'prefer', 'dpo', 'stop'];

export const Ch7Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState<Step>('sample');
  const i = ORDER.indexOf(step);
  const cur = STEPS[step];

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {ORDER.map((id, k) => (
          <React.Fragment key={id}>
            <button
              type="button"
              className={`chip${step === id ? ' selected' : ''}`}
              onClick={() => setStep(id)}
            >
              {k + 1}. {STEPS[id].title.split('：')[0]}
            </button>
            {k < ORDER.length - 1 ? <span style={{ color: '#b8c0b0', fontWeight: 700 }}>→</span> : null}
          </React.Fragment>
        ))}
      </div>
      <div className={`opt-card ${step === 'stop' ? 'good' : ''}`} style={{ marginTop: 12 }}>
        <div className="opt-kicker">附录 A 算法 1 · {cur.title}</div>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65 }}>{cur.body}</p>
      </div>
      <div className="ctrl">
        <button type="button" onClick={() => setStep(ORDER[Math.max(0, i - 1)])} disabled={i === 0}>
          上一步
        </button>
        <button
          type="button"
          onClick={() => setStep(ORDER[Math.min(ORDER.length - 1, i + 1)])}
          disabled={i === ORDER.length - 1}
        >
          下一步
        </button>
      </div>
      <div className={`feedback ${step === 'stop' ? 'good' : ''}`}>{cur.fb}</div>
    </div>
  );
};

export default Ch7Mod2;
