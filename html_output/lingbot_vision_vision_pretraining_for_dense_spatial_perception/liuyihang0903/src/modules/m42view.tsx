import React from 'react';
import type { WidgetProps } from './registry';

// Ch4 Module 2 —— 一张图的旅程：multi-view 增强（静态 HTML 示意图，不做 canvas）
// 一张 RGB 图被增强出多个视角：大的是 global view（造边界），小的是 local view（只做语义）。
const boxBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontWeight: 600,
  color: '#fff',
  borderRadius: 8,
  padding: 10,
};

export const M42View: React.FC<WidgetProps> = () => {
  return (
    <div className="m42-multiview" style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* 原始图 */}
        <div
          style={{
            ...boxBase,
            width: 130,
            height: 110,
            background: '#8aa27c',
            fontSize: 13,
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 14 }}>RGB 原图</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#f0f3ec' }}>crop / color jitter / flip</span>
        </div>

        <div style={{ color: '#9fb0c8', fontSize: 18 }}>→</div>

        {/* global view */}
        <div
          style={{
            ...boxBase,
            width: 170,
            height: 110,
            background: '#27446e',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 14 }}>global view</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#d7e0ea' }}>分辨率高、视野大</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#d7e0ea' }}>✅ 在这里造边界</span>
        </div>

        {/* local views */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...boxBase, width: 110, height: 50, background: '#d97706', fontSize: 12 }}>local view</div>
          <div style={{ ...boxBase, width: 110, height: 50, background: '#d97706', fontSize: 12 }}>local view</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          background: '#eef2f7',
          borderRadius: 8,
          padding: '10px 12px',
          lineHeight: 1.7,
          color: '#333',
        }}
      >
        <b>关键约定：</b>只有 global view 的分辨率与视野足够大，才能可靠解码线段、匹配角点、做
        a-contrario 验证；local view 只参与普通的图像级语义蒸馏，不参与边界自举。
      </div>
    </div>
  );
};
