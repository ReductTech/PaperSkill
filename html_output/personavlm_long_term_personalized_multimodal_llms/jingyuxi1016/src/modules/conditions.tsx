import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chip, Feedback, Frame } from './pvKit';

const conditions = ['仅当前问题', '知道旧偏好', '加入新偏好证据', '再加入人格条件'];
const drafts = [
  '可以试试街景或湖边，挑一个你感兴趣的地方开始画。',
  '你以前喜欢热闹街景，可以继续画人来人往的街道。',
  '你最近更想安静地画画，这次可以选湖边；旧的街景喜好不应自动当作最新偏好。',
  '这次可以先画安静的湖边。如果愿意，先勾几条水岸线就好，慢慢来。',
];
const feedback = [
  '只有当前问题时，草案没有用户历史依据，无法判断推荐是否符合最近的变化。',
  '当前依据可能过时：记住旧喜好，仍不能据此断定它是今天的选择。',
  '新记录改变了内容依据。保留旧历史与优先采用较新证据，可以同时发生。',
  '新偏好改变内容依据；人格条件主要影响回应方式。两者不能互相替代，也不保证每次回答都更好。',
];

export function EvidenceConditions({ chapterId, moduleId }: WidgetProps) {
  const [condition, setCondition] = useState(1);
  const evidence = [
    { title: '较早记录', text: '“我喜欢热闹街景，常画人来人往的街道。”', active: condition >= 1 },
    { title: '较新记录', text: '“最近想换成安静的湖边，画画时也不想赶进度。”', active: condition >= 2 },
    { title: '独立人格条件 P', text: '示意为已有 P 提供回应方式的条件；不把“喜欢湖边”直接换算成人格分数。', active: condition >= 3 },
  ];
  return <Frame id="conditions" evidence="依据原文 Fig.1 的问题类型；以下记录与草案均为编写的教学样例。">
    <div data-context={`${chapterId}/${moduleId}`}><strong>同一个当前问题：</strong>“今天练习画什么地方比较合适？”</div>
    <div className="pv-controls" aria-label="选择固定顺序的信息条件">{conditions.map((label, i) => <Chip key={label} active={condition === i} onClick={() => setCondition(i)}>{i + 1}. {label}</Chip>)}</div>
    <div className="pv-split">
      <div><h5>纳入回答的用户依据</h5>{evidence.map(item => <div className={`pv-evidence ${item.active ? 'active' : 'inactive'}`} key={item.title}><span className="pv-dot" style={{ background: item.active ? C.blue : C.line }} /><div><strong>{item.title} · {item.active ? '已纳入' : '未纳入'}</strong><p>{item.text}</p></div></div>)}</div>
      <div><h5>当前草案 · {conditions[condition]}</h5><div className="pv-plot"><p>{drafts[condition]}</p></div><p className="pv-muted">示意回答，非论文原始模型输出；不是在线运行或性能实验。</p><div className="pv-detail"><strong>只按当前输入回答</strong><p>{drafts[0]}</p><span className="pv-muted">固定参照：用于辨认历史与人格条件改变了哪里。</span></div></div>
    </div>
    <Feedback>{feedback[condition]}</Feedback>
  </Frame>;
}
