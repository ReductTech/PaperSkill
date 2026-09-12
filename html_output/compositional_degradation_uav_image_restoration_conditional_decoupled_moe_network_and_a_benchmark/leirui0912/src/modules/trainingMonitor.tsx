import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

export const TrainingMonitor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;

  const stages = [
    { name: 'Stage I: 训练FDPM', desc: '微调CLIP视觉编码器+多标签头', loss: 0.8 },
    { name: 'Stage I: 收敛', desc: '冻结FDPM，准备修复训练', loss: 0.3 },
    { name: 'Stage II: 训练CDMM', desc: '训练修复网络', loss: 0.6 },
    { name: 'Stage II: 中期', desc: '损失持续下降', loss: 0.35 },
    { name: 'Stage II: 后期', desc: '精细调优', loss: 0.2 },
    { name: '完成', desc: '模型训练完成', loss: 0.15 }
  ];

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

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
    ctx.fillText('两阶段训练过程', w / 2, 20);

    // Draw loss curve
    const curveStartX = 50;
    const curveEndX = w - 30;
    const curveY = 60;
    const curveH = 100;

    // Background
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(curveStartX, curveY, curveEndX - curveStartX, curveH);
    ctx.strokeStyle = '#d7deea';
    ctx.strokeRect(curveStartX, curveY, curveEndX - curveStartX, curveH);

    // Stage divider
    const midX = (curveStartX + curveEndX) / 2;
    ctx.strokeStyle = '#68778f';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, curveY);
    ctx.lineTo(midX, curveY + curveH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stage labels
    ctx.fillStyle = '#68778f';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Stage I', midX / 2 + curveStartX / 2, curveY + curveH + 15);
    ctx.fillText('Stage II', (midX + curveEndX) / 2, curveY + curveH + 15);

    // Draw loss curve
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= currentStep; i++) {
      const x = curveStartX + (curveEndX - curveStartX) * (i / (totalSteps - 1));
      const y = curveY + curveH * (1 - stages[i].loss);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw current point
    const currentX = curveStartX + (curveEndX - curveStartX) * (currentStep / (totalSteps - 1));
    const currentY = curveY + curveH * (1 - stages[currentStep].loss);
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw current stage info
    const stage = stages[currentStep];
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(stage.name, 50, 190);
    ctx.font = '11px sans-serif';
    ctx.fillText(stage.desc, 50, 210);
    ctx.fillText(`损失: ${stage.loss.toFixed(2)}`, 50, 230);

    // Draw progress bar
    ctx.fillStyle = '#d7deea';
    ctx.fillRect(50, 245, w - 80, 15);
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(50, 245, (w - 80) * ((currentStep + 1) / totalSteps), 15);

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      feedbackEl.textContent = `步骤 ${currentStep + 1}/${totalSteps}: ${stage.name}`;
      feedbackEl.style.color = '#27446e';
    }
  }, [currentStep, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">训练过程监控</h3>
      <p className="widget-description">
        步进查看两阶段训练过程和损失变化
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={270}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="step-controls">
            <button onClick={prevStep} disabled={currentStep === 0}>
              ← 上一步
            </button>
            <span className="step-indicator">
              {currentStep + 1} / {totalSteps}
            </span>
            <button onClick={nextStep} disabled={currentStep === totalSteps - 1}>
              下一步 →
            </button>
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        步骤 1/6: Stage I: 训练FDPM
      </div>
    </div>
  );
};
