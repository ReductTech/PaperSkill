import React, { useState } from 'react';

/**
 * 第一章：双语翻译的困境 · 分格漫画
 * 4 格漫画展示：传统端到端 → 问题 → BLIP-2 方案 → 效果
 */
const Ch1AnalogyComic: React.FC = () => {
  const [activePanel, setActivePanel] = useState(0);

  const panels = [
    {
      title: '① 传统端到端方法',
      bg: '#fef2f2',
      border: '#fca5a5',
      emoji: '😰',
      text: '让只懂中文的图像专家和只懂英文的语言专家，一起重新学一门新语言！',
      caption: '两人被迫从头学对方的专业，痛苦又昂贵',
    },
    {
      title: '② 问题重重',
      bg: '#fffbeb',
      border: '#fcd34d',
      emoji: '💸',
      text: '培训费钱又费时，两人本来已有的专业知识还互相干扰、互相遗忘！',
      caption: '成本高 + 灾难性遗忘 = 低效',
    },
    {
      title: '③ BLIP-2 的思路',
      bg: '#f0f9ff',
      border: '#7dd3fc',
      emoji: '🤝',
      text: '不要求两位专家改变自己，而是专门雇一位"翻译官"（Q-Former）！',
      caption: '翻译官先学图像专家的"图纸"',
    },
    {
      title: '④ 高效桥接',
      bg: '#f0fdf4',
      border: '#86efac',
      emoji: '✨',
      text: '两位专家全程冻结不动，只有翻译官在学习。成本极低，知识不遗忘！',
      caption: '冻结 + 轻量桥接 = 高效 VLP',
    },
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      border: '2px solid #e2e8f0',
    }}>
      <div style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '12px',
        textAlign: 'center',
      }}>
        双语翻译的困境 · 4 格漫画
      </div>

      {/* 漫画格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '12px',
      }}>
        {panels.map((panel, idx) => (
          <div
            key={idx}
            onClick={() => setActivePanel(idx)}
            style={{
              background: panel.bg,
              border: `2px solid ${idx === activePanel ? panel.border : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: idx === activePanel ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              marginBottom: '6px',
            }}>
              {panel.title}
            </div>
            <div style={{ fontSize: '32px', textAlign: 'center', margin: '8px 0' }}>
              {panel.emoji}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#0f172a',
              lineHeight: 1.4,
              textAlign: 'center',
            }}>
              {panel.text}
            </div>
          </div>
        ))}
      </div>

      {/* 当前格详细说明 */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '12px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          💡 {panels[activePanel].caption}
        </div>
      </div>
    </div>
  );
};

export default Ch1AnalogyComic;
