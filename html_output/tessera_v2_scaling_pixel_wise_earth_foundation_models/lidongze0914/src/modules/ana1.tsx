import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比动画：一张固定规格的大底片在两只口径不同的镜筒之间来回尝试，
// 大的裁掉太多、小的塞不进去——单一规格之困。560×140，自动循环。

const W = 560;
const H = 140;

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const startAt = performance.now();

    const render = (time: number) => {
      const t = ((time - startAt) % 3200) / 3200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 28, W, 28);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 28);
      ctx.lineTo(W, H - 28);
      ctx.stroke();

      const tube = (x: number, r: number, label: string) => {
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, 76, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#21324a';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText(label, x - 27, 122);
      };
      tube(150, 46, '大镜筒');
      tube(424, 22, '小镜筒');

      const phase = t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
      const px = 150 + (424 - 150) * phase;
      const pw = 96;
      const ph = 64;
      ctx.fillStyle = 'rgba(39,68,110,0.18)';
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 3;
      ctx.fillRect(px - pw / 2, 76 - ph / 2, pw, ph);
      ctx.strokeRect(px - pw / 2, 76 - ph / 2, pw, ph);

      // 不匹配提示：靠大镜筒裁边（红色虚线角），靠小镜筒塞不进（红色叉）
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      if (phase < 0.5) {
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(150 - 46, 76 - 46, 92, 92);
        ctx.setLineDash([]);
      } else {
        ctx.beginPath();
        ctx.moveTo(px - 14, 76 - 14);
        ctx.lineTo(px + 14, 76 + 14);
        ctx.moveTo(px + 14, 76 - 14);
        ctx.lineTo(px - 14, 76 + 14);
        ctx.stroke();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana1;
