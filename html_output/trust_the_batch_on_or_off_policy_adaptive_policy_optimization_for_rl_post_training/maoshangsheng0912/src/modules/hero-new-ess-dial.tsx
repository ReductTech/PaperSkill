import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';

// HERO 右半：本文方案 —— 一只由 e_B 驱动的自适应表盘。
// 主体：单只表盘。动词：随 e_B 自动摆动。目标：指针自动指向新的梯度上限与 KL 系数。
// 语义色：绿 = 本文方法。
const W = 560;
const H = 140;

export function HeroNewEssDial() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // e_B 在 [0.25, 0.95] 间缓慢扫描
      const phase = (Math.sin(t * 0.018 - Math.PI / 2) + 1) / 2;
      const eB = lerp(0.25, 0.95, easeInOutQuad(phase));

      const cx = 130;
      const cy = 64;
      const r = 46;

      // 底盘
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f8f0';
      ctx.fill();
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 进度弧（e_B 占比）
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * eB);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,141,92,0.18)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 指针
      const ang = Math.PI * 0.75 + Math.PI * 1.5 * eB;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * (r - 10), cy + Math.sin(ang) * (r - 10));
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#228d5c';
      ctx.fill();

      // 中央读数 e_B
      ctx.fillStyle = '#228d5c';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('e_B', cx, cy + 30);
      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.fillText(eB.toFixed(2), cx, cy + 46);

      // 右侧：由 e_B 推出的两个读数
      const capColor = '#228d5c';
      const klColor = '#7c3aed';

      // 梯度上限 min{rho, e_B}
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('梯度权重上限  min{ρ, e_B}', 232, 44);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(232, 52, 300, 14, 7) : ctx.rect(232, 52, 300, 14);
      ctx.fillStyle = '#eef2e8';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(232, 52, 300 * eB, 14, 7) : ctx.rect(232, 52, 300 * eB, 14);
      ctx.fillStyle = capColor;
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText(eB.toFixed(2), 542, 44);

      // KL 正则系数 1 - e_B
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('KL 正则系数  (1 - e_B)', 232, 96);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(232, 104, 300, 14, 7) : ctx.rect(232, 104, 300, 14);
      ctx.fillStyle = '#eef2e8';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(232, 104, 300 * (1 - eB), 14, 7) : ctx.rect(232, 104, 300 * (1 - eB), 14);
      ctx.fillStyle = klColor;
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText((1 - eB).toFixed(2), 542, 96);

      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('一个自测量同时定两件事 · 此消彼长', 232, 132);
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

  return <canvas ref={ref} id="cv-hero-new" width={W} height={H} />;
}
