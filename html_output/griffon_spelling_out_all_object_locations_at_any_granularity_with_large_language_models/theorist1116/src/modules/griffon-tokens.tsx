import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export function GriffonTokens(_props: WidgetProps) {
  const [mode, setMode] = useState<'numeric' | 'special'>('numeric');
  const numeric = mode === 'numeric';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: numeric ? '#e7f6ee' : '#f5f8f0', borderRadius: 16, border: `2px solid ${numeric ? '#228d5c' : '#d7deea'}`, padding: 24 }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: '#228d5c' }}>数值字符（论文采用）</div>
        <p style={{ fontSize: 28, lineHeight: 1.45 }}>直接写 0.123 这类自然语言数字；精度取 0.001，兼顾小目标误差与序列长度。</p>
        <div style={{ fontSize: 28, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #d7deea' }}>
          person-[0.468, 0.409, 0.515, 0.647]
        </div>
        <ul style={{ fontSize: 28, lineHeight: 1.45, color: '#68778f' }}>
          <li>复用原词表嵌入</li>
          <li>Shikra 比较中数值法在 REC 更好</li>
        </ul>
      </div>
      <div style={{ background: !numeric ? '#fde8eb' : '#f5f8f0', borderRadius: 16, border: `2px solid ${!numeric ? '#c43f52' : '#d7deea'}`, padding: 24 }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: '#c43f52' }}>特殊坐标 token</div>
        <p style={{ fontSize: 28, lineHeight: 1.45 }}>为坐标轴新建专用 token（像专用印章）；词表外嵌入需从零训练，收敛更慢。</p>
        <div style={{ fontSize: 28, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #d7deea' }}>
          &lt;loc_468&gt;&lt;loc_409&gt;…
        </div>
        <ul style={{ fontSize: 28, lineHeight: 1.45, color: '#68778f' }}>
          <li>破坏与通用 LVLM 的一致性</li>
          <li>额外先验与训练成本</li>
        </ul>
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={() => setMode('numeric')} style={btn(numeric)}>选择数值字符</button>
        <button type="button" onClick={() => setMode('special')} style={btn(!numeric)}>查看特殊 token</button>
        <div style={{ fontSize: 28, color: numeric ? '#228d5c' : '#c43f52' }}>
          {numeric ? 'Griffon：数值归一化坐标，无特殊 token。' : '对比项：专用印章式坐标表示（论文未采用）。'}
        </div>
      </div>
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    fontSize: 28, padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
    border: `2px solid ${active ? '#27446e' : '#d7deea'}`,
    background: active ? '#27446e' : '#fff', color: active ? '#fff' : '#21324a',
  };
}
