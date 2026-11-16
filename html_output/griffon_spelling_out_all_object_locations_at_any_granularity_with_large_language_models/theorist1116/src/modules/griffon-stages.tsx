import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Stage = 'I' | 'II';

export function GriffonStages(_props: WidgetProps) {
  const [stage, setStage] = useState<Stage>('I');
  const s1 = stage === 'I';
  const modules = [
    { name: 'Visual Encoder', trainI: true, trainII: false },
    { name: 'Projection', trainI: true, trainII: true },
    { name: 'LLM', trainI: true, trainII: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#dfe8d6', borderRadius: 16, border: '1px solid #76906a', padding: 24 }}>
        <div style={{ fontSize: 28, color: '#68778f', marginBottom: 12 }}>暗房两步 · {s1 ? '基础连拍预训练' : '意图精修微调'}</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'stretch', height: '70%' }}>
          {modules.map((m) => {
            const on = s1 ? m.trainI : m.trainII;
            return (
              <div key={m.name} style={{
                flex: 1, borderRadius: 14, padding: 16, textAlign: 'center',
                background: '#fff', border: `3px solid ${on ? '#f07e47' : '#d7deea'}`,
              }}>
                <div style={{
                  width: 54, height: 54, margin: '0 auto', borderRadius: on ? 12 : 999,
                  background: on ? '#f07e47' : '#b8c9a7', border: `2px solid ${on ? '#92400e' : '#76906a'}`,
                }} />
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{m.name}</div>
                <div style={{ fontSize: 26, color: on ? '#f07e47' : '#68778f', marginTop: 8 }}>{on ? '可训练' : '冻结'}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="button" onClick={() => setStage('I')} style={btn(s1)}>Stage I · ~6M</button>
          <button type="button" onClick={() => setStage('II')} style={btn(!s1)}>Stage II · ~900K</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{s1 ? 'Stage I：基础场景预训练' : 'Stage II：全场景指令微调'}</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          {s1
            ? '从 LLaVA 初始化后，用全部约 6M 预训练数据强化多目标感知与基础定位；训练整个网络以保留细粒度视觉细节。'
            : '模型已能按自由文本定位，但还需理解具体场景与用户意图；因此继续微调 LLM 与投影层，覆盖四种场景的约 900K 指令。'}
        </p>
        <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#eef2f8', color: '#27446e', lineHeight: 1.4 }}>
          渐进策略：先打好多目标基础，再对齐全场景指令——对应暗房里「先曝光、再精修」。
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
