import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Hotspot = 'h-obs' | 'h-enc' | 'h-llm' | 'h-out' | 'h-tasks';

const HOTSPOTS: Record<
  Hotspot,
  { label: string; role: string; loc: string; bbox: [number, number, number, number] }
> = {
  'h-obs': {
    label: '输入观测',
    role: '图像、状态或 3D 场景表示在这里进入编码器（emb / img 占位符）。',
    loc: 'p4, Sec 3',
    bbox: [26, 8, 22, 26],
  },
  'h-enc': {
    label: '编码器 / ViT',
    role: '把连续观测编码成与语言嵌入同维的特征 token，再交错进序列。',
    loc: 'p5, Sec 4',
    bbox: [38, 8, 22, 26],
  },
  'h-llm': {
    label: 'PaLM 大语言模型',
    role: '预训练 PaLM 是核心，以 decoder-only 方式自回归生成文本或子步骤。',
    loc: 'p4, Sec 3',
    bbox: [30, 34, 40, 18],
  },
  'h-out': {
    label: '高层控制输出',
    role: '输出高层子步骤或文本答案；闭环执行交给既有低层策略，不直接驱动电机。',
    loc: 'p6, Sec 6',
    bbox: [36, 62, 20, 16],
  },
  'h-tasks': {
    label: '环绕任务场景',
    role: '同一模型服务移动操作、任务运动规划、桌面操作、视觉问答 / 描述和纯语言任务。',
    loc: 'Fig 1',
    bbox: [78, 4, 20, 92],
  },
};

const ORDER: Hotspot[] = ['h-obs', 'h-enc', 'h-llm', 'h-out', 'h-tasks'];

/**
 * §2 P5 原图走读：论文 Figure 1 完整呈现，透明热点按钮按百分比覆盖；
 * 点击后右侧固定面板交叉切换中文角色、论文组件与定位。
 */
export const ArchOverview: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [active, setActive] = useState<Hotspot | null>(null);
  const current = active ? HOTSPOTS[active] : null;

  return (
    <div>
      <div className="encoder-hotspot" id={`${chapterId}-${moduleId}`} role="group" aria-label="架构原图热点">
        <img src="./images/paper/fig-1.png" alt="PaLM-E 整体架构原图 Figure 1" />
        {ORDER.map((key) => {
          const h = HOTSPOTS[key];
          const [x, y, w, ht] = h.bbox;
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              aria-label={h.label}
              aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : key)}
              className={`encoder-hotspot-btn ${isActive ? 'active' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${ht}%` }}
            />
          );
        })}
      </div>
      <div className="chip-row" role="group" aria-label="架构部件键盘等价选择">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${active === key ? 'selected' : ''}`}
            aria-pressed={active === key}
            onClick={() => setActive(active === key ? null : key)}
          >
            {HOTSPOTS[key].label}
          </button>
        ))}
      </div>
      {current ? (
        <div className="feedback">
          <strong>{current.label}</strong>（{current.loc}）：{current.role}
        </div>
      ) : (
        <div className="feedback">点击图中部件，查看它在通路中的角色。</div>
      )}
    </div>
  );
};

export default ArchOverview;
