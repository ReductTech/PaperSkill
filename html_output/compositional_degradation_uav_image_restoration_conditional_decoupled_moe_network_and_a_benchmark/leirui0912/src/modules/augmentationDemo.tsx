import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

export const AugmentationDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [augmentProb, setAugmentProb] = useState(0.05);
  const [showAugmented, setShowAugmented] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('掩码过载增强', w / 2, 20);

    // Draw original mask
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('原始退化掩码:', 30, 45);

    const originalMask = [1, 0, 1, 0, 0, 0, 0, 0]; // rain + haze
    const bitSize = 25;
    const startX = 30;
    const startY = 55;

    originalMask.forEach((bit, i) => {
      const x = startX + i * (bitSize + 3);
      ctx.fillStyle = bit ? '#228d5c' : '#d7deea';
      ctx.fillRect(x, startY, bitSize, bitSize);
      ctx.strokeStyle = '#76906a';
      ctx.strokeRect(x, startY, bitSize, bitSize);
      ctx.fillStyle = bit ? '#ffffff' : '#21324a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bit.toString(), x + bitSize / 2, startY + 17);
    });

    // Draw augmented mask
    if (showAugmented) {
      ctx.fillStyle = '#21324a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('增强后掩码 (概率 0.05):', 30, 100);

      const augmentedMask = [...originalMask];
      augmentedMask[3] = 1; // Add lowlight

      augmentedMask.forEach((bit, i) => {
        const x = startX + i * (bitSize + 3);
        const isAugmented = i === 3 && bit === 1;
        ctx.fillStyle = isAugmented ? '#f07e47' : (bit ? '#228d5c' : '#d7deea');
        ctx.fillRect(x, 110, bitSize, bitSize);
        ctx.strokeStyle = isAugmented ? '#f07e47' : '#76906a';
        ctx.lineWidth = isAugmented ? 2 : 1;
        ctx.strokeRect(x, 110, bitSize, bitSize);
        ctx.fillStyle = bit ? '#ffffff' : '#21324a';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bit.toString(), x + bitSize / 2, 127);
      });

      // Draw annotation
      ctx.fillStyle = '#f07e47';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 随机激活的位', startX + 3 * (bitSize + 3) + bitSize + 5, 127);
    }

    // Draw explanation
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('目的: 减少对完美掩码的依赖', 30, 170);
    ctx.fillText('概率: 0.05 (5%)', 30, 190);
    ctx.fillText('效果: 提高模型鲁棒性', 30, 210);

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      feedbackEl.textContent = showAugmented
        ? '增强：随机激活全局退化位，提高鲁棒性'
        : '点击查看掩码过载增强效果';
      feedbackEl.style.color = showAugmented ? '#f07e47' : '#27446e';
    }
  }, [augmentProb, showAugmented, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">掩码过载增强</h3>
      <p className="widget-description">
        演示如何通过随机激活退化位来增强训练
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={230}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="slider-control">
            <label>增强概率: {augmentProb.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={augmentProb}
              onChange={(e) => setAugmentProb(parseFloat(e.target.value))}
            />
          </div>

          <button
            className={`toggle-btn ${showAugmented ? 'active' : ''}`}
            onClick={() => setShowAugmented(!showAugmented)}
          >
            {showAugmented ? '隐藏增强' : '显示增强'}
          </button>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        点击查看掩码过载增强效果
      </div>
    </div>
  );
};
