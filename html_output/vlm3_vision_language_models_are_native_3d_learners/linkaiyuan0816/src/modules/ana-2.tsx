import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 视觉：专家任务特定设计层层叠加（少文字） */
export const Ana2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 6;
      // 0–1.2 Enc → 1.2–2.6 Dec 分支 → 2.6–4.0 Loss 权重 → 4.0–6.0 增强叠层
      const phase = t < 1.2 ? 1 : t < 2.6 ? 2 : t < 4.0 ? 3 : 4;
      const wobble = Math.sin(t * 3) * 1.2;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // —— 输入缩略图 ——
      drawWindow(ctx, 10, 38, 36, 36, C.muted);

      // —— 主干 Enc ——
      const encY = 48 + (phase >= 1 ? wobble * 0.3 : 0);
      ctx.fillStyle = phase >= 1 ? '#fde8eb' : '#eef2f7';
      ctx.strokeStyle = phase >= 1 ? C.red : C.border;
      ctx.lineWidth = 1.8;
      roundRect(56, encY, 40, 20, 4);
      ctx.fill();
      ctx.stroke();
      // 简单「眼」图标代替文字
      ctx.fillStyle = phase >= 1 ? C.red : C.muted;
      ctx.beginPath();
      ctx.ellipse(76, encY + 10, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(76, encY + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 连线：输入 → Enc
      ctx.strokeStyle = phase >= 1 ? C.red : C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(46, 56);
      ctx.lineTo(56, encY + 10);
      ctx.stroke();

      // —— Dec 多头分叉 ——
      const heads = [
        { x: 128, y: 22, color: '#e11d48' },
        { x: 128, y: 52, color: C.red },
        { x: 128, y: 82, color: '#be123c' },
      ];
      if (phase >= 2) {
        heads.forEach((h, i) => {
          const appear = Math.min(1, (t - 1.2 - i * 0.25) / 0.35);
          if (appear <= 0) return;
          ctx.globalAlpha = appear;
          const hy = h.y + wobble * (i === 1 ? 0.4 : -0.3);
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(96, encY + 10);
          ctx.bezierCurveTo(110, encY + 10, 112, hy + 8, 120, hy + 8);
          ctx.stroke();
          // 解码器块：斜纹纹理暗示不同结构
          ctx.fillStyle = '#fff5f6';
          roundRect(120, hy, 28, 16, 3);
          ctx.fill();
          ctx.strokeRect(120, hy, 28, 16);
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 1;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.moveTo(124 + k * 7, hy + 3);
            ctx.lineTo(124 + k * 7 + 4, hy + 13);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        });
      }

      // —— Loss 多权重旋钮 ——
      if (phase >= 3) {
        const knobs = [
          { x: 170, y: 26, r: 7, w: 0.9 },
          { x: 170, y: 56, r: 10, w: 0.45 },
          { x: 170, y: 88, r: 6, w: 0.7 },
        ];
        knobs.forEach((k, i) => {
          const appear = Math.min(1, (t - 2.6 - i * 0.2) / 0.3);
          if (appear <= 0) return;
          ctx.globalAlpha = appear;
          // Dec → Loss
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(148, heads[i].y + 8);
          ctx.lineTo(k.x - k.r - 2, k.y);
          ctx.stroke();
          // 旋钮大小不同 = 权重需调平
          ctx.fillStyle = '#fde8eb';
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          const ang = -Math.PI / 2 + k.w * Math.PI * 1.6 + Math.sin(t * 2 + i) * 0.15;
          ctx.beginPath();
          ctx.moveTo(k.x, k.y);
          ctx.lineTo(k.x + Math.cos(ang) * (k.r - 2), k.y + Math.sin(ang) * (k.r - 2));
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      // —— 增强叠层：几何（旋转方）+ 光度（亮度弧）堆在顶端 ——
      if (phase >= 4) {
        const a = Math.min(1, (t - 4.0) / 0.5);
        ctx.globalAlpha = a;
        // 几何：倾斜小方块堆
        for (let i = 0; i < 3; i++) {
          const bx = 198 + i * 2;
          const by = 28 + i * 10 + Math.sin(t * 4 + i) * 1.5;
          ctx.save();
          ctx.translate(bx + 10, by + 8);
          ctx.rotate((-12 + i * 8) * Math.PI / 180);
          ctx.fillStyle = i % 2 ? '#fef3c7' : '#fee2e2';
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 1.4;
          ctx.fillRect(-9, -7, 18, 14);
          ctx.strokeRect(-9, -7, 18, 14);
          ctx.restore();
        }
        // 光度：亮度弧线叠在上方
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(216, 88, 6 + i * 5, -Math.PI * 0.85, -Math.PI * 0.15);
          ctx.stroke();
        }
        // 从 loss 区到增强堆的虚线
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(180, 56);
        ctx.lineTo(198, 56);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // 右侧复杂度「塔」高度条（无文字，红色越高越重）
      const fillH = phase === 1 ? 22 : phase === 2 ? 48 : phase === 3 ? 78 : 100;
      const barX = 232;
      const barY = 14;
      const barH = 100;
      ctx.fillStyle = '#eef2f7';
      roundRect(barX, barY, 8, barH, 3);
      ctx.fill();
      ctx.fillStyle = C.red;
      const rise = Math.min(fillH, barH);
      roundRect(barX, barY + barH - rise, 8, rise, 3);
      ctx.fill();

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
