import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 6 章类比卡：同一张郁金香照片的显影三段（560x160）
// 用 image-to-image AI 生成的三张图（develop_tulip_t1/t2/t3.png），场景一致：
// - t1 早期：郁金香几乎不可见（白色虚影）
// - t2 中期：郁金香形状可辨，灰度柔和
// - t3 最终：完全显影，黑白对比，细节全开
const W = 560;
const H = 160;

const STAGES = [
  {
    name: '刚进入显影液',
    img: './images/develop_tulip_t1.webp',
    desc: '朦胧虚影',
    cls: 't1',
  },
  {
    name: '逐渐浮现',
    img: './images/develop_tulip_t2.webp',
    desc: '灰度柔和',
    cls: 't2',
  },
  {
    name: '最终清晰',
    img: './images/develop_tulip_t3.webp',
    desc: '细节全开',
    cls: 't3',
  },
];

const COLORS: Record<string, string> = {
  t1: '#c43f52',
  t2: '#f07e47',
  t3: '#228d5c',
};

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imgRefs = useRef<Array<HTMLImageElement | null>>([null, null, null]);

  useEffect(() => {
    STAGES.forEach((s, i) => {
      const img = new Image();
      img.src = s.img;
      img.onload = () => {
        imgRefs.current[i] = img;
      };
    });
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

      // 三张图并排
      const cardW = 168, cardH = 100;
      const gap = 12;
      const totalW = cardW * 3 + gap * 2;
      const startX = (W - totalW) / 2;
      const py = 14;

      // 阶段箭头（顶部细线）
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX + cardW / 2, py + cardH + 8);
      ctx.lineTo(startX + cardW + gap + cardW / 2, py + cardH + 8);
      ctx.moveTo(startX + cardW + gap + cardW / 2, py + cardH + 8);
      ctx.lineTo(startX + 2 * (cardW + gap) + cardW / 2, py + cardH + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      STAGES.forEach((s, i) => {
        const px = startX + i * (cardW + gap);
        const color = COLORS[s.cls];

        // 卡片底
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, py, cardW, cardH);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, cardW, cardH);

        const img = imgRefs.current[i];
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(px, py, cardW, cardH);
          ctx.clip();
          const iw = img.width, ih = img.height;
          const scale = Math.max(cardW / iw, cardH / ih);
          const sw = iw * scale, sh = ih * scale;
          const sx = px + (cardW - sw) / 2;
          const sy = py + (cardH - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh);
          ctx.restore();
        }
        // 描边
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, cardW, cardH);

        // 阶段序号小圆
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px + 14, py + 14, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`t${i + 1}`, px + 14, py + 18);
        ctx.textAlign = 'left';

        // 卡片下方文字
        ctx.fillStyle = color;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, px + cardW / 2, py + cardH + 22);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#68778f';
        ctx.fillText(s.desc, px + cardW / 2, py + cardH + 38);
        ctx.textAlign = 'left';
      });
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

export default Ch6Ana;