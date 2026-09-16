import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
export const Mod9_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [thresh, setThresh] = useState(0.08);
  const sRef = useRef({ thresh: 0.08, dragging: false });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      const tau = sRef.current.thresh;
      clearScene(ctx, W, H);
      // Original stroke
      drawPaper(ctx, 40, 30, 180, 220);
      drawInkStroke(ctx, [{x:70,y:70},{x:190,y:70}], 5, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:130,y:70},{x:130,y:220}], 5, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:130,y:130},{x:80,y:220}], 4, COLORS.ink, 0.85);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('原始笔画', 80, 268);
      // Sobel edge view
      ctx.fillStyle = '#faf6ec'; ctx.fillRect(260, 30, 200, 220);
      ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 1; ctx.strokeRect(260, 30, 200, 220);
      // Draw edges based on threshold
      const edgeAlpha = clamp(1 - tau * 8, 0.2, 1);
      ctx.strokeStyle = `rgba(45, 45, 42, ${edgeAlpha})`;
      ctx.lineWidth = 2;
      // Horizontal edge
      ctx.strokeRect(290, 67, 120, 6);
      // Vertical edge
      ctx.strokeRect(357, 67, 6, 153);
      // Diagonal edges
      ctx.beginPath(); ctx.moveTo(357, 127); ctx.lineTo(307, 217); ctx.stroke();
      ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
      ctx.fillText('Sobel 边缘图 G(I)', 290, 268);
      // Soft edge map E(I) = sigmoid((G-μ)/τ)
      ctx.fillStyle = '#f5f0e8'; ctx.fillRect(500, 30, 200, 220);
      ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 1; ctx.strokeRect(500, 30, 200, 220);
      const softAlpha = clamp(tau * 12, 0.1, 1);
      ctx.strokeStyle = `rgba(194, 106, 78, ${0.3 + softAlpha * 0.5})`;
      ctx.lineWidth = 3 + tau * 20;
      ctx.strokeRect(530, 65, 120, 10);
      ctx.strokeRect(595, 65, 10, 155);
      ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
      ctx.fillText('软边缘 E(I) σ((G-μ)/τ)', 510, 268);
      // Formula and controls
      ctx.fillStyle = COLORS.ink; ctx.font = '14px serif';
      ctx.fillText('G(I) = √((Kₓ*f(I))² + (Kᵧ*f(I))²)', 740, 60);
      ctx.fillText('E(I) = σ((G(I) - μ) / τ)', 740, 85);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('τ (温度参数): ' + tau.toFixed(2), 740, 115);
      ctx.fillText('论文默认 τ = 0.08', 740, 135);
      ctx.fillText('β (距离变换权重) = 0.25', 740, 155);
      ctx.fillText('α (结构损失权重) = 0.5', 740, 175);
      ctx.fillStyle = tau < 0.05 ? COLORS.red : tau > 0.15 ? COLORS.orange : COLORS.green;
      ctx.font = '12px sans-serif';
      ctx.fillText(tau < 0.05 ? 'τ过小：边缘图过锐，噪声敏感' : tau > 0.15 ? 'τ过大：边缘模糊，结构丢失' : 'τ在推荐区间：边缘清晰且鲁棒', 740, 200);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 1000; sRef.current.thresh = v; setThresh(v);
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><label>Sobel 软边缘温度 τ <span className="val">{thresh.toFixed(3)}</span></label>
      <input type="range" min={1} max={300} value={Math.round(thresh * 1000)} onChange={onChange} /></div>
    <div className="feedback" dangerouslySetInnerHTML={{ __html: '调整 τ 观察软边缘图 E(I) 的变化。结构感知损失 L<sub>struct</sub> 匹配重建图像与原图的边缘和距离变换，使笔画轮廓更清晰。' }} /></div>);
};
export default Mod9_1;
