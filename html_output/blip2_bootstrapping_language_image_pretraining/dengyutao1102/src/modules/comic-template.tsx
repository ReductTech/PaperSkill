import React, { useState } from 'react';

export interface ComicPanel {
  title: string;
  emoji: string;
  text: string;
  caption: string;
  bg: string;
  border: string;
}

interface ComicTemplateProps {
  title: string;
  panels: ComicPanel[];
}

/**
 * 通用分格漫画模板
 * 每章传入自己的 panels 内容即可
 */
export const ComicTemplate: React.FC<ComicTemplateProps> = ({ title, panels }) => {
  const [activePanel, setActivePanel] = useState(0);

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
        {title}
      </div>

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
