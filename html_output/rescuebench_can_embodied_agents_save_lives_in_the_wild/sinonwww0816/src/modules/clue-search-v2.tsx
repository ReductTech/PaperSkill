import { useState } from 'react';
import type { WidgetProps } from './registry';

type ClueMode = 'none' | 'image' | 'text' | 'both';

const modes: Array<{ id: ClueMode; label: string }> = [
  { id: 'none', label: '无线索' },
  { id: 'image', label: '只看图像线索' },
  { id: 'text', label: '只看文字线索' },
  { id: 'both', label: '图像 + 文字线索' },
];

const likelihood: Record<ClueMode, number[]> = {
  none: [3, 3, 3, 3],
  image: [1, 3, 2, 1],
  text: [2, 3, 1, 1],
  both: [1, 3, 1, 0],
};

const feedback: Record<ClueMode, string> = {
  none: '没有线索时，四个区域都需要保留在搜索范围内。',
  image: '外观线索排除了一部分不匹配区域，但仍需要智能体决定先往哪里探索。',
  text: '文字中的方位与场景描述进一步约束候选区域，仍没有提供逐步路线。',
  both: '两类线索共同缩小了搜索范围；候选区域更少，但路线依然要由智能体自主规划。',
};

const levelLabel = ['排除', '较低', '可能', '重点'];

export function ClueSearchV2(_: WidgetProps) {
  const [mode, setMode] = useState<ClueMode>('both');
  const values = likelihood[mode];

  return (
    <div className="clue-v2">
      <div className="known-unknown-grid">
        <section>
          <span className="chapter2-kicker">智能体知道</span>
          <strong>图像线索 · 文字线索 · 当前第一视角观测</strong>
        </section>
        <section>
          <span className="chapter2-kicker">智能体不知道</span>
          <strong>伤员准确坐标 · 完整路线 · 下一步该往哪走</strong>
        </section>
      </div>

      <div className="chapter2-controls" role="group" aria-label="切换可用线索">
        {modes.map((item) => (
          <button
            type="button"
            key={item.id}
            className={mode === item.id ? 'selected' : ''}
            aria-pressed={mode === item.id}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="clue-map" aria-label="线索约束下的四个候选搜索区域">
        {['A 区', 'B 区', 'C 区', 'D 区'].map((name, index) => (
          <div className={`clue-region level-${values[index]}`} key={name}>
            <span>{name}</span>
            <strong>{levelLabel[values[index]]}</strong>
            <small>{values[index] === 0 ? '不匹配' : '仍需探索确认'}</small>
          </div>
        ))}
        <div className="no-route-badge">未生成导航路线</div>
      </div>

      <div className="chapter2-feedback" aria-live="polite">{feedback[mode]}</div>
    </div>
  );
}
