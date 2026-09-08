import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const CloudEdge: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'cloud' | 'edge'>('cloud');
  const cloud = mode === 'cloud';
  const total = cloud ? 1200 : 180;
  return <div className="deploy-demo">
    <div className={`deploy-flow ${mode}`} role="img" aria-label={`${cloud ? '云端' : '端侧'}推理教学延迟 ${total} 毫秒`}>
      <div className="deploy-node">机器人相机<span>0 ms</span></div><div className="flow-line" />
      {cloud ? <><div className="deploy-node network">网络上传<span>150 ms</span></div><div className="flow-line" /></> : null}
      <div className="deploy-node model">{cloud ? 'Large Teacher' : 'MoT-2B'}<span>{cloud ? '900 ms' : '180 ms'}</span></div><div className="flow-line" />
      {cloud ? <><div className="deploy-node network">网络返回<span>150 ms</span></div><div className="flow-line" /></> : null}
      <div className={`deploy-node robot ${cloud ? 'danger' : 'safe'}`}>机器人动作<span>{total} ms</span></div>
    </div>
    <div className="chip-row" role="group" aria-label="切换部署位置"><button className={`chip ${cloud ? 'selected' : ''}`} onClick={() => setMode('cloud')}>Cloud</button><button className={`chip ${!cloud ? 'selected' : ''}`} onClick={() => setMode('edge')}>Edge · On Device</button></div>
    <div className={`feedback ${cloud ? 'bad' : 'good'}`} aria-live="polite">{cloud ? '正确答案来得太晚，仍可能成为失败动作。1200 ms 仅为交互示意，不是论文实测。' : 'MoT-2B 面向端侧部署：降低对网络往返的依赖，但具体延迟仍取决于硬件和实现。'}</div>
  </div>;
};

const stages = [
  { title: '看准目标', detail: 'Grounding + Segmentation + Depth', color: '#d97706' },
  { title: '理解行动', detail: 'Affordance + Trajectory + Planning', color: '#27446e' },
  { title: '端侧推理', detail: 'On-Policy Distillation → MoT-2B', color: '#7c3aed' },
  { title: '连续控制', detail: 'Action Expert → Robot Action', color: '#228d5c' },
];

export const VlaReplay: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const done = step === stages.length;
  const advance = () => setStep(s => Math.min(stages.length, s + 1));
  return <div className="vla-demo">
    <div className="task-quote">“把我刚才喝水的红色马克杯放进洗碗机上层，并且不要碰倒旁边的玻璃杯。”</div>
    <div className="vla-path">{stages.map((stage, i) => <React.Fragment key={stage.title}><button className={`${i < step ? 'done' : i === step ? 'active' : ''}`} onClick={() => setStep(i + 1)}><span>{i < step ? '✓' : `0${i + 1}`}</span><b>{stage.title}</b><small>{stage.detail}</small></button>{i < stages.length - 1 ? <i>→</i> : null}</React.Fragment>)}</div>
    <div className="final-scene" aria-label={done ? '任务成功完成' : '机器人正在执行任务'}><div className="final-robot">▣</div><div className={`final-cup ${done ? 'placed' : ''}`}>☕</div><div className="final-glass">杯</div><div className="final-dishwasher">上层架</div></div>
    <div className="step-ctrl"><button className="tiny" onClick={advance} disabled={done}>{done ? '任务已完成' : '执行下一步'}</button><button className="chip" onClick={() => setStep(0)}>重新查看</button></div>
    <div className={`feedback ${done ? 'good' : ''}`} aria-live="polite">{done ? 'SUCCESS：红杯进入上层，玻璃杯保持稳定。HY-Embodied-0.5 首先是 embodied VLM；接入 Action Expert 后才形成 VLA 控制链。' : `${stages[step]?.title ?? '准备执行'}：${stages[step]?.detail ?? ''}`}</div>
    <div className="quick-evidence" aria-label="论文结果与边界速览">
      <div><span>紧凑模型 · 22 项平均</span><b>58.0</b><small>16 项第一、4 项第二</small></div>
      <div><span>真实机器人成功率</span><b>85 / 80 / 75%</b><small>三项任务；每模型每任务 20 次</small></div>
      <div className="limit"><span>结论边界</span><b>不是普遍成功保证</b><small>更广鲁棒性与安全性未被该实机协议覆盖</small></div>
    </div>
    <p className="evidence-note">证据定位：论文 Figure 11、§6 与相关结果表。实机任务中，HY 在堆叠任务低于 π₀.₅，不能表述成所有任务均领先。</p>
    <div className="vla-closing">
      <p><b>职责边界：</b>HY-Embodied-0.5 首先是具身 VLM，相当于机器人的“脑”；接入 Action Expert 后，才形成输出动作的 VLA。</p>
      <blockquote>让 VLM 从“我知道这是什么”，走向“我知道怎样安全地对它采取行动”。</blockquote>
    </div>
  </div>;
};

export default CloudEdge;
