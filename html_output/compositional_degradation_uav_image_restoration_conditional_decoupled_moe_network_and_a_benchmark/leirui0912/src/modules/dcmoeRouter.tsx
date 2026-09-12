import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const EXPERTS = [
  { id: 'haze', name: '雾', group: 'global', color: '#8b5cf6' },
  { id: 'lowlight', name: '低光', group: 'global', color: '#8b5cf6' },
  { id: 'overexpose', name: '过曝', group: 'global', color: '#8b5cf6' },
  { id: 'rain', name: '雨', group: 'spatial', color: '#06b6d4' },
  { id: 'snow', name: '雪', group: 'spatial', color: '#06b6d4' },
  { id: 'blur', name: '模糊', group: 'spatial', color: '#06b6d4' },
  { id: 'noise', name: '噪声', group: 'spatial', color: '#06b6d4' },
  { id: 'artifact', name: '伪影', group: 'spatial', color: '#06b6d4' }
];

export const DCMoERouter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDeg, setSelectedDeg] = useState<string>('haze');

  // Map degradation to activated experts
  const getActivatedExperts = (deg: string): Set<string> => {
    const mapping: Record<string, string[]> = {
      'haze': ['haze'],
      'lowlight': ['lowlight'],
      'overexpose': ['overexpose'],
      'rain': ['rain'],
      'snow': ['snow'],
      'blur': ['blur'],
      'noise': ['noise'],
      'artifact': ['artifact'],
      'rain+haze': ['rain', 'haze'],
      'blur+noise': ['blur', 'noise'],
      'rain+lowlight': ['rain', 'lowlight']
    };
    return new Set(mapping[deg] || []);
  };

  const activated = getActivatedExperts(selectedDeg);

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
    ctx.fillText('DC-MoE: 解耦MoE路由', w / 2, 20);

    // Draw input with mask
    ctx.fillStyle = '#27446e';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 50, 35, 100, 30);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#27446e';
    ctx.strokeRect(w / 2 - 50, 35, 100, 30);
    ctx.fillStyle = '#21324a';
    ctx.font = '10px sans-serif';
    ctx.fillText('退化掩码 m̂', w / 2, 55);

    // Draw expert groups
    const globalExperts = EXPERTS.filter(e => e.group === 'global');
    const spatialExperts = EXPERTS.filter(e => e.group === 'spatial');

    // Global experts box
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 80, 160, 120);
    ctx.fillStyle = '#8b5cf6';
    ctx.globalAlpha = 0.05;
    ctx.fillRect(20, 80, 160, 120);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('全局专家 Eᵍ (3)', 100, 95);

    globalExperts.forEach((exp, i) => {
      const x = 30 + i * 50;
      const y = 110;
      const isActive = activated.has(exp.id);

      ctx.fillStyle = isActive ? '#8b5cf6' : '#d7deea';
      ctx.globalAlpha = isActive ? 0.4 : 0.1;
      ctx.fillRect(x, y, 40, 60);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isActive ? '#8b5cf6' : '#d7deea';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, 40, 60);

      ctx.fillStyle = isActive ? '#21324a' : '#68778f';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(exp.name, x + 20, y + 35);

      if (isActive) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 65);
        ctx.lineTo(x + 20, y);
        ctx.stroke();
      }
    });

    // Spatial experts box
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(220, 80, 200, 120);
    ctx.fillStyle = '#06b6d4';
    ctx.globalAlpha = 0.05;
    ctx.fillRect(220, 80, 200, 120);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('空间专家 Eˢ (5)', 320, 95);

    spatialExperts.forEach((exp, i) => {
      const x = 225 + i * 38;
      const y = 110;
      const isActive = activated.has(exp.id);

      ctx.fillStyle = isActive ? '#06b6d4' : '#d7deea';
      ctx.globalAlpha = isActive ? 0.4 : 0.1;
      ctx.fillRect(x, y, 35, 60);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isActive ? '#06b6d4' : '#d7deea';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, 35, 60);

      ctx.fillStyle = isActive ? '#21324a' : '#68778f';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(exp.name, x + 17, y + 35);

      if (isActive) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 65);
        ctx.lineTo(x + 17, y);
        ctx.stroke();
      }
    });

    // Output
    ctx.fillStyle = '#228d5c';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 50, 210, 100, 30);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#228d5c';
    ctx.strokeRect(w / 2 - 50, 210, 100, 30);
    ctx.fillStyle = '#21324a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择性修复', w / 2, 230);

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      const globalActive = globalExperts.filter(e => activated.has(e.id)).length;
      const spatialActive = spatialExperts.filter(e => activated.has(e.id)).length;
      feedbackEl.textContent = `退化 "${selectedDeg}" → 激活 ${globalActive} 全局 + ${spatialActive} 空间专家`;
      feedbackEl.style.color = '#228d5c';
    }
  }, [selectedDeg, activated, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">DC-MoE路由演示</h3>
      <p className="widget-description">
        选择退化类型观察专家激活模式
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={440}
          height={250}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="deg-selector">
            <h4>选择退化配置</h4>
            <div className="deg-options">
              <button
                className={`deg-option ${selectedDeg === 'haze' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('haze')}
              >
                雾
              </button>
              <button
                className={`deg-option ${selectedDeg === 'lowlight' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('lowlight')}
              >
                低光
              </button>
              <button
                className={`deg-option ${selectedDeg === 'rain' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('rain')}
              >
                雨
              </button>
              <button
                className={`deg-option ${selectedDeg === 'blur' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('blur')}
              >
                模糊
              </button>
              <button
                className={`deg-option ${selectedDeg === 'rain+haze' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('rain+haze')}
              >
                雨+雾
              </button>
              <button
                className={`deg-option ${selectedDeg === 'blur+noise' ? 'active' : ''}`}
                onClick={() => setSelectedDeg('blur+noise')}
              >
                模糊+噪声
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        退化 "雾" → 激活 1 全局 + 0 空间专家
      </div>
    </div>
  );
};
