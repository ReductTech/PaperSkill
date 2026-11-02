import React from 'react';
import type { WidgetProps } from './registry';

/**
 * ChHeroOld — 旧方法漫画：端到端 VLP
 * 展示传统端到端方法的问题：巨大的图像编码器和 LLM 直接连接，参数庞大、成本高。
 */
export const ChHeroOld: React.FC<WidgetProps> = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      width: '100%',
      maxWidth: '420px',
      margin: '0 auto',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>
        ❌ 传统端到端 VLP
      </div>

      {/* 巨大的模型示意图 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        justifyContent: 'center',
      }}>
        {/* 图像编码器 - 巨大、复杂 */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '10px',
          padding: '12px 10px',
          border: '2px solid #d97706',
          textAlign: 'center',
          width: '38%',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏗️</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e' }}>图像编码器</div>
          <div style={{ fontSize: '10px', color: '#92400e', marginTop: '2px' }}>大模型 · 可训练</div>
        </div>

        {/* 直接连接 - 粗箭头 */}
        <div style={{
          fontSize: '20px',
          color: '#dc2626',
          fontWeight: 700,
        }}>
          ⟷
        </div>

        {/* LLM - 巨大、复杂 */}
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: '10px',
          padding: '12px 10px',
          border: '2px solid #dc2626',
          textAlign: 'center',
          width: '38%',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏭</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b' }}>LLM</div>
          <div style={{ fontSize: '10px', color: '#991b1b', marginTop: '2px' }}>大模型 · 可训练</div>
        </div>
      </div>

      {/* 问题标签 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}>
        <div style={{
          background: '#fef2f2',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid #fecaca',
          fontSize: '12px',
          color: '#991b1b',
          textAlign: 'center',
        }}>
          💰 参数规模 ~10B，训练成本极高
        </div>
        <div style={{
          background: '#fef2f2',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid #fecaca',
          fontSize: '12px',
          color: '#991b1b',
          textAlign: 'center',
        }}>
          🧠 联合训练易导致灾难性遗忘
        </div>
        <div style={{
          background: '#fef2f2',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid #fecaca',
          fontSize: '12px',
          color: '#991b1b',
          textAlign: 'center',
        }}>
          🔗 模态鸿沟难以桥接
        </div>
      </div>
    </div>
  );
};
