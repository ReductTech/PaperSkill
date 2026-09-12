import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const DEGRADATION_TYPES = [
  { id: 'rain', name: '雨', bit: 0 },
  { id: 'snow', name: '雪', bit: 1 },
  { id: 'haze', name: '雾', bit: 2 },
  { id: 'lowlight', name: '低光', bit: 3 },
  { id: 'overexpose', name: '过曝', bit: 4 },
  { id: 'blur', name: '模糊', bit: 5 },
  { id: 'noise', name: '噪声', bit: 6 },
  { id: 'artifact', name: '伪影', bit: 7 }
];

export const MultiLabelEncoder: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mask, setMask] = useState<boolean[]>(new Array(8).fill(false));

  const toggleBit = (index: number) => {
    setMask(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, w, h);

    // Draw title
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('多热退化掩码 m ∈ {0,1}⁸', w / 2, 25);

    // Draw mask bits
    const bitSize = 30;
    const startX = (w - 8 * (bitSize + 5)) / 2;
    const startY = 50;

    mask.forEach((active, i) => {
      const x = startX + i * (bitSize + 5);
      ctx.fillStyle = active ? '#228d5c' : '#d7deea';
      ctx.fillRect(x, startY, bitSize, bitSize);
      ctx.strokeStyle = '#76906a';
      ctx.strokeRect(x, startY, bitSize, bitSize);

      // Bit value
      ctx.fillStyle = active ? '#ffffff' : '#21324a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(active ? '1' : '0', x + bitSize / 2, startY + 20);

      // Degradation name
      ctx.fillStyle = '#68778f';
      ctx.font = '10px sans-serif';
      ctx.fillText(DEGRADATION_TYPES[i].name, x + bitSize / 2, startY + bitSize + 15);
    });

    // Draw binary representation
    const binaryStr = mask.map(b => b ? '1' : '0').join('');
    ctx.fillStyle = '#21324a';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`m = [${binaryStr}]`, w / 2, 130);

    // Draw active degradations list
    const activeDeps = DEGRADATION_TYPES.filter((_, i) => mask[i]);
    if (activeDeps.length > 0) {
      ctx.fillStyle = '#228d5c';
      ctx.font = '12px sans-serif';
      ctx.fillText(`激活: ${activeDeps.map(d => d.name).join(', ')}`, w / 2, 160);
    }

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      if (activeDeps.length === 0) {
        feedbackEl.textContent = '点击位来激活退化类型';
        feedbackEl.style.color = '#3b82f6';
      } else {
        feedbackEl.textContent = `${activeDeps.length}种退化激活，形成多热向量`;
        feedbackEl.style.color = '#228d5c';
      }
    }
  }, [mask, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">多标签退化编码</h3>
      <p className="widget-description">
        点击位来切换退化类型，观察多热向量如何表示组合退化
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="bit-toggles">
            {DEGRADATION_TYPES.map((deg, i) => (
              <button
                key={deg.id}
                className={`bit-btn ${mask[i] ? 'active' : ''}`}
                onClick={() => toggleBit(i)}
              >
                {deg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        点击位来激活退化类型
      </div>
    </div>
  );
};
