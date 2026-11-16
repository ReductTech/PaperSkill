import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Scene = '1v1' | '1vn' | 'none' | 'nvn';

const ROWS: { id: Scene; title: string; qwen: string; gdino: string; griffon: string }[] = [
  { id: '1v1', title: '单指称', qwen: '能框一个', gdino: '专家检测强', griffon: '也能框，且统一格式' },
  { id: '1vn', title: '一类多目标', qwen: '常只出一个', gdino: '可多框', griffon: '一次拼出多个' },
  { id: 'none', title: '不存在', qwen: '易幻觉硬框', gdino: '依赖设定', griffon: '可输出 None' },
  { id: 'nvn', title: '多类多目标', qwen: '需反复询问', gdino: '专家流水线', griffon: '一次前向多类' },
];

export function GriffonQual(_props: WidgetProps) {
  const [id, setId] = useState<Scene>('1vn');
  const row = ROWS.find((r) => r.id === id) || ROWS[1];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#dfe8d6', borderRadius: 16, border: '1px solid #76906a', padding: 24 }}>
        <div style={{ fontSize: 28, color: '#68778f', marginBottom: 12 }}>样片墙 · Fig.4 定性对照（示意）</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {ROWS.map((r) => (
            <button key={r.id} type="button" onClick={() => setId(r.id)} style={chip(r.id === id)}>{r.title}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Card title="Qwen-VL" body={row.qwen} tone="#68778f" />
          <Card title="Grounding DINO" body={row.gdino} tone="#27446e" />
          <Card title="Griffon" body={row.griffon} tone="#228d5c" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>四场景一眼对照</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          对应论文 §4.6 / Fig.4 的定性分析：专家模型强在检测流水线，通用 LVLM 卡在单目标；Griffon 用同一套对话式坐标覆盖四场景。
        </p>
        <div style={{ fontSize: 26, padding: 14, borderRadius: 12, background: '#fff4ee', color: '#92400e', lineHeight: 1.4 }}>
          本页是机制示意，不是新的 AP 表，也不复现 Fig.4 原图像素。
        </div>
      </div>
    </div>
  );
}

function Card({ title, body, tone }: { title: string; body: string; tone: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${tone}`, padding: 14, minHeight: 160 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: tone }}>{title}</div>
      <div style={{ fontSize: 26, marginTop: 12, lineHeight: 1.35 }}>{body}</div>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    fontSize: 26, padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
    border: `2px solid ${active ? '#27446e' : '#d7deea'}`,
    background: active ? '#27446e' : '#fff', color: active ? '#fff' : '#21324a',
  };
}
