import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// P10 时间轴回放：0→75M 步，Depth 何时追上 SLAM。关键里程碑来自 §5（示意）。
const FRAMES = [
  { step: '0M', note: '训练开始：所有 RL 起点都很低。' },
  { step: '5M', note: '前人在此终止 → 会误判“SLAM 主导”（[19,16]）。' },
  { step: '10M', note: 'Depth 在 Gibson 约 10M 步追上 SLAM。' },
  { step: '30M', note: 'Depth 在 MP3D 约 30M 步追上 SLAM。' },
  { step: '75M', note: '15× 前人经验：Depth 全面超越 SLAM（§5）。' },
];

export const P10Timeline: React.FC<WidgetProps> = () => {
  const [i, setI] = useState(0);
  const f = FRAMES[i];
  return (
    <div className="mod-timeline">
      <input
        type="range"
        min={0}
        max={FRAMES.length - 1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
      />
      <div className="tl-marks">
        {FRAMES.map((x, j) => (
          <button key={x.step} className={`tl-mark ${j === i ? 'active' : j < i ? 'done' : ''}`} onClick={() => setI(j)}>
            {x.step}
          </button>
        ))}
      </div>
      <div className="tl-frame">
        <strong>{f.step}</strong> —— {f.note}
      </div>
      <div className="feedback good">
        拖动进度条回放训练过程：只有把经验放大一个数量级（75M 步），才看得到“学习超越 SLAM”（§5）。
      </div>
    </div>
  );
};

export default P10Timeline;
