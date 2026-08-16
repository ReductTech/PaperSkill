import React from 'react';
import type { WidgetProps } from './registry';

// Ch4 Module 3 —— ① Predict：边界场表示 + 分类化（静态展开讲解）
// 不用 canvas 动画，用清晰的表格 + 步骤把"边界场表示"和"为什么分类化"讲透。
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
  verticalAlign: 'top',
};

const FIELD_ROWS = [
  { sym: 'd', name: '距离', desc: '位置 p 到最近线段的距离（决定"离边界多远"）' },
  { sym: 'θ', name: '朝向', desc: '该线段的方向（决定"边界朝哪个方向延伸"）' },
  { sym: 'φ₁ / φ₂', name: '端点角', desc: '从 p 看线段两个端点的定位角（决定"线段两端在哪"）' },
];

const WHY_STEPS = [
  {
    t: '① 为什么不直接回归？',
    d: '直接预测连续数值（如 d = 3.2）在 EMA 自蒸馏里目标会漂移、最终塌缩，且无法套用 DINO 成熟的防塌缩机制。',
  },
  {
    t: '② 于是分类化（K=32 bins）',
    d: '把每个连续量离散成 K 个格子的概率分布 P ∈ ℝ³²。学生学的是"选哪个格子"，比"猜一个连续数"稳定得多。',
  },
  {
    t: '③ 还原成连续场 a_pred(p)',
    d: '对 bin 中心求期望还原距离 d（θ 是周期量，用 circular mean 环形均值）→ 得到 a_pred(p) = (d, θ, φ₁, φ₂)。',
  },
  {
    t: '⚠ 关键：这是噪声场',
    d: '尤其训练初期 Teacher 很弱，a_pred(p) 里混着错误预测，<b>不能直接当标签</b>——必须进入下一步解码（角点+投票）才能洗出结构。',
  },
];

export const M43Predict: React.FC<WidgetProps> = () => {
  return (
    <div className="m43-predict" style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 12 }}>
        <b style={{ color: '#21324a' }}>① 边界场表示：每个 field position 预测 4 个几何量</b>
        <p style={{ margin: '6px 0', color: '#444', lineHeight: 1.7 }}>
          Teacher 的 Boundary Head（3 层 per-token MLP）把每个 16×16 patch 展开成更密的 field
          positions（output stride s=2），每个位置输出：
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>记号</th>
              <th style={th}>含义</th>
              <th style={th}>描述</th>
            </tr>
          </thead>
          <tbody>
            {FIELD_ROWS.map((r) => (
              <tr key={r.sym}>
                <td style={{ ...td, fontWeight: 700, color: '#27446e' }}>{r.sym}</td>
                <td style={td}>{r.name}</td>
                <td style={td}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '8px 0 0', color: '#556', lineHeight: 1.7 }}>
          关键设计：<b>一个位置理论上足以还原整条线段</b>（刻意冗余）——即使网络预测不精确，
          也能从冗余里解码出结构。
        </p>
      </div>

      <div>
        <b style={{ color: '#21324a' }}>② 分类化：为什么不能直接回归？</b>
        {WHY_STEPS.map((s) => (
          <div
            key={s.t}
            style={{
              marginTop: 8,
              background: s.t.includes('⚠') ? '#fdf3f4' : '#fafcf8',
              border: s.t.includes('⚠') ? '1px solid #e7c6cb' : '1px solid #e4eaf2',
              borderRadius: 8,
              padding: '8px 12px',
              lineHeight: 1.7,
            }}
          >
            <b style={{ color: '#21324a' }}>{s.t}</b>
            <div style={{ color: '#444' }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
