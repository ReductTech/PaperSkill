import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, lerp } from '../lib/canvasKit';

// HERO 左半：传统方案 —— 两个互不相干的手动旋钮（固定裁剪 + 固定 KL）。
// 主体：两只旋钮。动词：被手动扭转。目标：指示各自固定的读数。
// 语义色：红 = 传统方法/易失衡状态。
const W = 560;
const H = 140;

export function HeroOldStaticKnobs() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const drawKnob = (
      cx: number,
      cy: number,
      r: number,
      angle: number,
      color: string,
      label: string,
      value: string
    ) => {
      // 盘面
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f8f0';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#b8c9a7';
      ctx.stroke();

      // 刻度弧
      ctx.beginPath();
      ctx.arc(cx, cy, r - 6, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 指针
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * (r - 10), cy + Math.sin(angle) * (r - 10));
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.fillStyle = '#21324a';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy + r + 18);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(value, cx, cy + r + 33);
    };

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const wobble = Math.sin(t * 0.045) * 0.5 + 0.5;
      const a1 = lerp(Math.PI * 0.8, Math.PI * 2.2, wobble) * 0.5 + Math.PI * 0.75;
      const a2 = Math.PI * 1.5 + Math.sin(t * 0.03) * 0.5;

      drawKnob(180, 62, 38, a1, '#c43f52', '裁剪阈值', '固定 0.2');
      drawKnob(380, 62, 38, a2, '#c43f52', 'KL 系数', '固定值');

      // 中间断裂的连线 —— 两个旋钮互不通信
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(226, 62);
      ctx.lineTo(334, 62);
      ctx.strokeStyle = '#c9a0a8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#c43f52';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✕', 280, 67);

      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('两个旋钮各自固定 · 批次成分一变就失配', 280, 128);
    };

    const tick = () => {
      tRef.current += 1;
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      unobserve();
      stop();
    };
  }, []);

  return <canvas ref={ref} id="cv-hero-old" width={W} height={H} />;
}
