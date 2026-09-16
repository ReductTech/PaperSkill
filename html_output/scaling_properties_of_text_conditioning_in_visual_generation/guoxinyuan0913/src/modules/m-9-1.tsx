import React, { useState } from 'react';
import { C } from './studioKit';
import type { WidgetProps } from './registry';

// §9 模块 9.1：三段训练阶梯（P2 步进 + P4 对照芯片；技术视图）——Table 4 数值
const STAGES = [
  { name: 'Base（零样本）', dpg: 89.42, structure: 4.86, align: 8.307, gsb: null as number | null },
  { name: '+ SFT', dpg: 89.61, structure: 6.273, align: 8.473, gsb: 23.3 },
  { name: '+ Cold-start', dpg: 89.84, structure: 6.753, align: 8.36, gsb: 28.7 },
  { name: '+ RFT（门控 OPSD）', dpg: 90.71, structure: 7.6, align: 9.047, gsb: 42.0 },
];
const ALT = [
  { name: '对照：GRPO（验证器打分作奖励）', structure: 7.113, gsb: 36.7 },
  { name: '对照：无门控 OPSD', structure: 6.993, gsb: 33.3 },
];

export const M911: React.FC<WidgetProps> = () => {
  const [i, setI] = useState(0);
  const cur = STAGES[i];
  return (
    <div className="widget">
      <div className="ladder-row">
        <div className="ladder-bars" style={{ flex: 2 }}>
          <div className="bar-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${((cur.structure - 4) / 4) * 100}%`, background: C.green }} />
              <span className="bar-num">{cur.structure.toFixed(3)}</span>
            </div>
            <div className="bar-label">结构分（0–10，GPT-5.4 离线评审）</div>
          </div>
          <div className="bar-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${cur.gsb === null ? 0 : cur.gsb}%`, background: C.orange }} />
              <span className="bar-num">{cur.gsb === null ? '—' : cur.gsb + '%'}</span>
            </div>
            <div className="bar-label">GSB vs 零样本 Base（双序净偏好，N=150）</div>
          </div>
          <div className="fb-hint">DPG-Bench 全流水线仅 +1.29 分（89.42 → 90.71）：对结构差异相对不敏感</div>
        </div>
        <div className="ladder-fields" style={{ flex: 1 }}>
          {ALT.map((a) => (
            <div key={a.name} className="field-row">
              <span className="field-added">{a.name}</span>
              <span className="field-tok">{a.structure.toFixed(3)} / {a.gsb}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ctrl-row">
        <button className="chip" disabled={i === 0} onClick={() => setI(i - 1)}>← 上一步</button>
        <button className="chip" disabled={i === STAGES.length - 1} onClick={() => setI(i + 1)}>下一步 →</button>
        <button className="chip" onClick={() => setI(0)}>重置</button>
      </div>
      <div className={`feedback ${i === 0 ? 'fb-blue' : i === 3 ? 'fb-green' : 'fb-blue'}`}>
        {i === 0
          ? 'Base：零样本填 schema，结构分只有 4.860——合法但内容单薄。'
          : i === 1
            ? '学会目标 SP 分布：结构分最大单步提升（+1.413），GSB 23.3%'
            : i === 2
              ? '学会图像无关的推导，GSB 升至 28.7% 但 alignment 微降——特权轨迹不是万能的'
              : '高精度守门 + 图像条件教师蒸馏：结构 7.600、GSB 42.0%'}
      </div>
    </div>
  );
};
