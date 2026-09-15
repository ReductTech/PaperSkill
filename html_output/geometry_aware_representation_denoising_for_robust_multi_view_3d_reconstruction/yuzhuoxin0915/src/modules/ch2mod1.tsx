import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 2 章 Module 2.1：点击视角热点 → 特征表示 inset（混合视图，P5）
// 用真实多视角实景图替代几何图形，保留"点击视角"交互。
const W = 1080;
const H = 280;

const VIEWS = [
  { label: '视角 1', x: 150, y: 150, desc: '正面视角，贡献主体结构的几何信息。' },
  { label: '视角 2', x: 320, y: 110, desc: '侧面视角，补充深度方向的线索。' },
  { label: '视角 3', x: 480, y: 150, desc: '俯视视角，帮助对齐整体布局。' },
  { label: '视角 4', x: 610, y: 110, desc: '斜视角，提供纹理与边缘的互补信息。' },
];

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ view: 0 });
  const rafRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击不同视角，观察几何信息如何互补。', cls: '' });

  useEffect(() => {
    const img = new Image();
    img.src = './images/analogy_multiview.webp';
    img.onload = () => { imgRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { view: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 左：实景图（多视角场景）+ 视角热点
      const lx = 60, ly = 40, lw = 560, lh = 200;
      if (imgRef.current) {
        // 等比裁剪绘制实景图
        const iw = imgRef.current.width, ih = imgRef.current.height;
        const scale = Math.max(lw / iw, lh / ih);
        const sw = lw / scale, sh = lh / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        ctx.drawImage(imgRef.current, sx, sy, sw, sh, lx, ly, lw, lh);
      } else {
        ctx.fillStyle = '#b8c9a7';
        ctx.fillRect(lx, ly, lw, lh);
      }
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, ly, lw, lh);
      ctx.fillStyle = '#68778f';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('多视角场景（同一场景的不同拍摄角度）', lx + 10, ly + lh + 22);

      // 视角热点（叠加在实景图上）
      VIEWS.forEach((v, i) => {
        const active = s.view === i;
        ctx.beginPath();
        ctx.arc(v.x, v.y, active ? 18 : 14, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#27446e' : 'rgba(255,255,255,0.92)';
        ctx.fill();
        ctx.strokeStyle = active ? '#ffffff' : '#d7deea';
        ctx.lineWidth = active ? 3 : 2;
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#27446e';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v.label, v.x, v.y + 4);
        ctx.textAlign = 'left';
      });

      // 右：特征表示 inset
      const ix = 680, iy = 40, iw = 340, ih = 200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('特征表示 (V×N×C)', ix + 16, iy + 28);
      // 画特征网格（几何感知特征，随选中视角改变亮度/密度）
      const cols = 8, rows = 5;
      const cellW = (iw - 40) / cols, cellH = (ih - 60) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const brightness = 0.3 + 0.7 * Math.abs(Math.sin((r + c + s.view) * 0.9));
          ctx.fillStyle = `rgba(39, 68, 110, ${brightness})`;
          ctx.fillRect(ix + 20 + c * cellW + 2, iy + 44 + r * cellH + 2, cellW - 4, cellH - 4);
        }
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    for (let i = 0; i < VIEWS.length; i++) {
      const v = VIEWS[i];
      const dx = x - v.x, dy = y - v.y;
      if (dx * dx + dy * dy < 22 * 22) {
        stateRef.current.view = i;
        setFeedback({ text: v.desc, cls: 'good' });
        return;
      }
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        {VIEWS.map((v, i) => (
          <button
            key={i}
            className={`chip ${stateRef.current.view === i ? 'selected' : ''}`}
            onClick={() => { stateRef.current.view = i; setFeedback({ text: v.desc, cls: 'good' }); }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
