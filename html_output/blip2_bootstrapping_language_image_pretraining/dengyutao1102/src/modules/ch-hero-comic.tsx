import React, { useState } from 'react';
import type { WidgetProps } from './registry';

/**
 * ChHeroComic — 封面漫画：BLIP-2 核心思想
 * 漫画风格展示冻结图像编码器 + Q-Former + 冻结 LLM 的两阶段桥接。
 */
export const ChHeroComic: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);

  const stages = [
    { label: '阶段 1：表示学习', color: '#2563eb' },
    { label: '阶段 2：生成学习', color: '#ea580c' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      width: '100%',
      maxWidth: '720px',
      margin: '0 auto',
    }}>
      {/* 漫画主体 — 三格漫画布局 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '8px',
        width: '100%',
        alignItems: 'center',
      }}>
        {/* 左格：冻结图像编码器 */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          padding: '16px 12px',
          border: '2px solid #7c3aed',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* 冰封效果装饰 */}
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '8px',
            fontSize: '16px',
            opacity: 0.6,
          }}>❄️</div>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🏔️</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed' }}>冻结图像编码器</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>ViT-g · 参数冻结</div>
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#7c3aed',
            background: '#ede9fe',
            borderRadius: '4px',
            padding: '2px 6px',
            display: 'inline-block',
          }}>
            🔒 不更新
          </div>
        </div>

        {/* 中间：Q-Former 桥接器 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '80px',
        }}>
          {/* 阶段箭头 1 */}
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: stages[stage].color,
            marginBottom: '2px',
            transition: 'color 0.3s ease',
          }}>
            {stage === 0 ? '──→' : '←──'}
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #ea580c',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)',
          }}>
            <div style={{ fontSize: '20px' }}>🌉</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c' }}>Q-Former</div>
          </div>
          <div style={{
            fontSize: '10px',
            color: '#ea580c',
            background: '#fff7ed',
            borderRadius: '4px',
            padding: '2px 6px',
            marginTop: '2px',
          }}>
            🔧 可训练
          </div>
          {/* 阶段箭头 2 */}
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: stages[stage].color,
            marginTop: '2px',
            transition: 'color 0.3s ease',
          }}>
            {stage === 0 ? '──→' : '←──'}
          </div>
        </div>

        {/* 右格：冻结 LLM */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderRadius: '12px',
          padding: '16px 12px',
          border: '2px solid #16a34a',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '8px',
            fontSize: '16px',
            opacity: 0.6,
          }}>❄️</div>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🧠</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>冻结 LLM</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>FlanT5-XXL · 参数冻结</div>
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#16a34a',
            background: '#dcfce7',
            borderRadius: '4px',
            padding: '2px 6px',
            display: 'inline-block',
          }}>
            🔒 不更新
          </div>
        </div>
      </div>

      {/* 阶段切换按钮 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {stages.map((s, i) => (
          <button
            key={i}
            onClick={() => setStage(i)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '2px solid',
              borderColor: stage === i ? s.color : '#e2e8f0',
              background: stage === i ? s.color + '15' : '#fff',
              color: stage === i ? s.color : '#64748b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 阶段说明 */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '10px 16px',
        borderLeft: `3px solid ${stages[stage].color}`,
        fontSize: '12px',
        color: '#475569',
        lineHeight: 1.6,
        maxWidth: '480px',
        textAlign: 'center',
      }}>
        {stage === 0
          ? '阶段 1：Q-Former 从冻结图像编码器学习视觉-语言表示，通过 ITC/ITM/ITG 三个目标对齐跨模态信息。'
          : '阶段 2：Q-Former 输出投影为软提示，接入冻结 LLM，用极少可训练参数引导零样本图像到文本生成。'
        }
      </div>

      {/* 底部标语 */}
      <div style={{
        fontSize: '13px',
        fontWeight: 700,
        color: '#0f172a',
        marginTop: '4px',
        padding: '6px 20px',
        background: '#fef3c7',
        borderRadius: '20px',
        border: '1px solid #fcd34d',
      }}>
        💡 冻结大模型 + 轻量桥接器 = 高效多模态新范式
      </div>
    </div>
  );
};
