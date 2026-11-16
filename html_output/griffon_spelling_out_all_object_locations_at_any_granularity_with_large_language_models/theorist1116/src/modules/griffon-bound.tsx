import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export function GriffonBound(_props: WidgetProps) {
  const [labelFirst, setLabelFirst] = useState(false);
  const [scoring, setScoring] = useState(false);

  const orderMap = labelFirst ? 22.2 : 17.8;
  const scoreShown = scoring ? 23.2 : 20.9;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#dfe8d6', borderRadius: 16, border: '1px solid #76906a', padding: 24 }}>
        <div style={{ fontSize: 28, color: '#68778f' }}>后期修片台 · 两台独立旋钮</div>
        <p style={{ fontSize: 24, color: '#68778f', margin: '8px 0 16px' }}>
          Table 4 与 Table 5 是两次独立消融，不合并成一个指标。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ fontSize: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="checkbox" checked={labelFirst} onChange={(e) => setLabelFirst(e.target.checked)} />
            修片旋钮 A · Label-first（表 4）
          </label>
          <Meter label="表 4 · 表示顺序 mAP" value={orderMap} max={26} accent={labelFirst ? '#228d5c' : '#c43f52'} note={labelFirst ? 'Label-first 22.2' : 'Coord-first 17.8'} />
          <label style={{ fontSize: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="checkbox" checked={scoring} onChange={(e) => setScoring(e.target.checked)} />
            修片旋钮 B · 置信打分（表 5）
          </label>
          <Meter label="表 5 · 打分机制 mAP" value={scoreShown} max={26} accent={scoring ? '#228d5c' : '#c43f52'} note={scoring ? 'loc+label 23.2' : '无打分 20.9'} />
        </div>
        <div style={{ marginTop: 16, fontSize: 24, color: labelFirst && scoring ? '#228d5c' : '#92400e' }}>
          {labelFirst && scoring ? '两台旋钮都打开：各自对照论文表内数字' : '分别拧开，对照对应表格——不要把两表平均'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>能修什么，不能夸大什么</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          Label-first 提升召回；训练无关打分让高质量框优先匹配。两者都是论文消融支持的设计选择。
        </p>
        <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#fff4ee', color: '#92400e', lineHeight: 1.4, border: '1px solid #f07e47' }}>
          局限：作者说明工作主要聚焦定位，尚未广泛整合其他视觉任务；扩展多任务是未来方向。
        </div>
        <div style={{ fontSize: 26, color: '#68778f' }}>摄影类比：两台修片旋钮各管一道工序，不能拧成「总评分」。</div>
      </div>
    </div>
  );
}

function Meter({ label, value, max, accent, note }: { label: string; value: number; max: number; accent: string; note: string }) {
  return (
    <div>
      <div style={{ fontSize: 24, color: '#68778f', marginBottom: 6 }}>{label}</div>
      <div style={{ height: 28, borderRadius: 8, background: '#d7deea', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: accent }} />
      </div>
      <div style={{ fontSize: 26, marginTop: 6, color: accent }}>{note}</div>
    </div>
  );
}
