import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Arrow, Pill } from './kit';

type Id = 'modular' | 'scratch' | 'co';

const options: Record<Id, {
  name: string;
  tag: string;
  color: string;
  lines: string[];
  verdict: string;
  detail: string[];
}> = {
  modular: {
    name: 'A · 模块拼接',
    tag: 'VLM + 策略头',
    color: PAL.blue,
    lines: ['VLM 负责看图、读指令', '另接一个策略头输出动作', '接口靠人工设计、分开训练'],
    verdict: '语义强，接口脆',
    detail: [
      'VLM 的语义能力保留得不错，但策略头只看最后一层特征。',
      '语言换一种说法、物体换一个外观，接口就可能对不上；两段分开训练，误差也会叠加。',
    ],
  },
  scratch: {
    name: 'B · 从零训练',
    tag: '机器人数据 only',
    color: PAL.red,
    lines: ['不加载网页预训练权重', '只用几千条机器人轨迹', '动作与语义一起从头学'],
    verdict: '动作能学，语义很弱',
    detail: [
      '数据量撑不起开放世界的语义：训练房间能做，换物体、换说法几乎全错。',
      '图 6b 的 Scratch 5B 平均泛化只有个位数，论文因此没有继续训练 55B 版本。',
    ],
  },
  co: {
    name: 'C · 共同微调（本文）',
    tag: '网页 + 机器人',
    color: PAL.green,
    lines: ['保留网页预训练的词表与主干', '机器人数据只改输出分布', '两路数据同时喂，不关旧课'],
    verdict: '语义与动作都保住',
    detail: [
      '动作写成词表里的整数 token，输出层不用换；网页 VQA 继续训练，语义不被机器人数据冲掉。',
      '55B + 共同微调的 Unseen Average 达到 62%，是图 6b 中最高的一组。',
    ],
  },
};

// Three ways to connect language understanding to robot action. The comparison
// is qualitative; only the 62% figure comes from Figure 6b.
export const ApproachCompare: React.FC<WidgetProps> = () => {
  const [id, setId] = useState<Id>('co');
  const o = options[id];
  const order: Id[] = ['modular', 'scratch', 'co'];
  return (
    <div>
      <Svg w={1080} h={308} label="三种把语义接到动作上的方案对比">
        {order.map((k, i) => {
          const x = 18 + i * 356;
          const active = k === id;
          const item = options[k];
          return (
            <g key={k} onClick={() => setId(k)} style={{ cursor: 'pointer' }}>
              <Card x={x} y={12} w={338} h={168} active={active} color={item.color} title={item.name}>
                <Pill x={x + 16} y={48} w={142} h={24} label={item.tag} color={item.color} size={10} />
                {item.lines.map((line, j) => (
                  <T key={line} x={x + 16} y={96 + j * 23} size={12} color={PAL.ink}>{line}</T>
                ))}
                <T x={x + 16} y={164} size={12} color={item.color} weight={600}>{item.verdict}</T>
              </Card>
            </g>
          );
        })}
        <Arrow x1={354} y1={96} x2={370} y2={96} color={PAL.line} />
        <Arrow x1={710} y1={96} x2={726} y2={96} color={PAL.line} />
        <Card x={18} y={196} w={724} h={100} color={o.color} title={`为什么选 ${id === 'co' ? 'C' : id === 'scratch' ? 'B' : 'A'}`} active>
          {o.detail.map((line, i) => (
            <T key={line} x={36} y={236 + i * 24} size={12} color={PAL.ink}>{line}</T>
          ))}
        </Card>
        <Card x={796} y={196} w={266} h={100} color={PAL.purple} title="一句话">
          <T x={814} y={236} size={13} color={PAL.ink} weight={600}>不是换头，是换写法</T>
          <T x={814} y={260} size={11} color={PAL.muted}>动作进入同一词表，</T>
          <T x={814} y={278} size={11} color={PAL.muted}>预训练语义才不会被切断。</T>
        </Card>
      </Svg>
      <div className="rt2-controls">
        {order.map((k) => (
          <button key={k} className={`rt2-btn ${id === k ? 'is-active' : ''}`} onClick={() => setId(k)}>
            {options[k].name}
          </button>
        ))}
      </div>
      <p className={`rt2-note ${id === 'co' ? 'is-good' : id === 'scratch' ? 'is-bad' : 'is-warn'}`}>
        <b>{o.verdict}：</b>{o.detail[0]}
      </p>
    </div>
  );
};

export default ApproachCompare;
