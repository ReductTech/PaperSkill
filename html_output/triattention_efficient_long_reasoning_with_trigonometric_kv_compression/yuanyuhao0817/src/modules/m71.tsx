import React from 'react';
import type { WidgetProps } from './registry';

// 7.4：统计量从哪来 —— 离线校准：跑一小段普通文本统计 Q/K 分布，无需训练。
export const M71: React.FC<WidgetProps> = () => {
  const box = (bg: string, border: string, color: string, children: React.ReactNode, flex = '1') => (
    <div style={{ flex, minWidth: 140, padding: '10px 12px', borderRadius: 10, border: '1px solid ' + border, background: bg, fontSize: 13, color, lineHeight: 1.5 }}>{children}</div>
  );
  const arrow = <span style={{ fontSize: 16, color: '#8a93a6' }}>→</span>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, flexWrap: 'wrap' }}>
        {box('#fdf6ec', '#ecd9b8', '#7c4a03', <><b>输入</b>：一段普通文本（数学、代码、对话均可）</>, '1.4')}
        {arrow}
        {box('#eef3fb', '#c9d6ea', '#21324a', <><b>离线校准</b>：前向统计 Q/K 的分布</>, '1.2')}
        {arrow}
        {box('#eefaf1', '#cfe3d2', '#1e6b3c', <><b>统计量</b>：Q 中心 · 期望范数 · 浓度 R</>, '1.4')}
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          ['Q 中心 E[q]', '一个稳定的方向'],
          ['期望范数 E[‖q‖]', '平均长度'],
          ['浓度 R', '聚集程度'],
        ].map(([t, d]) => (
          <div key={t} style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 10, border: '1px solid #d7deea', background: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#21324a' }}>{t}</div>
            <div style={{ fontSize: 12, color: '#68778f', marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>

      <div className="feedback good">
        全程无需训练、不更新模型权重——跑一小段普通文本统计出分布即可，之后推理时直接照这套统计量给键打分。
      </div>
    </div>
  );
};

export default M71;