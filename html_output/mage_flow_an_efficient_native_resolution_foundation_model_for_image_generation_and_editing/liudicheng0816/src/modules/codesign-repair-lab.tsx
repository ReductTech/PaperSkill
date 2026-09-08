import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 680, H = 300;

export const CodesignRepairLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [optimized, setOptimized] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.maxWidth = '100%'; canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = optimized ? '#e3f3e9' : '#fbecec'; ctx.fillRect(24, 18, W - 48, 40);
    ctx.fillStyle = optimized ? '#5db872' : '#c64545'; ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.fillText(optimized ? '轻量分词器 + 原生打包 + 融合执行' : '仅保持紧凑骨干，其余链路仍重', 40, 44);
    ctx.fillStyle = '#faf9f5'; ctx.strokeStyle = optimized ? '#5db872' : '#c64545'; ctx.lineWidth = 3; ctx.fillRect(42, 82, 300, 170); ctx.strokeRect(42, 82, 300, 170);
    ctx.fillStyle = '#cc785c'; ctx.fillRect(68, 110, 120, 15); ctx.fillStyle = '#e6dfd8'; ctx.fillRect(68, 142, 220, 10); ctx.fillRect(68, 163, 176, 10);
    const names = ['分词器', '生成骨干', '内存流量']; const values = optimized ? [30, 48, 27] : [88, 48, 94];
    names.forEach((name, i) => { const y = 100 + i * 60; ctx.fillStyle = '#e6dfd8'; ctx.fillRect(390, y, 230, 18); ctx.fillStyle = optimized && i !== 1 ? '#5db872' : i === 1 ? '#cc785c' : '#c64545'; ctx.fillRect(390, y, values[i] * 2.3, 18); ctx.fillStyle = '#252523'; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(name, 390, y - 7); });
    ctx.fillStyle = '#6c6a64'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('概念组合，不是各组件加和后的论文数值', 390, 278);
    canvas.classList.add('is-ready');
  }, [optimized]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} aria-label={optimized ? '协同设计后，分词器和内存流量概念条缩短，骨干保持紧凑' : '只缩骨干时，分词器和内存流量概念条仍然较长'} />
    <div className="ctrl"><button type="button" className="chip" aria-pressed={optimized} onClick={() => setOptimized((v) => !v)}>{optimized ? '撤销协同设计' : '应用协同设计'}</button></div>
    <div className={`feedback ${optimized ? 'good' : 'bad'}`} aria-live="polite">{optimized ? '轻量分词器、原生打包与融合执行共同改变了效率边界。' : '只缩骨干无法消除其余链路的成本。'}</div>
  </div>;
};

export default CodesignRepairLab;
