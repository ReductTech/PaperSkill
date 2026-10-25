import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const SENSORS = [
  { k: 'Blind', icon: '🕶️', desc: '无视觉：只靠 GPS/compass 坐标，看不到房间。' },
  { k: 'RGB', icon: '🎨', desc: '彩色相机：看得清“房子长什么样”，但细节高熵易过拟合。' },
  { k: 'Depth', icon: '📐', desc: '深度：只看“前面多远/有没有墙”，PointGoal 正需要它。' },
  { k: 'RGBD', icon: '🖥️', desc: '彩色+深度：信息全，但冗余未必更好。' },
];

export const P2SensorToggle: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(0);
  const s = SENSORS[sel];
  return (
    <div className="mod-toggle">
      <div className="toggle-switch">
        {SENSORS.map((x, i) => (
          <button key={x.k} className={`tgl ${sel === i ? 'active' : ''}`} onClick={() => setSel(i)}>
            {x.icon} {x.k}
          </button>
        ))}
      </div>
      <div className="sensor-view">
        <div className="sensor-room">
          {/* 同一个房间，不同传感器看到的“画面” */}
          <span className="room-elem">🚪</span>
          <span className="room-elem">🪑</span>
          <span className="room-elem">📦</span>
          {s.k === 'Blind' ? <div className="sensor-blind">（无视觉）</div>
            : s.k === 'Depth' ? <div className="sensor-depth">▦▦▦ 距离场 ▦▦▦</div>
            : s.k === 'RGB' ? <div className="sensor-rgb">🎨 彩色画面</div>
            : <div className="sensor-rgbd">🎨 + ▦ 彩色与距离</div>}
        </div>
        <p className="sensor-desc">{s.desc}</p>
      </div>
      <div className="feedback good">
        {sel === 2 ? 'Depth 直接给出自由空间信息，在 PointGoal 上表现最优（§5）。' : '不同传感器决定“看得多清楚”，也决定泛化性与过拟合风险（§5）。'}
      </div>
    </div>
  );
};

export default P2SensorToggle;
