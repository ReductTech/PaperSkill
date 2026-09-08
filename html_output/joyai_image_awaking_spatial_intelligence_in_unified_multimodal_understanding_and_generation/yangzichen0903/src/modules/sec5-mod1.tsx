import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const RULES = [
  {
    label: '指标方向', sign: '↑ / ↓', title: '先确认“更好”朝哪个方向',
    text: 'Spatial Average、GEdit 得分越高越好；SpatialEdit 的 Camera Error 越低越好。方向读反，结论就会完全相反。',
    color: '#33ccff'
  },
  {
    label: '协议隔离', sign: '≠', title: '不同赛制不能直接排总榜',
    text: '理解、长文本生成、一般编辑、空间编辑采用不同数据集与评价协议。它们分别证明能力存在，但不能相加成一个“总能力分”。',
    color: '#ffcc00'
  },
  {
    label: '负面证据', sign: '!', title: '不利结果也属于结论边界',
    text: 'JoyAI-Image-Edit 强在指令遵循与结构一致性，但对 Nano Banana 2 的人评中，整体偏好与自然度仍然落后。',
    color: '#ff3366'
  }
];

export const Sec5Mod1: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const rule = RULES[active];
  return (
    <div className="boundary-checker">
      <div className="boundary-rule-tabs">
        {RULES.map((item, index) => (
          <button key={item.label} className={index === active ? 'active' : ''} onClick={() => setActive(index)}>
            <span style={{ background: item.color }}>{item.sign}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="boundary-rule-card" style={{ borderColor: rule.color }}>
        <div className="boundary-rule-sign" style={{ background: rule.color }}>{rule.sign}</div>
        <div><strong>{rule.title}</strong><p>{rule.text}</p></div>
      </div>
      <div className="feedback">当前规则：{rule.label}。先限定证据边界，再下结论。</div>
    </div>
  );
};

export default Sec5Mod1;
