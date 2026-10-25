import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// P2 train/test 切换：选择训练与测试数据集，看各传感器在测试集上的 SPL（Figure 5）。
const TESTV: Record<string, Record<SensorKey, number>> = {
  Gibson: { Blind: 0.42, RGB: 0.46, Depth: 0.79, RGBD: 0.70 },
  MP3D: { Blind: 0.34, RGB: 0.40, Depth: 0.68, RGBD: 0.53 },
};
const COLORS: Record<string, string> = { Blind: '#7c3aed', RGB: '#ea580c', Depth: '#16a34a', RGBD: '#dc2626' };
const SENSORS = ['Blind', 'RGB', 'Depth', 'RGBD'] as const;
type SensorKey = (typeof SENSORS)[number];

export const P2GeneralizeToggle: React.FC<WidgetProps> = () => {
  const [tr, setTr] = useState<'Gibson' | 'MP3D'>('Gibson');
  const [te, setTe] = useState<'Gibson' | 'MP3D'>('Gibson');
  const vals = TESTV[te];
  return (
    <div className="mod-toggle">
      <div className="toggle-switch">
        <span className="tgl-lbl">训练集</span>
        <button className={`tgl ${tr === 'Gibson' ? 'active' : ''}`} onClick={() => setTr('Gibson')}>Gibson</button>
        <button className={`tgl ${tr === 'MP3D' ? 'active' : ''}`} onClick={() => setTr('MP3D')}>MP3D</button>
      </div>
      <div className="toggle-switch">
        <span className="tgl-lbl">测试集</span>
        <button className={`tgl ${te === 'Gibson' ? 'active' : ''}`} onClick={() => setTe('Gibson')}>Gibson</button>
        <button className={`tgl ${te === 'MP3D' ? 'active' : ''}`} onClick={() => setTe('MP3D')}>MP3D</button>
      </div>
      <div className="gen-bars">
        {SENSORS.map((k) => {
          const v = vals[k];
          return (
            <div key={k} className="gen-bar">
              <span className="gen-bar-label">{k}</span>
              <div className="gen-bar-track">
                <div className="gen-bar-fill" style={{ width: `${v * 100}%`, background: COLORS[k] }} />
              </div>
              <span className="gen-bar-val">{v.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      <div className="feedback good">
        {tr === te
          ? `同数据集训练并测试（${tr}→${tr}）：对角线结果，与 Table 2 一致（§5）。`
          : `跨数据集（训练 ${tr} → 测试 ${te}）：Depth 掉得最少，RGB/RGBD 显著退化（Figure 5, §5）。`}
      </div>
    </div>
  );
};

export default P2GeneralizeToggle;
