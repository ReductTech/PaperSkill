import React, { useState } from 'react';
import { C } from './studioKit';
import type { WidgetProps } from './registry';

// §9 模块 9.2：评审循环预算（P1 滑杆 + P4 芯片；技术视图）——Table 5 全部八组数值
const T5: Record<string, Record<number, { st: number; al: number; gsb: number | null; rounds: number }>> = {
  Base: {
    1: { st: 4.86, al: 8.307, gsb: null, rounds: 1.0 },
    2: { st: 5.387, al: 8.493, gsb: 14.7, rounds: 1.74 },
    4: { st: 6.027, al: 8.64, gsb: 22.7, rounds: 2.83 },
    8: { st: 6.107, al: 8.673, gsb: 24.0, rounds: 3.41 },
  },
  Trained: {
    1: { st: 7.6, al: 9.047, gsb: 42.0, rounds: 1.0 },
    2: { st: 7.94, al: 9.173, gsb: 49.3, rounds: 1.51 },
    4: { st: 8.213, al: 9.293, gsb: 54.0, rounds: 2.04 },
    8: { st: 8.26, al: 9.313, gsb: 54.7, rounds: 2.31 },
  },
};

export const M921: React.FC<WidgetProps> = () => {
  const [tmax, setTmax] = useState(1);
  const [prompter, setPrompter] = useState<'Base' | 'Trained'>('Trained');
  const d = T5[prompter][tmax];

  const fb =
    prompter === 'Trained' && tmax === 8
      ? { text: '54.0%→54.7%：主要错误修完后，更多轮次迅速饱和（平均仅 2.04→2.31 轮）', cls: 'fb-orange' }
      : prompter === 'Base' && tmax === 8
        ? { text: '8 轮零样本仍不及 1 轮训练后（6.107 vs 7.600）——训练吸收了大部分迭代需求', cls: 'fb-green' }
        : { text: `结构 ${d.st.toFixed(3)} · 对齐 ${d.al.toFixed(3)} · GSB ${d.gsb === null ? '—' : d.gsb + '%'} · 平均 ${d.rounds.toFixed(2)} 轮`, cls: 'fb-blue' };

  return (
    <div className="widget">
      <div className="loop-diagram">
        <span className="loop-node">提示器 π<sub>θ</sub></span> →
        <span className="loop-node">扩散器（固定）</span> →
        <span className="loop-node">评审 Gemini（6/10）</span> →
        <span className="loop-node loop-back">字段级意见 ⇢ 回到提示器</span>
      </div>
      <div className="metric-grid">
        <div><b>{d.st.toFixed(3)}</b><span>结构分</span></div>
        <div><b>{d.al.toFixed(3)}</b><span>对齐分</span></div>
        <div><b>{d.gsb === null ? '—' : d.gsb + '%'}</b><span>GSB</span></div>
        <div><b>{d.rounds.toFixed(2)}</b><span>平均轮数（成本）</span></div>
      </div>
      <div className="ctrl-row">
        <label>Tmax（最大评审轮数）
          <input type="range" min={0} max={3} step={1} value={[1, 2, 4, 8].indexOf(tmax)}
            onChange={(e) => setTmax([1, 2, 4, 8][Number(e.target.value)])} />
          <b>{tmax}</b>
        </label>
        <button className={prompter === 'Base' ? 'chip chip-on' : 'chip'} onClick={() => setPrompter('Base')}>零样本 Base</button>
        <button className={prompter === 'Trained' ? 'chip chip-on' : 'chip'} onClick={() => setPrompter('Trained')}>训练后</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
