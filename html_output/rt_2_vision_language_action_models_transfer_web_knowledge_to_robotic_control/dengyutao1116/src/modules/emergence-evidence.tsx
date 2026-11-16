import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Arrow, Pill, Chibi } from './kit';

// Table 6 category scores: the sub-scores are what the three buttons switch.
// The three categories share one protocol, so the denominator stays visible.
const cats = {
  symbol: {
    label: '符号理解',
    values: [11, 16, 82, 36],
    examples: ['把可乐移到 “3” 旁边', '把苹果移到 “Y” 旁边', '把可乐放到 “心形” 上方'],
    note: '训练数据里没有数字、字母或图标；模型把网页里学到的符号含义搬到了动作指令上。',
  },
  reasoning: {
    label: '推理',
    values: [10, 16, 46, 43],
    examples: ['把香蕉移到 “二加二” 的位置', '把可乐移到 “泰勒·斯威夫特” 旁边', '把绿薯片放到同色碗里'],
    note: '需要算术、常识或跨语言；PaLI-X 最强，PaLM-E 在数学上反而更好。',
  },
  person: {
    label: '人物识别',
    values: [13, 20, 53, 43],
    examples: ['把可乐拿给 “戴眼镜的人”', '把可乐拿给 “白头发男人”', '把可乐拿给 “棕发女士”'],
    note: '人物从未出现在机器人数据里；识别来自网页预训练的视觉语义。',
  },
};

const models = [
  { n: 'VC-1', c: '#e0a33e' },
  { n: 'RT-1', c: '#c0392b' },
  { n: 'PaLI-X-55B', c: '#2f6fd0' },
  { n: 'PaLM-E-12B', c: '#3f9e6a' },
];

export const EmergenceEvidence: React.FC<WidgetProps> = () => {
  const [cat, setCat] = useState<keyof typeof cats>('symbol');
  const c = cats[cat];
  return (
    <div>
      <Svg w={1080} h={246} label="三类涌现能力的定量对比">
        <Card x={18} y={12} w={270} h={220} title="测试什么" color={PAL.orange} active>
          <T x={36} y={62} size={12} color={PAL.ink}>{c.label}</T>
          {c.examples.map((s, i) => (
            <g key={s}>
              <rect x={36} y={78 + i * 34} width={234} height={26} rx={6} fill={PAL.paper} stroke={PAL.line} />
              <T x={46} y={96 + i * 34} size={11} color={PAL.muted}>{s}</T>
            </g>
          ))}
          <T x={36} y={196} size={10} color={PAL.muted}>6 类任务、同一 A/B 测试协议</T>
        </Card>

        <Arrow x1={296} y1={116} x2={332} y2={116} color={PAL.muted} />
        <Card x={338} y={12} w={468} h={220} title="四个模型的当前类别成功率（%）" color={PAL.blue} active>
          {[0, 25, 50, 75, 100].map((v) => (
            <line key={v} x1={378} y1={182 - v * 1.3} x2={780} y2={182 - v * 1.3} stroke={PAL.line} />
          ))}
          {models.map((m, i) => {
            const h = c.values[i] * 1.3;
            return (
              <g key={m.n}>
                <rect x={390 + i * 96} y={182 - h} width={54} height={h} rx={4} fill={m.c} opacity={0.85} />
                <T x={417 + i * 96} y={176 - h} size={11} anchor="middle" color={m.c} weight={600}>{c.values[i]}</T>
                <T x={417 + i * 96} y={198} size={10} anchor="middle" color={PAL.ink}>{m.n}</T>
              </g>
            );
          })}
          <T x={378} y={216} size={10} color={PAL.muted}>当前类别；细分见附录表 6</T>
        </Card>

        <Card x={822} y={12} w={240} h={220} title="它意味着什么" color={PAL.purple} active>
          <Chibi x={1002} y={110} s={0.44} mood="happy" arm="point" />
          <T x={940} y={70} size={11} color={PAL.ink}>没演示过</T>
          <T x={940} y={88} size={11} color={PAL.ink}>也不影响判断</T>
          <T x={846} y={140} size={10} color={PAL.muted}>网页语义</T>
          <T x={846} y={158} size={10} color={PAL.muted}>迁移到动作</T>
          <Pill x={846} y={200} w={186} h={22} label="不是新运动技能" color={PAL.orange} size={10} />
        </Card>
      </Svg>
      <div className="rt2-controls">
        {(Object.keys(cats) as (keyof typeof cats)[]).map((k) => (
          <button key={k} className={`rt2-btn ${cat === k ? 'is-active' : ''}`} onClick={() => setCat(k)}>
            {cats[k].label}
          </button>
        ))}
      </div>
      <p className={`rt2-note ${cat === 'symbol' ? 'is-good' : ''}`}>
        <b>{c.label}：</b>
        {c.note} 数值取表 6 的该类成功率：VC-1 {c.values[0]}、RT-1 {c.values[1]}、PaLI-X-55B {c.values[2]}、PaLM-E-12B {c.values[3]}。
      </p>
    </div>
  );
};

export default EmergenceEvidence;
