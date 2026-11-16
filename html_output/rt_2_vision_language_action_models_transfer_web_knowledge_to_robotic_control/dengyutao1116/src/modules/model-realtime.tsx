import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type InstanceId = 'pali55' | 'pali5' | 'palm12' | 'pali3';

type Instance = {
  id: InstanceId;
  name: string;
  size: string;
  frequency: string;
  frequencyNote: string;
  deployment: string;
  environment: string;
  color: string;
  reported: boolean;
  range?: [number, number];
  detail: string;
};

const instances: Instance[] = [
  {
    id: 'pali55',
    name: 'RT-2-PaLI-X',
    size: '55B',
    frequency: '1–3 Hz',
    frequencyNote: '每秒约 1–3 个完整控制周期',
    deployment: '多 TPU 云服务，网络查询',
    environment: '真实机器人闭环',
    color: PAL.blue,
    reported: true,
    range: [1, 3],
    detail: '55B 模型无法直接放在常用机载 GPU 上，因此通过多 TPU 云服务查询。网络往返、模型推理和动作执行都计入这个端到端频率。',
  },
  {
    id: 'pali5',
    name: 'RT-2-PaLI-X',
    size: '5B',
    frequency: '约 5 Hz',
    frequencyNote: '每秒约 5 个完整控制周期',
    deployment: '多 TPU 云服务，网络查询',
    environment: '真实机器人闭环',
    color: PAL.green,
    reported: true,
    range: [5, 5],
    detail: '较小的 PaLI-X 推理更快，在相同云端部署方式下可达到约 5 Hz，更接近常规实时控制节奏。',
  },
  {
    id: 'palm12',
    name: 'RT-2-PaLM-E',
    size: '12B',
    frequency: '未报告',
    frequencyNote: '论文没有给出同等部署下的控制频率',
    deployment: '用于比较不同 VLM 底座',
    environment: '真实机器人实验',
    color: PAL.purple,
    reported: false,
    detail: 'PaLM-E 版本用于比较不同预训练模型底座的效果；不能根据参数量自行推测频率，应明确标注论文未报告。',
  },
  {
    id: 'pali3',
    name: 'RT-2-PaLI',
    size: '3B',
    frequency: '约 5 Hz',
    frequencyNote: 'Language-Table 中与基线相近',
    deployment: 'Language-Table 仿真任务',
    environment: '仿真环境',
    color: PAL.orange,
    reported: true,
    range: [5, 5],
    detail: '3B 模型用于开源 Language-Table 仿真，动作预测频率与其他基线相近，便于复现实验比较。',
  },
];

const loopSteps = [
  { title: '采集', desc: '机器人相机图像 + 当前指令' },
  { title: '上传', desc: '通过网络请求云服务' },
  { title: '预测', desc: '模型输出动作 token' },
  { title: '返回', desc: '动作 token 回到机器人' },
  { title: '执行', desc: '去 token 化并驱动机械臂' },
];

export const ModelRealtime: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<InstanceId>('pali55');
  const selected = instances.find((item) => item.id === selectedId)!;

  return (
    <div className="mr61">
      <div className="mr61-hz-explain">
        <b>Hz 是什么意思</b>
        <span>这里的 Hz 表示“观察 → 云端查询 → 动作执行”的完整闭环频率，不是单次前向传播速度。</span>
      </div>

      <div className="mr61-grid">
        {instances.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`mr61-card ${selectedId === item.id ? 'is-active' : ''}`}
            onClick={() => setSelectedId(item.id)}
            style={{ '--accent': item.color } as React.CSSProperties}
          >
            <span className="mr61-size">{item.size}</span>
            <span className="mr61-name">{item.name}</span>
            <strong>{item.frequency}</strong>
            <small>{item.frequencyNote}</small>
            {item.reported && item.range ? (
              <div className="mr61-frequency-bar">
                <i style={{ left: `${item.range[0]}0%`, width: `${(item.range[1] - item.range[0] + 1) * 10}%` }} />
              </div>
            ) : (
              <div className="mr61-no-data">未报告频率，不做数值条</div>
            )}
          </button>
        ))}
      </div>

      <section className="mr61-loop">
        <h4>云端闭环的一次控制周期</h4>
        <div className="mr61-steps">
          {loopSteps.map((step, index) => (
            <div key={step.title}>
              <span>{index + 1}</span>
              <b>{step.title}</b>
              <small>{step.desc}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="mr61-detail" style={{ '--accent': selected.color } as React.CSSProperties}>
        <div>
          <span>{selected.name} · {selected.size}</span>
          <b>{selected.frequency}</b>
        </div>
        <p>{selected.detail}</p>
        <div className="mr61-meta">
          <span>{selected.deployment}</span>
          <span>{selected.environment}</span>
        </div>
      </section>
    </div>
  );
};

export default ModelRealtime;
