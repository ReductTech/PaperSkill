import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Status = 'supported' | 'limited' | 'unsupported';
type Filter = 'all' | Status;
type AxisId = 'motion' | 'object' | 'scene' | 'instruction' | 'dynamics';

type Axis = {
  id: AxisId;
  label: string;
  status: Status;
  verdict: string;
  evidence: string;
  transfer: string;
  boundary: string;
};

const axes: Axis[] = [
  {
    id: 'motion',
    label: '新动作 / 新运动技能',
    status: 'unsupported',
    verdict: '不成立',
    evidence: '§5 明确：网页预训练不会让机器人获得新动作。',
    transfer: '模型只能把已有抓取、放置、推动等技能换个目标使用。',
    boundary: '擦桌子、用工具、折毛巾等超出机器人数据动作分布的技能仍不具备。',
  },
  {
    id: 'object',
    label: '新物体',
    status: 'supported',
    verdict: '成立',
    evidence: 'Unseen Objects 评测专门测试训练中未出现的玩具、饮料和零食。',
    transfer: '网页数据提供物体名称、外观和语义，机器人仍执行已学过的抓取/放置。',
    boundary: '它不是学会新物理动作，而是把旧动作可靠地用于新物体。',
  },
  {
    id: 'scene',
    label: '新背景 / 新环境',
    status: 'limited',
    verdict: '成立，但有上限',
    evidence: 'Unseen Backgrounds 与 Unseen Environments 给出量化结果。',
    transfer: '视觉背景变化时，预训练概念帮助模型识别目标和场景。',
    boundary: '极端布局、严重遮挡或新环境结构仍可能导致失败，不能泛化到所有场景。',
  },
  {
    id: 'instruction',
    label: '新说法 / 新符号',
    status: 'supported',
    verdict: '成立',
    evidence: '涌现能力测试包含符号理解、推理、人物识别等任务。',
    transfer: '语言和符号知识来自网页语料，换一种表达不必重新采集机器人动作。',
    boundary: '需要多层间接推理的复杂任务仍可能失败。',
  },
  {
    id: 'dynamics',
    label: '新物体动力学',
    status: 'unsupported',
    verdict: '不成立',
    evidence: '图 9 与附录 G 记录未见过的物体动力学失败。',
    transfer: '模型能听懂指令并先移动到正确物体附近。',
    boundary: '笔会滚下桌，香蕉质心偏离接触点；模型控制不住新接触动力学。',
  },
];

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部五种' },
  { id: 'supported', label: '成立' },
  { id: 'limited', label: '有上限' },
  { id: 'unsupported', label: '不成立' },
];

const otherLimits = [
  '55B 云端推理成本高，高频控制场景下实时性可能成为瓶颈。',
  '可用于改造 RT-2 的开源 VLM 数量有限，依赖可微调的模型底座。',
  '按把手等特定部位抓取、精细折叠、需要多层间接推理的任务仍表现不佳。',
];

const statusLabel: Record<Status, string> = {
  supported: '成立',
  limited: '有上限',
  unsupported: '不成立',
};

export const LimitationRecap: React.FC<WidgetProps> = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const visibleAxes = useMemo(
    () => (filter === 'all' ? axes : axes.filter((axis) => axis.status === filter)),
    [filter],
  );

  return (
    <div className="lr102">
      <div className="lr102-rule">
        <b>判断标准</b>
        <p>“成立”必须有论文评测或失败案例支撑：看网页知识迁移的是语义/视觉概念，还是需要机器人重新学习物理动作。</p>
      </div>

      <div className="lr102-filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            className={filter === item.id ? 'is-active' : ''}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="lr102-grid">
        {visibleAxes.map((axis) => (
          <article key={axis.id} className={`lr102-card is-${axis.status}`}>
            <div className="lr102-card-head">
              <span>{axis.label}</span>
              <b>{statusLabel[axis.status]}</b>
            </div>
            <p><i>证据：</i>{axis.evidence}</p>
            <p><i>迁移：</i>{axis.transfer}</p>
            <p><i>边界：</i>{axis.boundary}</p>
          </article>
        ))}
      </div>

      <section className="lr102-figure">
        <div>
          <h4>图 9：两个动力学失败案例</h4>
          <p>模型能找到正确物体，但无法预测物体被推动后的真实运动。</p>
          <ul>
            <li><b>红笔：</b>接触后滚动，最后滚下桌面。</li>
            <li><b>香蕉：</b>质心远离机器人接触位置，推动轨迹不符合预期。</li>
          </ul>
        </div>
        <img src="./images/paper/fig-9.png" alt="RT-2 图 9：红笔和香蕉的动力学失败案例" />
      </section>

      <section className="lr102-other">
        <h4>其他边界</h4>
        <div>
          {otherLimits.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>
    </div>
  );
};

export default LimitationRecap;
