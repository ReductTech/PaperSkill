import React from 'react';
import type { WidgetProps } from './registry';

// 4.1：传统方法过程演示视频 —— 旋转后空间打分 → 窗口极小 → 误删关键 Key → 断链
export const M34: React.FC<WidgetProps> = () => (
  <div>
    <video
      src="/images/video1.mp4"
      controls
      autoPlay
      loop
      playsInline
      muted
      preload="auto"
      style={{ width: '100%', maxWidth: 720, borderRadius: 10, border: '1px solid #d7deea', display: 'block', margin: '0 auto', background: '#fff' }}
    />
    <div style={{ marginTop: 8, fontSize: 13, color: '#68778f', textAlign: 'center' }}>
      视频演示：传统方法在旋转后空间给 Key 打分 → 观察窗口极小 → 远处的关键 Key 被误删 → 未来查询扑空、推理断链。
    </div>
  </div>
);

export default M34;