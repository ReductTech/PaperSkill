import React from 'react';
import type { WidgetProps } from './registry';

// Ch4 Module 1 —— 系统三件套：静态信息表格（纯文字呈现，不做 canvas 动画）
// 明确列出 Student / Teacher / Corner Detector 三者的结构与职责。
const ROWS = [
  {
    name: 'Student（θ）',
    structure: '主 ViT（backbone + 各 head）',
    train: '✅ 反向传播更新',
    role: '真正被梯度更新的那个，学语义 + 几何',
  },
  {
    name: 'Teacher（θ̄）',
    structure: 'Student 的 EMA 副本（同结构）',
    train: '❌ 无梯度，只被 EMA 更新',
    role: '在线预测边界场，负责出题（提供目标）',
  },
  {
    name: 'Frozen Corner Detector',
    structure: '单 block 小 ViT',
    train: '❌ 完全冻结',
    role: '只找稀疏角点 C₁…Cₘ，给解码做锚点',
  },
];

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

export const M44Text: React.FC<WidgetProps> = () => {
  return (
    <div className="m44-sys-table">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>组件</th>
            <th style={th}>结构</th>
            <th style={th}>参与训练</th>
            <th style={th}>职责</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name}>
              <td style={td}>
                <b>{r.name}</b>
              </td>
              <td style={td}>{r.structure}</td>
              <td style={td}>{r.train}</td>
              <td style={td}>{r.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m44-note" style={{ marginTop: 8, fontSize: 12.5, color: '#556', lineHeight: 1.6 }}>
        关键点：<b>角点检测器是整条边界自举链路上唯一固定不动的小组件</b>——它不预测边界，
        只给后面的线段解码提供角点锚点；真正被梯度更新的始终只有 Student。
      </p>
    </div>
  );
};
