import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

export const DecouplingDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDecoupled, setShowDecoupled] = useState(false);

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

    // Draw divider
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 30);
    ctx.lineTo(w / 2, h - 30);
    ctx.stroke();

    // Left side: Implicit representation
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('隐式表示（旧方法）', w / 4, 25);

    // Draw tangled representation
    ctx.fillStyle = '#c43f52';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(w / 4, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.fillText('纠缠的', w / 4, 95);
    ctx.fillText('整体条件', w / 4, 110);

    // Draw interference arrows
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 4 - 30 + i * 30, 145);
      ctx.lineTo(w / 4 - 20 + i * 30, 175);
      ctx.stroke();
    }
    ctx.fillStyle = '#c43f52';
    ctx.font = '10px sans-serif';
    ctx.fillText('因子间干扰', w / 4, 195);

    // Right side: Explicit decoupling
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('显式解耦（新方法）', 3 * w / 4, 25);

    // Draw separated components
    if (showDecoupled) {
      // FDPM box
      ctx.fillStyle = '#228d5c';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(3 * w / 4 - 50, 60, 100, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#228d5c';
      ctx.strokeRect(3 * w / 4 - 50, 60, 100, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = '11px sans-serif';
      ctx.fillText('FDPM', 3 * w / 4, 85);

      // Arrow down
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3 * w / 4, 105);
      ctx.lineTo(3 * w / 4, 130);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3 * w / 4 - 5, 125);
      ctx.lineTo(3 * w / 4, 135);
      ctx.lineTo(3 * w / 4 + 5, 125);
      ctx.stroke();

      // Degradation mask
      ctx.fillStyle = '#3b82f6';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(3 * w / 4 - 40, 140, 80, 30);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#3b82f6';
      ctx.strokeRect(3 * w / 4 - 40, 140, 80, 30);
      ctx.fillStyle = '#21324a';
      ctx.font = '10px sans-serif';
      ctx.fillText('退化掩码 m̂', 3 * w / 4, 160);

      // Arrow down
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(3 * w / 4, 175);
      ctx.lineTo(3 * w / 4, 200);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3 * w / 4 - 5, 195);
      ctx.lineTo(3 * w / 4, 205);
      ctx.lineTo(3 * w / 4 + 5, 195);
      ctx.stroke();

      // CDMM box
      ctx.fillStyle = '#8b5cf6';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(3 * w / 4 - 50, 210, 100, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#8b5cf6';
      ctx.strokeRect(3 * w / 4 - 50, 210, 100, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = '11px sans-serif';
      ctx.fillText('CDMM', 3 * w / 4, 235);
    } else {
      ctx.fillStyle = '#68778f';
      ctx.font = '11px sans-serif';
      ctx.fillText('点击右侧按钮', 3 * w / 4, 120);
      ctx.fillText('查看解耦架构', 3 * w / 4, 140);
    }

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      feedbackEl.textContent = showDecoupled
        ? '显式解耦：FDPM感知 → 退化掩码 → CDMM修复'
        : '隐式表示将多种退化压缩为单一条件';
      feedbackEl.style.color = showDecoupled ? '#228d5c' : '#c43f52';
    }
  }, [showDecoupled, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">解耦演示</h3>
      <p className="widget-description">
        对比隐式表示和显式解耦的效果
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={260}
          className="widget-canvas"
        />

        <div className="controls">
          <button
            className={`toggle-btn ${showDecoupled ? 'active' : ''}`}
            onClick={() => setShowDecoupled(!showDecoupled)}
          >
            {showDecoupled ? '显示隐式表示' : '显示显式解耦'}
          </button>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        隐式表示将多种退化压缩为单一条件
      </div>
    </div>
  );
};
