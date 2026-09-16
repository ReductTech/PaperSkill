import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeInOutQuad,
  easeOutBounce,
  lerpColor,
} from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比动画：长布带两端被拿到一起，别针弹跳固定首尾，中间歪斜的缝线
// 被整体拉直，最后整体淡出复位，首尾无缝，自动循环。

const W = 560;
const H = 140;
const CYCLE = 4.2;
const CX = 280;
const CY = 76;
const RX = 168;
const RY = 44;

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 20; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 20; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const t0 = performance.now();

    const render = (t: number) => {
      const ph = (t / CYCLE) % 1;
      const converge = ph < 0.06 ? 0 : easeInOutQuad(clamp((ph - 0.06) / 0.38, 0, 1));
      const gap = lerp(1.5, 0, converge);
      const straighten = easeInOutQuad(clamp((ph - 0.52) / 0.28, 0, 1));
      const wav = lerp(1, 0, straighten);
      const fade = clamp(Math.min(ph / 0.06, (1 - ph) / 0.08), 0, 1);
      const pop = easeOutBounce(clamp((converge - 0.86) / 0.14, 0, 1));

      drawBackdrop(ctx);

      const a0 = -Math.PI / 2 + gap / 2 + 0.05;
      const a1 = -Math.PI / 2 + Math.PI * 2 - gap / 2 - 0.05;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineCap = 'round';

      // 布带
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, a0, a1);
      ctx.stroke();
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, a0, a1);
      ctx.stroke();

      // 布面纹理：沿布带的虚线暗示，极低对比度
      ctx.save();
      ctx.globalAlpha = fade * 0.15;
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY - 8, 0, a0, a1);
      ctx.stroke();
      ctx.restore();

      // 缝线：起先歪斜，首尾接上后被整体拉直
      ctx.strokeStyle = lerpColor('#c43f52', '#228d5c', 1 - wav);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const steps = 150;
      for (let i = 0; i <= steps; i++) {
        const a = lerp(a0, a1, i / steps);
        const wob = wav * 9 * Math.sin(a * 5 + t * 3);
        const x = CX + (RX + wob * 0.35) * Math.cos(a);
        const y = CY + (RY + wob) * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 沿线迹的小斜针脚，透明度略有变化
      ctx.save();
      ctx.lineWidth = 1.5;
      for (let i = 6; i < steps; i += 12) {
        const a = lerp(a0, a1, i / steps);
        const wob = wav * 9 * Math.sin(a * 5 + t * 3);
        const x = CX + (RX + wob * 0.35) * Math.cos(a);
        const y = CY + (RY + wob) * Math.sin(a);
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        ctx.globalAlpha = fade * (0.45 + 0.3 * Math.abs(Math.sin(i * 1.7)));
        ctx.beginPath();
        ctx.moveTo(x - nx * 4, y - ny * 4);
        ctx.lineTo(x + nx * 4, y + ny * 4);
        ctx.stroke();
      }
      ctx.restore();

      // 两端端头
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      const ends = [a0, a1];
      for (let k = 0; k < ends.length; k++) {
        const a = ends[k];
        const x = CX + RX * Math.cos(a);
        const y = CY + RY * Math.sin(a);
        const nx = Math.cos(a) * 11;
        const ny = Math.sin(a) * 11;
        ctx.beginPath();
        ctx.moveTo(x - nx, y - ny);
        ctx.lineTo(x + nx, y + ny);
        ctx.stroke();
      }

      // 首尾相接处别针：弹跳入场，之后带轻微脉动
      if (pop > 0.01) {
        const px = CX;
        const py = CY - RY;
        const s = pop * (1 + 0.04 * Math.sin(t * 5));
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(s, s);
        ctx.globalAlpha = fade * clamp(pop * 2, 0, 1);
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-9, -9);
        ctx.lineTo(9, 9);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('缝线', 52, 26);
      if (pop > 0.5) {
        ctx.save();
        ctx.globalAlpha = clamp((pop - 0.5) * 2, 0, 1) * fade;
        ctx.fillText('接合', CX - 16, CY - RY - 12);
        ctx.restore();
      }
    };

    const tick = () => {
      render((performance.now() - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default Ana8;
