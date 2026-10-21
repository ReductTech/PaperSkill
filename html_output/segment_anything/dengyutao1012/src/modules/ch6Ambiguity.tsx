import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 第6章 模块1：歧义提示 → 3 个嵌套掩码（漫画 + 滑钮 + 芯片切换）
const STAGES = [
  { key: 'whole', th: 0, label: 'whole · 整只小狗', color: '#228d5c', icon: '🐶' },
  { key: 'part', th: 40, label: 'part · 一只前爪', color: '#27446e', icon: '🐾' },
  { key: 'subpart', th: 75, label: 'subpart · 一个爪尖', color: '#7c3aed', icon: '🐾' },
];

export const Ch6Ambiguity: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [v, setV] = useState(0);
  const stageIdx = v < 40 ? 0 : v < 75 ? 1 : 2;
  const s = STAGES[stageIdx];
  const descs: Record<string, string> = {
    whole: '橙色提示点落在小狗身上，最自然的解释：整只小狗（whole）。',
    part: '把目标再收窄一点：只要一只前爪（part）。',
    subpart: '最细粒度：只抠一个爪尖（subpart）。',
  };
  return (
    <div>
      <div className="amb-card">
        <img className="amb-img" src="./images/comic-14.jpg" alt="歧义提示：一个点三种掩码" />
        <div className="amb-info">
          <div className="amb-tag" style={{ borderColor: s.color, color: s.color }}>
            {s.icon} {s.label}
          </div>
          <p className="amb-desc">{descs[s.key]}</p>
          <p className="amb-desc">
            同一提示点、三套都合理的嵌套掩码——这就是「歧义」。训练时只对<b>损失最小</b>的那个反向传播，推理时用预估 IoU 排序。
          </p>
        </div>
      </div>
      <div className="ctrl">
        <label>
          歧义程度 <span className="val">{v}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="amb-range"
        />
      </div>
      <div className="amb-chips">
        {STAGES.map((st, i) => (
          <span
            key={st.key}
            className={`amb-chip ${i === stageIdx ? 'on' : ''}`}
            style={{ ['--chip' as string]: st.color }}
            onClick={() => setV(st.th)}
            role="button"
            tabIndex={0}
          >
            {st.icon} {st.label.replace('· ', ' · ')}
          </span>
        ))}
      </div>
      <div className="feedback">
        一个模糊点可给出 3 个嵌套的有效掩码（whole / part / subpart）；训练时只对损失最小的掩码反向传播，推理时用预估 IoU 排序供你挑选。
      </div>
    </div>
  );
};

export default Ch6Ambiguity;
