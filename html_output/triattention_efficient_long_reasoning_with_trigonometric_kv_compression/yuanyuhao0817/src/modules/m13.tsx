import React from 'react';
import type { WidgetProps } from './registry';

// KV 缓存的商业价值：同一段输入，命中 KV 缓存比未命中便宜约 40–50 倍（DeepSeek API 定价）。
export const M13: React.FC<WidgetProps> = () => {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 10, border: '1px solid #cfe3d2', background: '#f2faf3' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e6b3c', marginBottom: 6 }}>缓存命中</div>
          <div style={{ fontSize: 13, color: '#21324a' }}>直接复用已算好的 K/V</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#228d5c', marginTop: 4 }}>0.02–0.025 元 / 百万 token</div>
        </div>
        <div style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 10, border: '1px solid #f0c9c9', background: '#fdf3f3' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>缓存未命中</div>
          <div style={{ fontSize: 13, color: '#21324a' }}>从头计算并存储 K/V</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#c43f52', marginTop: 4 }}>1–3 元 / 百万 token</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#68778f' }}>
        命中比未命中便宜约 40–50 倍。说明：这是服务端的前缀缓存，与论文里的 KV 缓存是同一套机制，只是复用范围不同；KV 缓存的管理直接影响成本和速度。
      </div>
    </div>
  );
};

export default M13;