import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const datasets = [
  {
    key: 'VQAv2',
    title: 'VQAv2 (test-dev)',
    blip2: 65.0,
    flamingo: 56.3,
    unit: '%',
  },
  {
    key: 'OK-VQA',
    title: 'OK-VQA (test)',
    blip2: 45.9,
    flamingo: 32.2,
    unit: '%',
  },
  {
    key: 'GQA',
    title: 'GQA (test-dev)',
    blip2: 44.7,
    flamingo: 39.3,
    unit: '%',
  },
];

/**
 * Ch7Vqa — 零样本 VQA 性能对比
 * 切换数据集标签，查看 BLIP-2 与 Flamingo 的性能对比。
 */
export const Ch7Vqa: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const data = datasets[active];

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
        零样本 VQA 性能对比
      </h3>

      <div style={{ display: 'flex', gap: '4px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
        {datasets.map((d, i) => (
          <button
            key={d.key}
            onClick={() => setActive(i)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              background: active === i ? '#2563eb' : '#f8fafc',
              color: active === i ? '#fff' : '#475569',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {d.key}
          </button>
        ))}
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        width: '100%',
      }}>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>{data.title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>BLIP-2 (188M)</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>{data.blip2}{data.unit}</span>
            </div>
            <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${data.blip2}%`,
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                borderRadius: '10px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>Flamingo80B (80B)</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>{data.flamingo}{data.unit}</span>
            </div>
            <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${data.flamingo}%`,
                background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                borderRadius: '10px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #86efac',
          fontSize: '13px',
          color: '#16a34a',
        }}>
          ✓ BLIP-2 仅用 1/425 的参数量，零样本性能提升 {(data.blip2 - data.flamingo).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
