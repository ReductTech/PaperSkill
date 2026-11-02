import React, { useState } from 'react';
import type { WidgetProps } from './registry';

/**
 * Ch9Ablation — 表示学习消融实验开关
 * 开关对比有表示学习 vs 无表示学习的性能差异。
 */
export const Ch9Ablation: React.FC<WidgetProps> = () => {
  const [withRepLearning, setWithRepLearning] = useState(true);

  const vqaScore = withRepLearning ? 65.0 : 38.5;
  const drop = ((65.0 - vqaScore) / 65.0 * 100).toFixed(1);

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
        表示学习消融实验
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 20px',
        borderRadius: '12px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
      }}>
        <span style={{ fontSize: '14px', color: '#475569' }}>第一阶段表示学习</span>
        <button
          onClick={() => setWithRepLearning(!withRepLearning)}
          style={{
            width: '56px',
            height: '30px',
            borderRadius: '15px',
            border: 'none',
            background: withRepLearning ? '#16a34a' : '#cbd5e1',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: withRepLearning ? '29px' : '3px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.3s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: withRepLearning ? '#16a34a' : '#64748b',
        }}>
          {withRepLearning ? '开启 ✓' : '关闭 ✗'}
        </span>
      </div>

      <div style={{
        background: withRepLearning ? '#f0fdf4' : '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: `2px solid ${withRepLearning ? '#16a34a' : '#cbd5e1'}`,
        width: '100%',
      }}>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>VQAv2 零样本准确率</div>

        <div style={{
          fontSize: '42px',
          fontWeight: 800,
          color: withRepLearning ? '#16a34a' : '#64748b',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          {vqaScore.toFixed(1)}%
        </div>

        <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${vqaScore}%`,
            background: withRepLearning
              ? 'linear-gradient(90deg, #4ade80, #16a34a)'
              : 'linear-gradient(90deg, #cbd5e1, #94a3b8)',
            borderRadius: '12px',
            transition: 'all 0.5s ease',
          }} />
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: withRepLearning ? '#dcfce7' : '#f8fafc',
          borderRadius: '8px',
          fontSize: '13px',
          color: withRepLearning ? '#166534' : '#475569',
          lineHeight: 1.6,
        }}>
          {withRepLearning ? (
            <>
              ✓ 完整两阶段：先表示对齐再生成引导，跨模态鸿沟被有效桥接。
            </>
          ) : (
            <>
              ✗ 去掉表示学习：性能骤降 <strong>{drop}%</strong>，出现灾难性遗忘。
            </>
          )}
        </div>
      </div>
    </div>
  );
};
