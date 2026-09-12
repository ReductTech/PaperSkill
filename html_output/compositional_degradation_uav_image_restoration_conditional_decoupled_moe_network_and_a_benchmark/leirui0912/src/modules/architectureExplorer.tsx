import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const COMPONENTS = [
  { id: 'input', name: '输入图像', x: 180, y: 20, w: 80, h: 30, color: '#27446e' },
  { id: 'fdpm', name: 'FDPM', x: 180, y: 70, w: 80, h: 40, color: '#228d5c' },
  { id: 'encoder', name: '退化编码器', x: 180, y: 130, w: 80, h: 30, color: '#f07e47' },
  { id: 'cdmm1', name: 'CDMM Stage 1', x: 180, y: 180, w: 80, h: 30, color: '#8b5cf6' },
  { id: 'cdmm2', name: 'CDMM Stage 2', x: 180, y: 230, w: 80, h: 30, color: '#8b5cf6' },
  { id: 'output', name: '修复输出', x: 180, y: 280, w: 80, h: 30, color: '#3b82f6' }
];

export const ArchitectureExplorer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

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
    ctx.fillText('DAME-Net 架构总览', w / 2, 20);

    // Draw connections
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    for (let i = 0; i < COMPONENTS.length - 1; i++) {
      const from = COMPONENTS[i];
      const to = COMPONENTS[i + 1];
      ctx.beginPath();
      ctx.moveTo(from.x + from.w / 2, from.y + from.h);
      ctx.lineTo(to.x + to.w / 2, to.y);
      ctx.stroke();
    }

    // Draw components
    COMPONENTS.forEach(comp => {
      const isSelected = selectedComponent === comp.id;

      ctx.fillStyle = isSelected ? comp.color : `${comp.color}30`;
      ctx.fillRect(comp.x, comp.y, comp.w, comp.h);
      ctx.strokeStyle = comp.color;
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(comp.x, comp.y, comp.w, comp.h);

      ctx.fillStyle = isSelected ? '#ffffff' : '#21324a';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(comp.name, comp.x + comp.w / 2, comp.y + comp.h / 2 + 4);

      if (isSelected) {
        // Pulse effect
        ctx.strokeStyle = comp.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(comp.x - 3, comp.y - 3, comp.w + 6, comp.h + 6);
        ctx.globalAlpha = 1;
      }
    });

    // Draw side info
    if (selectedComponent) {
      const comp = COMPONENTS.find(c => c.id === selectedComponent);
      if (comp) {
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('选中组件:', 300, 50);

        ctx.font = '11px sans-serif';
        ctx.fillText(comp.name, 300, 70);

        // Component description
        const descriptions: Record<string, string> = {
          'input': '输入退化图像 x ∈ ℝ^(3×H×W)',
          'fdpm': '因子级退化感知\n输出退化掩码 m̂ 和语义嵌入 p',
          'encoder': '将 m̂ 和 p 转换为\n阶段条件向量 {gₛ}',
          'cdmm1': '条件解耦MoE模块\n空间-频率混合处理',
          'cdmm2': '继续修复处理\n掩码约束专家路由',
          'output': '修复后的图像 ŷ'
        };

        const desc = descriptions[selectedComponent] || '';
        const lines = desc.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, 300, 90 + i * 20);
        });
      }
    }

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      if (selectedComponent) {
        const comp = COMPONENTS.find(c => c.id === selectedComponent);
        feedbackEl.textContent = `选中: ${comp?.name || ''}`;
        feedbackEl.style.color = comp?.color || '#27446e';
      } else {
        feedbackEl.textContent = '点击查看架构组件详情';
        feedbackEl.style.color = '#27446e';
      }
    }
  }, [selectedComponent, chapterId, moduleId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = COMPONENTS.find(comp =>
      x >= comp.x && x <= comp.x + comp.w &&
      y >= comp.y && y <= comp.y + comp.h
    );

    setSelectedComponent(clicked?.id || null);
  };

  return (
    <div className="widget-container">
      <h3 className="widget-title">架构浏览器</h3>
      <p className="widget-description">
        点击查看DAME-Net架构的各个组件
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={440}
          height={320}
          className="widget-canvas"
          onClick={handleCanvasClick}
          style={{ cursor: 'pointer' }}
        />

        <div className="controls">
          <div className="component-list">
            {COMPONENTS.map(comp => (
              <button
                key={comp.id}
                className={`component-btn ${selectedComponent === comp.id ? 'active' : ''}`}
                onClick={() => setSelectedComponent(comp.id)}
                style={{
                  borderColor: selectedComponent === comp.id ? comp.color : '#d7deea',
                  color: selectedComponent === comp.id ? comp.color : '#21324a'
                }}
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        点击查看架构组件详情
      </div>
    </div>
  );
};
