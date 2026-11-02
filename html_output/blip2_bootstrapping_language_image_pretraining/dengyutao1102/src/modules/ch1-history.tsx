import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const milestones = [
  { year: '2018', name: 'ELMO/BERT', desc: 'NLP 预训练范式成熟，大规模语言模型涌现。' },
  { year: '2020', name: 'CLIP/ALIGN', desc: '大规模图文对比学习，视觉-语言对齐取得突破。' },
  { year: '2021', name: 'Flamingo', desc: '连接冻结视觉编码器与冻结 LLM，少样本 VLP。' },
  { year: '2022', name: 'BLIP', desc: '统一理解与生成的 VLP，端到端训练成本高。' },
  { year: '2023', name: 'BLIP-2', desc: '冻结+引导两阶段策略，参数高效的 SOTA。' },
];

/**
 * Ch1History — VLP 发展历程时间线
 * 点击节点查看各里程碑的说明。
 */
export const Ch1History: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(4);
  const m = milestones[active];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
        视觉-语言预训练发展历程
      </h3>

      <div style={{
        position: 'relative',
        width: '100%',
        padding: '20px 0',
      }}>
        <div style={{
          position: 'absolute',
          top: '36px',
          left: '10%',
          right: '10%',
          height: '3px',
          background: '#e2e8f0',
          borderRadius: '2px',
        }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          position: 'relative',
        }}>
          {milestones.map((milestone, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b' }}>{milestone.year}</div>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: i === active ? '#2563eb' : '#cbd5e1',
                border: '3px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }} />
              <div style={{
                fontSize: '11px',
                fontWeight: i === active ? 700 : 400,
                color: i === active ? '#2563eb' : '#64748b',
              }}>
                {milestone.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#eff6ff',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '2px solid #2563eb',
        width: '100%',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb', marginBottom: '6px' }}>
          {m.year} · {m.name}
        </div>
        <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
          {m.desc}
        </div>
      </div>
    </div>
  );
};
