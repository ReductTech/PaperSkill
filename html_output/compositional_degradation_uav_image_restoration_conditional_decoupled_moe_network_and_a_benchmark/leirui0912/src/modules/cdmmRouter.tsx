import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const GLOBAL_EXPERTS = [
  { id: 'haze', name: '雾', color: '#94a3b8' },
  { id: 'lowlight', name: '低光', color: '#1e293b' },
  { id: 'overexpose', name: '过曝', color: '#fbbf24' }
];

const SPATIAL_EXPERTS = [
  { id: 'rain', name: '雨', color: '#3b82f6' },
  { id: 'snow', name: '雪', color: '#e2e8f0' },
  { id: 'blur', name: '模糊', color: '#a78bfa' },
  { id: 'noise', name: '噪声', color: '#f87171' },
  { id: 'artifact', name: '伪影', color: '#fb923c' }
];

export const CDMMRouter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeMask, setActiveMask] = useState<Set<string>>(new Set(['haze', 'rain']));

  const toggleExpert = (id: string) => {
    setActiveMask(prev => {
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
    ctx.fillText('CDMM: 掩码约束专家路由', w / 2, 20);

    // Draw input
    ctx.fillStyle = '#27446e';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 40, 35, 80, 30);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#27446e';
    ctx.strokeRect(w / 2 - 40, 35, 80, 30);
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.fillText('输入特征', w / 2, 55);

    // Arrow down
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 70);
    ctx.lineTo(w / 2, 90);
    ctx.stroke();

    // Global experts section
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('全局专家 (3)', 30, 100);

    GLOBAL_EXPERTS.forEach((exp, i) => {
      const x = 30 + i * 80;
      const y = 110;
      const active = activeMask.has(exp.id);

      ctx.fillStyle = active ? '#8b5cf6' : '#d7deea';
      ctx.globalAlpha = active ? 0.3 : 0.1;
      ctx.fillRect(x, y, 70, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? '#8b5cf6' : '#d7deea';
      ctx.strokeRect(x, y, 70, 40);

      ctx.fillStyle = active ? '#21324a' : '#68778f';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(exp.name, x + 35, y + 25);

      if (active) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 70);
        ctx.lineTo(x + 35, y);
        ctx.stroke();
      }
    });

    // Spatial experts section
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('空间专家 (5)', 30, 175);

    SPATIAL_EXPERTS.forEach((exp, i) => {
      const x = 20 + i * 72;
      const y = 185;
      const active = activeMask.has(exp.id);

      ctx.fillStyle = active ? '#06b6d4' : '#d7deea';
      ctx.globalAlpha = active ? 0.3 : 0.1;
      ctx.fillRect(x, y, 65, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? '#06b6d4' : '#d7deea';
      ctx.strokeRect(x, y, 65, 40);

      ctx.fillStyle = active ? '#21324a' : '#68778f';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(exp.name, x + 32, y + 25);

      if (active) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 70);
        ctx.lineTo(x + 32, y);
        ctx.stroke();
      }
    });

    // Arrow to output
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 235);
    ctx.lineTo(w / 2, 260);
    ctx.stroke();

    // Output
    ctx.fillStyle = '#228d5c';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(w / 2 - 50, 265, 100, 30);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#228d5c';
    ctx.strokeRect(w / 2 - 50, 265, 100, 30);
    ctx.fillStyle = '#21324a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择性修复输出', w / 2, 285);

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      const globalActive = GLOBAL_EXPERTS.filter(e => activeMask.has(e.id)).length;
      const spatialActive = SPATIAL_EXPERTS.filter(e => activeMask.has(e.id)).length;
      feedbackEl.textContent = `激活 ${globalActive} 个全局专家 + ${spatialActive} 个空间专家`;
      feedbackEl.style.color = '#228d5c';
    }
  }, [activeMask, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">CDMM专家路由器</h3>
      <p className="widget-description">
        根据退化掩码激活相关专家，观察路由机制
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={400}
          height={310}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="expert-section">
            <h4>全局专家</h4>
            <div className="expert-toggles">
              {GLOBAL_EXPERTS.map(exp => (
                <button
                  key={exp.id}
                  className={`expert-btn global ${activeMask.has(exp.id) ? 'active' : ''}`}
                  onClick={() => toggleExpert(exp.id)}
                >
                  {exp.name}
                </button>
              ))}
            </div>
          </div>

          <div className="expert-section">
            <h4>空间专家</h4>
            <div className="expert-toggles">
              {SPATIAL_EXPERTS.map(exp => (
                <button
                  key={exp.id}
                  className={`expert-btn spatial ${activeMask.has(exp.id) ? 'active' : ''}`}
                  onClick={() => toggleExpert(exp.id)}
                >
                  {exp.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        激活 1 个全局专家 + 1 个空间专家
      </div>
    </div>
  );
};
