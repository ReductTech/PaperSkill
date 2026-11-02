import React from 'react';

/**
 * 封面词云组件
 * 展示 BLIP-2 的核心关键词
 */
const ChHeroWordcloud: React.FC = () => {
  // 关键词列表：text, size(px), color, x(%), y(%), rotate(deg)
  const words = [
    // 最大核心词
    { text: 'Q-Former', size: 32, color: '#2563eb', x: 30, y: 20, rotate: -3 },
    { text: '冻结模型', size: 24, color: '#7c3aed', x: 65, y: 15, rotate: 2 },
    { text: '两阶段引导', size: 22, color: '#0891b2', x: 50, y: 55, rotate: -2 },
    // 中等大小
    { text: '视觉-语言预训练', size: 18, color: '#16a34a', x: 15, y: 45, rotate: 3 },
    { text: '零样本迁移', size: 18, color: '#ea580c', x: 78, y: 40, rotate: -4 },
    { text: '软提示', size: 16, color: '#db2777', x: 25, y: 70, rotate: 5 },
    { text: '跨模态桥接', size: 16, color: '#4f46e5', x: 60, y: 75, rotate: -3 },
    { text: '188M 参数', size: 16, color: '#059669', x: 85, y: 65, rotate: 2 },
    // 较小的词
    { text: 'ViT-G', size: 14, color: '#0284c7', x: 10, y: 15, rotate: -5 },
    { text: 'FlanT5', size: 14, color: '#9333ea', x: 88, y: 20, rotate: 4 },
    { text: '表示学习', size: 14, color: '#0d9488', x: 40, y: 35, rotate: -2 },
    { text: '生成式学习', size: 14, color: '#dc2626', x: 72, y: 55, rotate: 3 },
    { text: 'VQA', size: 14, color: '#2563eb', x: 20, y: 85, rotate: -3 },
    { text: '图像描述', size: 13, color: '#ca8a04', x: 45, y: 88, rotate: 2 },
    { text: '图文检索', size: 13, color: '#be185d', x: 68, y: 90, rotate: -2 },
    { text: '54× 效率', size: 13, color: '#166534', x: 90, y: 85, rotate: 3 },
    { text: '信息瓶颈', size: 12, color: '#57534e', x: 5, y: 60, rotate: 6 },
    { text: '查询向量', size: 12, color: '#7c2d12', x: 92, y: 50, rotate: -5 },
    { text: '交叉注意力', size: 12, color: '#1e40af', x: 35, y: 10, rotate: -3 },
    { text: '灾难性遗忘', size: 12, color: '#991b1b', x: 55, y: 30, rotate: 4 },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px',
      padding: '20px',
      border: '2px solid #e2e8f0',
      position: 'relative',
      height: '280px',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '8px',
        textAlign: 'center',
        letterSpacing: '1px',
      }}>
        BLIP-2 核心关键词
      </div>
      <div style={{ position: 'relative', width: '100%', height: '230px' }}>
        {words.map((word, idx) => (
          <span
            key={idx}
            style={{
              position: 'absolute',
              left: `${word.x}%`,
              top: `${word.y}%`,
              fontSize: `${word.size}px`,
              color: word.color,
              fontWeight: word.size >= 20 ? 700 : 500,
              transform: `rotate(${word.rotate}deg)`,
              whiteSpace: 'nowrap',
              opacity: 0.85,
              transition: 'all 0.3s ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = `rotate(${word.rotate}deg) scale(1.15)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = `rotate(${word.rotate}deg) scale(1)`;
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ChHeroWordcloud;
