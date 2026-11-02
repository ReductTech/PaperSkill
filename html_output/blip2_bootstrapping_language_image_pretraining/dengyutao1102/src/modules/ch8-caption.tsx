import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const tasks = [
  {
    key: 'NoCaps',
    title: 'NoCaps 图像描述 (SPICE)',
    blip2: 18.4,
    prev: 15.0,
    unit: '',
    better: 'higher',
  },
  {
    key: 'COCO',
    title: 'COCO 检索 (TR@1, Text→Image)',
    blip2: 58.4,
    prev: 45.5,
    unit: '%',
    better: 'higher',
  },
  {
    key: 'Flickr30K',
    title: 'Flickr30K 检索 (TR@1, Text→Image)',
    blip2: 89.7,
    prev: 76.7,
    unit: '%',
    better: 'higher',
  },
];

/**
 * Ch8Caption — 描述与检索性能对比
 * 切换任务标签，查看 BLIP-2 在不同任务上的性能。
 */
export const Ch8Caption: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const data = tasks[active];
  const gain = ((data.blip2 - data.prev) / data.prev * 100).toFixed(1);

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
        图像描述与检索性能
      </h3>

      <div style={{ display: 'flex', gap: '4px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
        {tasks.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActive(i)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              background: active === i ? '#ea580c' : '#f8fafc',
              color: active === i ? '#fff' : '#475569',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {t.key}
          </button>
        ))}
      </div>

      <div style={{
        background: '#fff7ed',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #fb923c',
        width: '100%',
      }}>
        <div style={{ fontSize: '14px', color: '#9a3412', marginBottom: '16px' }}>{data.title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600 }}>BLIP-2</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#ea580c' }}>{data.blip2}{data.unit}</span>
            </div>
            <div style={{ height: '20px', background: '#ffedd5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${data.blip2}%`,
                background: 'linear-gradient(90deg, #fb923c, #ea580c)',
                borderRadius: '10px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>此前 SOTA</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{data.prev}{data.unit}</span>
            </div>
            <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${data.prev}%`,
                background: '#94a3b8',
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
          ✓ 性能提升 <strong>{gain}%</strong>
        </div>
      </div>
    </div>
  );
};
