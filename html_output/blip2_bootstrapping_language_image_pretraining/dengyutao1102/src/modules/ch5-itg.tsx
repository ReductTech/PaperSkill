import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const tokens = ['[ENC]', 'a', 'photo', 'of', 'a', 'dog', 'running', 'in', 'the', 'park', '[DEC]'];

/**
 * Ch5Itg — ITG 自回归生成滑块
 * 拖动滑块查看逐步生成 token 的过程。
 */
export const Ch5Itg: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(3);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
      padding: '20px',
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
        ITG 自回归生成过程
      </h3>

      <div style={{ width: '100%', padding: '0 10px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
          生成步数：<strong style={{ color: '#ea580c' }}>{step} tokens</strong>
        </label>
        <input
          type="range"
          min={0}
          max={tokens.length - 1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#ea580c' }}
        />
      </div>

      <div style={{
        background: '#fff7ed',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #fb923c',
        width: '100%',
      }}>
        <div style={{ fontSize: '12px', color: '#9a3412', marginBottom: '10px' }}>已生成序列：</div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
        }}>
          {tokens.slice(0, step + 1).map((t, i) => (
            <span
              key={i}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: t.startsWith('[') ? '#e2e8f0' : '#fff',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: t.startsWith('[') ? '#64748b' : '#0f172a',
              }}
            >
              {t}
            </span>
          ))}
          <span style={{
            width: '2px',
            height: '20px',
            background: '#ea580c',
            animation: 'blink 1s infinite',
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        width: '100%',
      }}>
        <div style={{
          background: '#f0fdf4',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid #86efac',
        }}>
          <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>视觉引导</div>
          <div style={{ fontSize: '13px', color: '#0f172a' }}>每个 token 都关注图像特征</div>
        </div>
        <div style={{
          background: '#eff6ff',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid #93c5fd',
        }}>
          <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>自回归</div>
          <div style={{ fontSize: '13px', color: '#0f172a' }}>每个 token 依赖前面所有 token</div>
        </div>
      </div>
    </div>
  );
};
