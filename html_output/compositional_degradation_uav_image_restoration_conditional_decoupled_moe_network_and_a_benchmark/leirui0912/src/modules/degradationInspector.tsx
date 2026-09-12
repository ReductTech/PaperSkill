import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

// Degradation Inspector Widget
// Allows users to explore different degradation types and their effects on images

const DEGRADATION_TYPES = [
  { id: 'rain', name: '雨', color: '#3b82f6', icon: '🌧️' },
  { id: 'snow', name: '雪', color: '#e2e8f0', icon: '❄️' },
  { id: 'haze', name: '雾', color: '#94a3b8', icon: '🌫️' },
  { id: 'lowlight', name: '低光', color: '#1e293b', icon: '🌙' },
  { id: 'overexpose', name: '过曝', color: '#fbbf24', icon: '☀️' },
  { id: 'blur', name: '模糊', color: '#a78bfa', icon: '🔍' },
  { id: 'noise', name: '噪声', color: '#f87171', icon: '📺' },
  { id: 'artifact', name: '伪影', color: '#fb923c', icon: '🖼️' }
];

export const DegradationInspector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeDegradations, setActiveDegradations] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState(0.5);

  const toggleDegradation = (id: string) => {
    setActiveDegradations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

    // Clear canvas
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, w, h);

    // Draw a simple photo frame
    ctx.fillStyle = '#78716c';
    ctx.fillRect(60, 40, 200, 160);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(65, 45, 190, 150);

    // Draw a simple landscape
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(65, 45, 190, 80);
    ctx.fillStyle = '#228b22';
    ctx.fillRect(65, 100, 190, 95);

    // Draw sun
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(220, 70, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw degradation markers
    let y = 45;
    activeDegradations.forEach(id => {
      const deg = DEGRADATION_TYPES.find(d => d.id === id);
      if (deg) {
        ctx.fillStyle = deg.color;
        ctx.globalAlpha = intensity;
        ctx.fillRect(65, y, 190, 20);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${deg.icon} ${deg.name}`, 160, y + 15);
        y += 25;
      }
    });

    // Draw active count
    ctx.fillStyle = '#21324a';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`激活退化: ${activeDegradations.size}/8`, 160, 220);

    // Draw feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      if (activeDegradations.size === 0) {
        feedbackEl.textContent = '请选择至少一种退化类型';
        feedbackEl.style.color = '#3b82f6';
      } else if (activeDegradations.size === 1) {
        feedbackEl.textContent = '单一退化：相对容易处理';
        feedbackEl.style.color = '#22c55e';
      } else if (activeDegradations.size <= 3) {
        feedbackEl.textContent = '组合退化：需要专门的修复方法';
        feedbackEl.style.color = '#f59e0b';
      } else {
        feedbackEl.textContent = '高阶组合退化：非常具有挑战性';
        feedbackEl.style.color = '#ef4444';
      }
    }
  }, [activeDegradations, intensity, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">退化识别器</h3>
      <p className="widget-description">
        点击选择不同的退化类型，观察它们对图像的影响
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="degradation-grid">
            {DEGRADATION_TYPES.map(deg => (
              <button
                key={deg.id}
                className={`degradation-btn ${activeDegradations.has(deg.id) ? 'active' : ''}`}
                onClick={() => toggleDegradation(deg.id)}
                style={{
                  borderColor: activeDegradations.has(deg.id) ? deg.color : '#d7deea',
                  backgroundColor: activeDegradations.has(deg.id) ? `${deg.color}20` : 'transparent'
                }}
              >
                <span className="deg-icon">{deg.icon}</span>
                <span className="deg-name">{deg.name}</span>
              </button>
            ))}
          </div>

          <div className="slider-control">
            <label>退化强度: {Math.round(intensity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        请选择至少一种退化类型
      </div>
    </div>
  );
};
