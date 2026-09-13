import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  field, clay, hand, ring, seal, trace, gauge, label,
  GUIDE, OK, BAD, EMPH, MUTED, AUX, WHEEL, TOOL, INK,
} from './clayKit';

// 生活类比动画：所有章节共用同一间陶艺工作台（同一泥团、同一双手、
// 同一转轮与中心环），只更换该章的一个简单动作。画布固定 560x140，
// 自动循环播放、离屏暂停，不画重播说明。
const W = 560;
const H = 140;
const GY = 96;

function scene(ctx: CanvasRenderingContext2D, chapterId: string, t: number) {
  field(ctx, W, H);
  const cx = W / 2;
  const idx = Number(chapterId.replace('chap-', '')) || 1;
  const ph = Math.sin(t * Math.PI * 2);

  if (idx === 1) {
    ring(ctx, cx, GY, 30, GUIDE, true);
    const px = cx + 56 * ph;
    clay(ctx, px, GY, 26, 0.2 + 0.45 * Math.abs(ph), t * 6.3, WHEEL);
    hand(ctx, px + 44, GY - 6, 0.9, 1);
    if (Math.abs(ph) < 0.2) seal(ctx, cx, GY, true);
    return;
  }
  if (idx === 2) {
    const k = Math.floor(t * 3) % 3;
    const fr = t * 3 - Math.floor(t * 3);
    [0, 1, 2].forEach((i) => {
      const x = 150 + i * 130;
      const lift = i === k ? 16 * Math.sin(Math.PI * fr) : 0;
      if (i === k) ring(ctx, x, GY - lift, 30, EMPH, false);
      clay(ctx, x, GY - lift, 20, 0.18, i * 2 + t * 5, i === k ? WHEEL : '#cfd8c2');
    });
    label(ctx, '选泥料', 20, 26, MUTED);
    return;
  }
  if (idx === 3) {
    ring(ctx, cx, GY, 30, GUIDE, true);
    clay(ctx, cx, GY, 26, 0.06, 0, WHEEL);
    const down = Math.max(0, (t - 0.55) / 0.45);
    ctx.save();
    ctx.strokeStyle = TOOL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 24);
    ctx.lineTo(cx, 24 + 42 * down);
    ctx.stroke();
    ctx.restore();
    if (t > 0.78) seal(ctx, cx, GY, true);
    label(ctx, '最后落款', cx - 26, 22, MUTED);
    return;
  }
  if (idx === 4) {
    const x0 = 120;
    const x1 = 430;
    ring(ctx, x1, GY, 30, GUIDE, true);
    const px = x0 + (x1 - x0 - 34) * t;
    trace(ctx, [[x0, GY - 44], [x1 - 34, GY - 44]], GUIDE, true);
    clay(ctx, px, GY, 24, 0.14, t * 4, WHEEL);
    hand(ctx, px + 40, GY - 8, 0.85, 1);
    label(ctx, '走直线', 20, 26, MUTED);
    return;
  }
  if (idx === 5) {
    const w = 70 + 150 * Math.abs(ph);
    gauge(ctx, cx - w / 2, 46, w, TOOL);
    clay(ctx, cx, GY, w / 2 + 12, 0.1, t * 5, WHEEL);
    hand(ctx, cx + w / 2 + 40, GY - 10, 0.8, 1);
    label(ctx, '按样板', 20, 26, MUTED);
    return;
  }
  if (idx === 6) {
    const step = Math.floor(t * 8);
    for (let i = 0; i <= 8; i++) {
      ctx.save();
      ctx.strokeStyle = i <= step ? GUIDE : '#cfd8c2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 110 + i * 27, 122);
      ctx.lineTo(cx - 110 + i * 27, 132);
      ctx.stroke();
      ctx.restore();
    }
    clay(ctx, cx, GY, 26, 0.55 * (1 - step / 8), t * 8, WHEEL);
    label(ctx, '分步进刀', cx - 26, 24, MUTED);
    return;
  }
  if (idx === 7) {
    const flip = t < 0.5;
    hand(ctx, flip ? 210 : 380, GY - 8, 0.9, 1);
    clay(ctx, 210, GY, 26, flip ? 0.35 : 0.06, t * 5, WHEEL);
    ctx.save();
    ctx.strokeStyle = flip ? TOOL : OK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(380, GY - 34);
    ctx.lineTo(380, GY - 4);
    ctx.stroke();
    ctx.restore();
    if (!flip) seal(ctx, 380, GY - 4, true);
    label(ctx, flip ? '拉坯' : '落款', 20, 26, MUTED);
    return;
  }
  if (idx === 8) {
    const dec = ph > 0;
    ring(ctx, cx, GY, 34, dec ? EMPH : GUIDE, true);
    clay(ctx, cx, GY, 25, 0.12, t * 4, WHEEL);
    hand(ctx, cx + 46, GY - 8, dec ? 0.75 : 0.95, 1);
    label(ctx, dec ? '解码' : '去噪', cx - 16, 24, dec ? EMPH : GUIDE);
    return;
  }
  if (idx === 9) {
    const sizes = [16, 22, 30];
    const k = Math.floor(t * 3) % 3;
    sizes.forEach((r, i) => {
      const x = 170 + i * 120;
      clay(ctx, x, GY, r, 0.16, i + t * 4, i === k ? WHEEL : '#cfd8c2');
      if (i === k) ring(ctx, x, GY, r + 12, EMPH, false);
    });
    label(ctx, '选配方', 20, 26, MUTED);
    return;
  }
  const done = t > 0.85;
  trace(ctx, [[70, 74], [500, 74]], '#cfd8c2', true);
  trace(ctx, [[70, 104], [500, 104]], '#cfd8c2', true);
  const p1 = Math.min(1, t * 1.25);
  const p2 = Math.min(1, t * 0.8);
  clay(ctx, 70 + 400 * p1, 74, 16, 0.14, t * 5, OK);
  clay(ctx, 70 + 400 * p2, 104, 16, 0.3, t * 5 + 1, BAD);
  if (done) label(ctx, '更少步数', 452, 24, OK);
  else label(ctx, '比试中', 22, 26, MUTED);
}

export const ClayAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
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
    const t0 = performance.now();
    const tick = (now: number) => {
      scene(ctx, chapterId, ((now - t0) / 3000) % 1);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-ana`} ref={canvasRef} width={W} height={H} />;
};

export default ClayAnalogy;
