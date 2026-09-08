import React from 'react';
import type { WidgetProps } from './registry';

// Ch6 Module 1 —— 因果消融：哪个组件带来增益（静态表格，论文 Table 1）
const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: 13,
  borderBottom: '2px solid #d7e0ea',
  color: '#21324a',
  background: '#eef2f7',
};
const td: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 13,
  borderBottom: '1px solid #e4eaf2',
  color: '#333',
};

const ROWS = [
  { recipe: 'DINO+iBOT（基线）', knn: '81.6', delta: '81.4', rmse: '0.474', good: false, note: '随机掩码 + 纯语义：深度精度垫底。' },
  { recipe: '+ 边界几何目标', knn: '81.8', delta: '84.4', rmse: '0.446', good: true, note: '只加分类化几何目标：δ₁ 直接 +3.0，语义几乎不降——主要贡献来源。' },
  { recipe: '+ 双重监督', knn: '82.0', delta: '84.7', rmse: '0.443', good: true, note: '边界 token 语义+几何双监督：再 +0.3，语义也 +0.2。' },
  { recipe: '+ RoPE（完整方案）', knn: '82.4', delta: '84.9', rmse: '0.440', good: true, note: '完整配方：k-NN 82.4、δ₁ 84.9、RMSE 0.440，双赢。' },
  { recipe: '边界掩码 + 仅语义', knn: '81.4', delta: '81.2', rmse: '0.481', good: false, note: '把边界塞进掩码却只用语义重建：不升反降（81.2）——掩码换方向没用。' },
];

export const M61Abl: React.FC<WidgetProps> = () => {
  return (
    <div className="m61-abl" style={{ fontSize: 13 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>配方（逐步加料）</th>
            <th style={th}>k-NN</th>
            <th style={th}>δ₁</th>
            <th style={th}>RMSE</th>
            <th style={th}>结论</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.recipe}>
              <td style={{ ...td, fontWeight: 600, color: r.good ? '#228d5c' : '#c43f52' }}>{r.recipe}</td>
              <td style={td}>{r.knn}</td>
              <td style={td}>{r.delta}</td>
              <td style={td}>{r.rmse}</td>
              <td style={td}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 8, color: '#556', lineHeight: 1.7 }}>
        关键结论：<b>分类化边界几何目标是最活跃的成分</b>——掩码只决定「在哪学」，
        真正的增益来自「在那里重建什么」。
      </p>
    </div>
  );
};
