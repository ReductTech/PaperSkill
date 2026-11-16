import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const PARTS = {
  vision: {
    title: 'Visual Encoder',
    body: 'CLIP ViT-L/14 编码图像 Xv → 视觉特征；输入分辨率提升到 448。',
  },
  proj: {
    title: 'Projection Layer',
    body: '轻量全连接层把视觉特征投到词嵌入空间 Hv，与指令嵌入拼接。',
  },
  llm: {
    title: 'LLM',
    body: 'LLaMA2-13B 自回归生成统一文本输出；一次前向可拼出多目标。',
  },
} as const;

type Part = keyof typeof PARTS;

export function GriffonArch(_props: WidgetProps) {
  const [part, setPart] = useState<Part>('vision');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#f5f8f0', borderRadius: 16, border: '1px solid #d7deea', padding: 20, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16 }}>
        <div style={{ fontSize: 28, color: '#68778f' }}>相机旁的「自给自足」徽章：不外请专家头</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          {(Object.keys(PARTS) as Part[]).map((key, idx) => (
            <React.Fragment key={key}>
              <button type="button" onClick={() => setPart(key)} style={{
                width: 210, height: 160, borderRadius: 16, cursor: 'pointer', fontSize: 28, fontWeight: 700,
                border: `3px solid ${part === key ? '#27446e' : '#d7deea'}`,
                background: part === key ? '#eef2f8' : '#fff', color: '#21324a',
              }}>{PARTS[key].title}</button>
              {idx < 2 && <div style={{ fontSize: 34, color: '#76906a' }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={tag('#c43f52')}>✗ 无 detection head</span>
          <span style={tag('#c43f52')}>✗ 无 expert API</span>
          <span style={tag('#c43f52')}>✗ 无 special token</span>
          <span style={tag('#228d5c')}>✓ 对话式统一 I/O</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{PARTS[part].title}</div>
        <p style={{ fontSize: 28, margin: 0, lineHeight: 1.45, color: '#68778f' }}>{PARTS[part].body}</p>
        <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#e7f6ee', color: '#228d5c', lineHeight: 1.4 }}>
          Griffon 保持与流行 LVLM 一致的结构，把能力放进数据与表示，而不是外挂检测模块。
        </div>
        <img src="./images/fig2_pipeline.png" alt="Fig.2 training pipeline" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8, border: '1px solid #d7deea' }} />
      </div>
    </div>
  );
}

function tag(color: string): React.CSSProperties {
  return {
    fontSize: 26, padding: '8px 12px', borderRadius: 999, border: `1px solid ${color}`, color, background: '#fff',
  };
}
