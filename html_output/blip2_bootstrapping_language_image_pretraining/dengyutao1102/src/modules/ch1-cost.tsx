import React, { useState } from 'react';
import type { WidgetProps } from './registry';

/**
 * Ch1Cost — 参数效率对比滑块
 * 拖动滑块调整可训练参数量，对比端到端方法与 BLIP-2 的差异。
 */
export const Ch1Cost: React.FC<WidgetProps> = () => {
  const [params, setParams] = useState(188);

  const blip2Params = 188;
  const endToEndParams = 10000; // ~10B 级别

  const ratio = endToEndParams / params;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
      padding: '20px',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
        可训练参数量对比
      </h3>

      <div style={{ width: '100%', padding: '0 10px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
          调整可训练参数量：<strong style={{ color: '#2563eb' }}>{params}M</strong>
        </label>
        <input
          type="range"
          min={10}
          max={10000}
          value={params}
          onChange={(e) => setParams(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#ea580c' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        width: '100%',
      }}>
        <div style={{
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '16px',
          border: '2px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>端到端 VLP</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>~10B</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>联合训练图像编码器+LLM</div>
        </div>
        <div style={{
          background: '#eff6ff',
          borderRadius: '12px',
          padding: '16px',
          border: '2px solid #2563eb',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>BLIP-2</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{blip2Params}M</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>仅 Q-Former 可训练</div>
        </div>
      </div>

      <div style={{
        background: params <= 500 ? '#f0fdf4' : '#ffffff',
        borderRadius: '12px',
        padding: '14px 20px',
        border: `2px solid ${params <= 500 ? '#16a34a' : '#cbd5e1'}`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '14px', color: '#0f172a' }}>
          当前参数仅为端到端方法的 <strong style={{ color: params <= 500 ? '#16a34a' : '#64748b' }}>1/{Math.round(ratio)}</strong>
        </div>
        {params <= 500 && (
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
            ✓ 参数极少，训练成本大幅降低
          </div>
        )}
      </div>
    </div>
  );
};
