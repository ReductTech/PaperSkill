import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

export const CDCBProcessor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gateWeight, setGateWeight] = useState(0.5);

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
    ctx.fillText('CDCB: 空间-频率双域校正', w / 2, 20);

    // Draw input
    ctx.fillStyle = '#27446e';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 40, 35, 80, 25);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#27446e';
    ctx.strokeRect(w / 2 - 40, 35, 80, 25);
    ctx.fillStyle = '#21324a';
    ctx.font = '10px sans-serif';
    ctx.fillText('输入特征 X', w / 2, 52);

    // Arrow down to split
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 65);
    ctx.lineTo(w / 2, 80);
    ctx.stroke();

    // Split arrows
    ctx.beginPath();
    ctx.moveTo(w / 2, 80);
    ctx.lineTo(w / 4, 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2, 80);
    ctx.lineTo(3 * w / 4, 100);
    ctx.stroke();

    // Frequency branch
    ctx.fillStyle = '#3b82f6';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(30, 105, 130, 80);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(30, 105, 130, 80);

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('频率分支', 95, 125);

    ctx.font = '10px sans-serif';
    ctx.fillText('FFT → 频谱调制', 95, 145);
    ctx.fillText('→ 逆FFT', 95, 160);

    // Spatial branch
    ctx.fillStyle = '#228d5c';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(240, 105, 130, 80);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#228d5c';
    ctx.strokeRect(240, 105, 130, 80);

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('空间分支', 305, 125);

    ctx.font = '10px sans-serif';
    ctx.fillText('Swin窗口注意力', 305, 145);
    ctx.fillText('局部结构处理', 305, 160);

    // Gate
    ctx.fillStyle = '#f07e47';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(w / 2 - 25, 195, 50, 25);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f07e47';
    ctx.strokeRect(w / 2 - 25, 195, 50, 25);
    ctx.fillStyle = '#21324a';
    ctx.font = '10px sans-serif';
    ctx.fillText(`w=${gateWeight.toFixed(1)}`, w / 2, 212);

    // Merge arrows
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(95, 190);
    ctx.lineTo(w / 2 - 30, 207);
    ctx.stroke();

    ctx.strokeStyle = '#228d5c';
    ctx.beginPath();
    ctx.moveTo(305, 190);
    ctx.lineTo(w / 2 + 30, 207);
    ctx.stroke();

    // Output
    ctx.fillStyle = '#8b5cf6';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 50, 230, 100, 30);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#8b5cf6';
    ctx.strokeRect(w / 2 - 50, 230, 100, 30);
    ctx.fillStyle = '#21324a';
    ctx.font = '10px sans-serif';
    ctx.fillText('校正输出', w / 2, 250);

    // Arrow down
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 225);
    ctx.lineTo(w / 2, 228);
    ctx.stroke();

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      if (gateWeight < 0.3) {
        feedbackEl.textContent = '偏向空间处理：适合雨条纹等结构退化';
        feedbackEl.style.color = '#228d5c';
      } else if (gateWeight > 0.7) {
        feedbackEl.textContent = '偏向频率处理：适合模糊、噪声等频谱退化';
        feedbackEl.style.color = '#3b82f6';
      } else {
        feedbackEl.textContent = '平衡处理：同时处理空间和频率特征';
        feedbackEl.style.color = '#f07e47';
      }
    }
  }, [gateWeight, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">CDCB空间-频率处理器</h3>
      <p className="widget-description">
        调整门控权重观察频率和空间分支的平衡
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={270}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="slider-control">
            <label>门控权重 w: {gateWeight.toFixed(1)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={gateWeight}
              onChange={(e) => setGateWeight(parseFloat(e.target.value))}
            />
            <div className="slider-labels">
              <span>空间</span>
              <span>频率</span>
            </div>
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        平衡处理：同时处理空间和频率特征
      </div>
    </div>
  );
};
