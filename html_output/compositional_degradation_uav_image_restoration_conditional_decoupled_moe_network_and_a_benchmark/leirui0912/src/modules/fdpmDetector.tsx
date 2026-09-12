import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const DEGRADATION_TYPES = [
  { id: 'rain', name: '雨', color: '#3b82f6' },
  { id: 'snow', name: '雪', color: '#e2e8f0' },
  { id: 'haze', name: '雾', color: '#94a3b8' },
  { id: 'lowlight', name: '低光', color: '#1e293b' },
  { id: 'overexpose', name: '过曝', color: '#fbbf24' },
  { id: 'blur', name: '模糊', color: '#a78bfa' },
  { id: 'noise', name: '噪声', color: '#f87171' },
  { id: 'artifact', name: '伪影', color: '#fb923c' }
];

export const FDPMDetector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDeps, setSelectedDeps] = useState<Set<string>>(new Set(['rain', 'haze']));
  const [threshold, setThreshold] = useState(0.5);

  const toggleDep = (id: string) => {
    setSelectedDeps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FDPM: CLIP-based 多标签退化检测', w / 2, 20);

    // Draw CLIP encoder box
    ctx.fillStyle = '#27446e';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(30, 40, 120, 50);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#27446e';
    ctx.strokeRect(30, 40, 120, 50);
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.fillText('CLIP ViT-B/32', 90, 60);
    ctx.fillText('视觉编码器', 90, 75);

    // Arrow to MLP head
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(155, 65);
    ctx.lineTo(195, 65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(190, 60);
    ctx.lineTo(200, 65);
    ctx.lineTo(190, 70);
    ctx.stroke();

    // MLP head box
    ctx.fillStyle = '#228d5c';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(200, 40, 80, 50);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#228d5c';
    ctx.strokeRect(200, 40, 80, 50);
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.fillText('多标签头', 240, 60);
    ctx.fillText('h(·)', 240, 75);

    // Arrow to output
    ctx.strokeStyle = '#228d5c';
    ctx.beginPath();
    ctx.moveTo(285, 65);
    ctx.lineTo(320, 65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(315, 60);
    ctx.lineTo(325, 65);
    ctx.lineTo(315, 70);
    ctx.stroke();

    // Output mask
    ctx.fillStyle = '#f07e47';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(325, 40, 60, 50);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f07e47';
    ctx.strokeRect(325, 40, 60, 50);
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.fillText('退化掩码', 355, 60);
    ctx.fillText('m̂', 355, 75);

    // Draw detection results
    const startY = 110;
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('检测结果:', 30, startY);

    DEGRADATION_TYPES.forEach((deg, i) => {
      const y = startY + 20 + i * 25;
      const detected = selectedDeps.has(deg.id);
      const confidence = detected ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.3;

      // Detection bar
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(30, y, 300, 18);
      ctx.fillStyle = detected ? '#228d5c' : '#c43f52';
      ctx.fillRect(30, y, 300 * confidence, 18);

      // Label
      ctx.fillStyle = '#21324a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(deg.name, 35, y + 13);

      // Confidence
      ctx.textAlign = 'right';
      ctx.fillText(`${(confidence * 100).toFixed(0)}%`, 325, y + 13);

      // Threshold line
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(30 + 300 * threshold, y - 2);
      ctx.lineTo(30 + 300 * threshold, y + 20);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      feedbackEl.textContent = `检测到 ${selectedDeps.size} 种退化，阈值 ${threshold.toFixed(1)}`;
      feedbackEl.style.color = '#27446e';
    }
  }, [selectedDeps, threshold, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">FDPM退化检测器</h3>
      <p className="widget-description">
        使用CLIP视觉编码器和多标签头检测退化类型
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={330}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="dep-toggles">
            {DEGRADATION_TYPES.map(deg => (
              <button
                key={deg.id}
                className={`dep-btn ${selectedDeps.has(deg.id) ? 'active' : ''}`}
                onClick={() => toggleDep(deg.id)}
              >
                {deg.name}
              </button>
            ))}
          </div>

          <div className="slider-control">
            <label>检测阈值: {threshold.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        检测到 2 种退化
      </div>
    </div>
  );
};
