import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const LargeStepDistillationLab: React.FC<WidgetProps> = () => {
  const config = {
    teacher: { label: '多步冻结教师', steps: 20, color: '#a9583e', note: '教师用许多短距离更新逐步积分速度场，局部误差较容易控制。' },
    naive: { label: '直接改采样器为四步', steps: 4, color: '#c64545', note: '没有针对大跨度更新重训，局部速度误差会被放大，结构、细节、文字和指令遵循容易退化。' },
    student: { label: '蒸馏后的四步学生', steps: 4, color: '#3f8f5f', note: '学生从对齐教师 checkpoint 初始化并继续更新参数，学习适合固定四步轨迹的速度场。' },
  } as const;
  return (
    <div className="distill-story-card">
      <div className="large-step-grid" aria-label="比较教师、直接四步与蒸馏学生">
        {(Object.entries(config) as Array<[keyof typeof config, typeof config[keyof typeof config]]>).map(([id, item]) => <div key={id} className={`large-step-card is-${id}`}><span>{item.label}</span><div style={{ '--trajectory-color': item.color } as React.CSSProperties}>{Array.from({ length: item.steps === 4 ? 4 : 8 }, (_, index) => <i key={index} />)}</div><strong>{item.steps} 次主干调用</strong><p>{item.note}</p></div>)}
      </div>
      <p className="module-note">训练框架从某个带噪状态学习到近干净样本的映射；不应理解为每个训练 iteration 都完整展开一次四步推理。</p>
    </div>
  );
};

const branches = {
  ca: {
    label: 'CA · 条件增强',
    formula: 'ΔCA = (w−1)[Treal_cond − Treal_uncond]',
    role: '继承冻结教师在普通条件预测之外的 CFG 增强方向，重点保持 Prompt、文字和编辑指令遵循。',
    actors: ['冻结教师 · conditional', '冻结教师 · unconditional'],
  },
  dm: {
    label: 'DM · 分布匹配',
    formula: 'ΔDM = Treal_cond − Tfake_cond',
    role: '用目标分布与当前学生分布的预测差提供修正方向；匹配整批样本分布，而不是复制教师的某一张图。',
    actors: ['冻结教师 · target distribution', '可训练 fake-score · student distribution'],
  },
} as const;

export const DecoupledDmdLab: React.FC<WidgetProps> = () => {
  const [branch, setBranch] = useState<keyof typeof branches>('ca');
  const [caNoise, setCaNoise] = useState(35);
  const [dmNoise, setDmNoise] = useState(70);
  const current = branches[branch];
  return (
    <div className="distill-story-card">
      <div className="clean-estimate"><span>学生预测</span><strong>ẑ₀ = Sθ(zₜ,t,c)</strong></div>
      <div className="renoise-branches">
        <div className={branch === 'ca' ? 'active' : ''}><label>重新加噪 τ<sub>ca</sub> · {caNoise}%</label><input type="range" min="0" max="100" value={caNoise} onChange={(e) => setCaNoise(Number(e.target.value))} /><button type="button" onClick={() => setBranch('ca')}>查看 CA</button></div>
        <div className={branch === 'dm' ? 'active' : ''}><label>重新加噪 τ<sub>dm</sub> · {dmNoise}%</label><input type="range" min="0" max="100" value={dmNoise} onChange={(e) => setDmNoise(Number(e.target.value))} /><button type="button" onClick={() => setBranch('dm')}>查看 DM</button></div>
      </div>
      <div className="dmd-detail"><span>{current.label}</span><h5>{current.formula}</h5><div>{current.actors.map(actor => <b key={actor}>{actor}</b>)}</div><p>{current.role}</p></div>
      <p className="module-note">Decoupled-DMD 允许 τ<sub>ca</sub> 与 τ<sub>dm</sub> 使用独立噪声调度；CA 的 CFG 强度为 w=7.5。</p>
    </div>
  );
};

export const PerceptualGuidanceLab: React.FC<WidgetProps> = () => {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="distill-story-card">
      <div className="ctrl" role="group" aria-label="是否加入对抗感知引导">
        <button type="button" className={`chip ${!enabled ? 'active' : ''}`} onClick={() => setEnabled(false)}>仅 Decoupled-DMD</button>
        <button type="button" className={`chip ${enabled ? 'active' : ''}`} onClick={() => setEnabled(true)}>+ 对抗感知引导</button>
      </div>
      <div className={`feature-guidance-flow ${enabled ? 'is-enabled' : ''}`}>
        <span>生成图 / 真实图</span><b>→</b><span>冻结 DINOv2<br />冻结 CLIP</span><b>→</b><span>轻量特征判别器</span><b>→</b><span>∇L<sub>GAN</sub></span>
      </div>
      <div className="adversarial-schedule"><span>判别器更新</span><strong>5 次</strong><i>:</i><span>学生生成器更新</span><strong>1 次</strong></div>
      <p className={`feedback ${enabled ? 'good' : 'warn'}`}>{enabled ? '特征空间对抗信号补充四步轨迹容易损失的纹理、局部结构、文字形状与真实感；视觉基础模型保持冻结。' : '仅靠分布与条件方向仍可能丢失高频感知细节，因此论文加入独立的特征判别器。'}</p>
    </div>
  );
};

export const TurboTrainingDataLab: React.FC<WidgetProps> = () => {
  const [task, setTask] = useState<'generation' | 'editing'>('generation');
  return (
    <div className="distill-story-card">
      <div className="ctrl" role="tablist" aria-label="选择生成或编辑蒸馏">
        <button type="button" role="tab" aria-selected={task === 'generation'} className={`chip ${task === 'generation' ? 'active' : ''}`} onClick={() => setTask('generation')}>Mage-Flow-Turbo</button>
        <button type="button" role="tab" aria-selected={task === 'editing'} className={`chip ${task === 'editing' ? 'active' : ''}`} onClick={() => setTask('editing')}>Mage-Flow-Edit-Turbo</button>
      </div>
      {task === 'generation' ? (
        <div className="turbo-task-card"><strong>约 20 万组高质量 Prompt–图像对</strong><p>从 RL 对齐的 Mage-Flow 教师蒸馏四步生成学生。</p><div><span>4 步</span><b>0.59 秒</b><small>单张 A100 · 1024²</small></div></div>
      ) : (
        <div className="turbo-task-card"><strong>约 25 万个编辑样本</strong><p>编辑数据与生成数据按 3:1 混合；目标图作为判别器真实分支，使感知信号贴近正确编辑结果。</p><div><span>4 步</span><b>1.02 秒</b><small>单张 A100 · 1024²</small></div></div>
      )}
      <p className="module-note">编辑数据学习指令遵循与源图保持；混入生成数据用于保留开放式生成能力和大幅视觉变化时的鲁棒性。</p>
    </div>
  );
};
