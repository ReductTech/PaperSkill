import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Shared life-based analogy animation (music practice theme, 560x140).
// Scene is keyed to the NEW chapter order (paper major-section order):
//  1 引言 | 2 编码器 | 3 跨层特征 | 4 DeepStack | 5 时间感知
//  6 数据管道 | 7 预训练 | 8 后训练 | 9 时间对齐 | 10 结果
const W = 560;
const H = 140;

function scene(chapterId: string, ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  // ground
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, H - 20);
  ctx.lineTo(W - 20, H - 20);
  ctx.stroke();

  const phase = (t % 3000) / 3000;
  const p = easeInOutQuad(Math.min(1, phase * 1.3));

  const n = Number(chapterId.replace('chap-', '')) || 1;
  ctx.font = '13px "Segoe UI", sans-serif';

  if (n === 1) {
    // strum one string; harmonics fade to a thin line (problem)
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 40; x < 360; x += 4) {
      const amp = (1 - p) * 22 * Math.sin((x / 360) * Math.PI * 6 + t / 200);
      ctx.lineTo(x, 70 + amp);
    }
    ctx.stroke();
    ctx.fillStyle = '#c43f52';
    ctx.fillRect(400, 68, 120 * (0.3 + 0.7 * p), 5);
    ctx.fillStyle = '#21324a';
    ctx.fillText('细节流失', 400, 55);
  } else if (n === 2) {
    // continuous sound wave + a sweep that leaves discrete marks (encoder)
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 60; x < 480; x += 4) {
      ctx.lineTo(x, 80 + 26 * Math.sin((x / 480) * Math.PI * 8));
    }
    ctx.stroke();
    const sweepX = 60 + p * 420;
    for (let x = 60; x <= sweepX; x += 35) {
      const y = 80 + 26 * Math.sin((x / 480) * Math.PI * 8);
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sweepX, 42);
    ctx.lineTo(sweepX, 118);
    ctx.stroke();
    ctx.fillStyle = '#21324a';
    ctx.fillText('离散刻度', 60, 30);
  } else if (n === 3) {
    // multiple harmonics vs single (cross-layer insight)
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.3 + 0.6 * Math.min(1, p - i * 0.12);
      ctx.strokeStyle = i === 0 ? '#27446e' : '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 60; x < 480; x += 5) {
        ctx.lineTo(x, 70 + (i - 1.5) * 14 * Math.sin((x / 480) * Math.PI * 4 + t / 300));
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (n === 4) {
    // multiple voices stacking (DeepStack implementation)
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.35 + 0.55 * Math.min(1, p - i * 0.15);
      ctx.fillStyle = i === 0 ? '#27446e' : '#7c3aed';
      ctx.fillRect(160, 90 - i * 16, 220, 9);
    }
    ctx.globalAlpha = 1;
  } else if (n === 5) {
    // detailed metronome (inverted pendulum, pivot at the bottom) stamps marks
    const cx = 100;
    const topY = 38;
    const baseY = 112;
    // body (trapezoid): narrower top, wider bottom
    ctx.fillStyle = '#f3ede1';
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 15, topY);
    ctx.lineTo(cx + 15, topY);
    ctx.lineTo(cx + 27, baseY);
    ctx.lineTo(cx - 27, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // scale line + ticks (behind the pendulum)
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, topY + 8);
    ctx.lineTo(cx, baseY - 10);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const yy = topY + 12 + i * 12;
      ctx.beginPath();
      ctx.moveTo(cx - 6, yy);
      ctx.lineTo(cx + 6, yy);
      ctx.stroke();
    }
    // inverted pendulum: pivot at the BOTTOM, rod extends upward
    const pivotX = cx;
    const pivotY = baseY - 6;
    const angle = Math.sin(t / 400) * 0.45;
    const rodLen = 56;
    const rx = pivotX + Math.sin(angle) * rodLen;
    const ry = pivotY - Math.cos(angle) * rodLen;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    // pivot dot at the bottom
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // base
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx - 30, baseY, 60, 8);

    // timeline with marks landing at regular intervals
    ctx.strokeStyle = '#b8c9a7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(170, 92);
    ctx.lineTo(500, 92);
    ctx.stroke();
    const marks = Math.floor(p * 5);
    for (let k = 0; k < marks; k++) {
      const mx = 190 + k * 68;
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(mx, 76, 4, 32);
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText((k + 1) * 2 + 's', mx - 6, 68);
    }
    ctx.fillStyle = '#21324a';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('每 2 秒一格', 170, 122);
  } else if (n === 6) {
    // three sound layers (voice / music / ambience) converge into one mixed stream
    const colors = ['#27446e', '#7c3aed', '#f07e47'];
    const labels = ['语音', '音乐', '环境声'];
    const x0 = 60;
    const x1 = W - 50;
    const mergeX = 320;
    const cy = 72;
    const spread = 30;
    const bundle = 3.5;
    // three converging streams
    for (let i = 0; i < 3; i++) {
      const yStart = cy + (i - 1) * spread;
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 3) {
        const t = Math.min(1, Math.max(0, (x - x0) / (mergeX - x0)));
        const y = yStart + (cy - yStart) * t + (i - 1) * bundle * t + (1 - t) * 7 * Math.sin(x / 22 + i);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      // source labels
      ctx.fillStyle = colors[i];
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(labels[i], x0 - 2, yStart - 9);
    }
    // merge marker
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.arc(mergeX, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('统一描述', mergeX + 40, cy - 14);
  } else if (n === 7) {
    // three practice piles by ratio (pretraining mixture)
    const a = 30, b = 40, c = 30;
    ctx.fillStyle = '#27446e';
    ctx.fillRect(120, 100 - a, 40, a);
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(190, 100 - b, 40, b);
    ctx.fillStyle = '#f07e47';
    ctx.fillRect(260, 100 - c, 40, c);
  } else if (n === 8) {
    // keys pressed one by one (post-training practice)
    const pressed = Math.floor(p * 6);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k < pressed ? '#27446e' : '#d7deea';
      ctx.fillRect(80 + k * 60, 60, 44, 50);
    }
  } else if (n === 9) {
    // note block slides onto beat marks (time alignment + inference)
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(80 + k * 70, 90, 4, 16);
    }
    ctx.fillStyle = '#27446e';
    const nx = 80 + p * 350;
    ctx.fillRect(nx, 60, 26, 26);
  } else {
    // two takes racing (results)
    ctx.fillStyle = '#c43f52';
    ctx.fillRect(80, 55, 120 + p * 200, 12);
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(80, 80, 120 + Math.min(1, p * 1.25) * 240, 12);
    ctx.fillStyle = '#21324a';
    ctx.fillText('基线', 40, 65);
    ctx.fillText('MOSS-Audio', 40, 90);
  }
}

export const MusicAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const chapRef = useRef(chapterId);
  chapRef.current = chapterId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = () => {
      scene(chapRef.current, ctx, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startFn = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startFn, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-ana-${chapterId}`} ref={canvasRef} width={W} height={H} />;
};

export default MusicAnalogy;
