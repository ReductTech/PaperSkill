import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 10 章类比卡：3D 重建的定性对比（560x230）
// 用论文 Figure 6（fig_pointcloud_compare.png）作为核心：
// 左列 Input Views 是退化多视角输入，右列 7 种方法重建的 3D 点云对比。
// GARD (Ours) 在结构完整性、细节保留、噪声抑制上均明显优于基线。
// 类比要点：GARD 不是"图像清晰器"，而是"3D 重建的鲁棒性提升器"——
// 即使输入严重退化，几何与位姿仍能稳定恢复。
const W = 560;
const H = 230;

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = './images/fig_pointcloud_compare.webp';
    img.onload = () => { imgRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // ============== 主图 ==============
      const dw = 480, dh = 140;
      const dx = (W - dw) / 2;
      const dy = 14;

      // 卡片底
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);

      const img = imgRef.current;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, dw, dh);
        ctx.clip();
        const iw = img.width, ih = img.height;
        const scale = Math.max(dw / iw, dh / ih);
        const sw = iw * scale, sh = ih * scale;
        const sx = dx + (dw - sw) / 2;
        const sy = dy + (dh - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#b0b8c4';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载 3D 重建对比图…', dx + dw / 2, dy + dh / 2);
        ctx.textAlign = 'left';
      }
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);

      // 高亮 GARD (Ours) 区域（右下角）—— 用一个红框标注
      const gradX = dx + dw * 0.86;
      const gradY = dy + dh * 0.62;
      const gradW = dw * 0.12;
      const gradH = dh * 0.32;
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gradX, gradY, gradW, gradH);
      // 红色三角小引线 + 标签
      ctx.fillStyle = '#c43f52';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('GARD (Ours)', gradX + gradW + 4, gradY + 12);
      ctx.fillText('— 最完整点云', gradX + gradW + 4, gradY + 26);

      // 底部说明
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('同样一堆模糊输入，谁能重建出更完整、更准确的 3D 几何', dx + dw / 2, dy + dh + 18);

      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText(
        'GARD 不是图像清晰器，而是 3D 重建鲁棒性的提升器——即使输入严重退化，位姿与点云仍稳定恢复。',
        dx + dw / 2,
        dy + dh + 36
      );
      ctx.textAlign = 'left';
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch10Ana;