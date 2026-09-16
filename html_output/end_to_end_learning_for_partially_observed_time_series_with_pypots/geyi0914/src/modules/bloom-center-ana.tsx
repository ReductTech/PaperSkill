import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 挖小坑：细水流先在粉层中央挖出一个小坑并注满它，让中心先浸透，再向外渗开。
const W = 560;
const H = 140;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const SUPPORT = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const BEAN = '#6f4a2f';
const PAPER = '#efe7d8';
const WELL = '#4a2f1c';

/** 手冲壶（与 §1、§3 同一套画法）。返回壶嘴尖端坐标。 */
function drawKettle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tilt: number,
  color: string
): { tipX: number; tipY: number } {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.62, r * 0.3, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.28);
  ctx.quadraticCurveTo(-r * 1.5, -r * 0.62, -r * 2.05, -r * 1.0);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, r * 0.15);
  ctx.beginPath();
  ctx.arc(r * 0.88, -r * 0.04, r * 0.52, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.restore();

  const lx = -r * 2.05;
  const ly = -r * 1.0;
  return {
    tipX: cx + lx * Math.cos(tilt) - ly * Math.sin(tilt),
    tipY: cy + lx * Math.sin(tilt) + ly * Math.cos(tilt),
  };
}

export const BloomCenterAna: React.FC<WidgetProps> = () => {
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

    const CX = 252;
    const TOP_Y = 50;
    const BOT_Y = 96;

    const render = (time: number) => {
      const t = (time % 3600) / 3600;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 130, W, 10);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.lineTo(W, 130);
      ctx.stroke();

      // 滤杯 + 滤纸
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.moveTo(CX - 58, TOP_Y + 3);
      ctx.lineTo(CX + 58, TOP_Y + 3);
      ctx.lineTo(CX + 30, BOT_Y - 2);
      ctx.lineTo(CX - 30, BOT_Y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = SUPPORT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CX - 66, TOP_Y);
      ctx.lineTo(CX + 66, TOP_Y);
      ctx.lineTo(CX + 36, BOT_Y);
      ctx.lineTo(CX - 36, BOT_Y);
      ctx.closePath();
      ctx.stroke();

      // 分享壶
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CX - 40, BOT_Y + 8);
      ctx.lineTo(CX + 40, BOT_Y + 8);
      ctx.lineTo(CX + 34, BOT_Y + 32);
      ctx.lineTo(CX - 34, BOT_Y + 32);
      ctx.closePath();
      ctx.stroke();

      // 粉层：中央被水流挖出一个坑，坑随时间加深
      const dig = Math.min(1, t / 0.4);
      const wellDepth = 4 + dig * 11;
      const wellHalf = 16 + dig * 5;
      ctx.fillStyle = BEAN;
      ctx.beginPath();
      ctx.moveTo(CX - 58, BOT_Y - 4);
      ctx.lineTo(CX - 58, BOT_Y - 17);
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const gx = CX - 58 + u * 116;
        const d = Math.abs(gx - CX);
        const dip = d < wellHalf ? wellDepth * (1 - d / wellHalf) : 0;
        ctx.lineTo(gx, BOT_Y - 17 + dip);
      }
      ctx.lineTo(CX + 58, BOT_Y - 4);
      ctx.closePath();
      ctx.fill();

      // 颗粒纹理
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      for (let i = 0; i < 26; i++) {
        const u = ((i * 41) % 100) / 100;
        const d = ((i * 67) % 9) / 9;
        ctx.fillRect(CX - 56 + u * 112, BOT_Y - 16 + d * 8, 1.5, 1.5);
      }

      // 坑：先被水注满，再向外渗开
      const fill = Math.min(1, Math.max(0, (t - 0.25) / 0.45));
      const waterH = wellDepth * 0.85 * fill;
      ctx.fillStyle = 'rgba(34,141,92,0.55)';
      ctx.beginPath();
      ctx.moveTo(CX - wellHalf + 2, BOT_Y - 17 + wellDepth);
      ctx.lineTo(CX - wellHalf + 2, BOT_Y - 17 + wellDepth - waterH);
      ctx.lineTo(CX + wellHalf - 2, BOT_Y - 17 + wellDepth - waterH);
      ctx.lineTo(CX + wellHalf - 2, BOT_Y - 17 + wellDepth);
      ctx.closePath();
      ctx.fill();

      // 浸透圈：从中心向外扩
      const spread = Math.max(0, fill - 0.5) / 0.5;
      if (spread > 0) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(CX, BOT_Y - 14, 12 + spread * 46, 3.5 + spread * 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 手冲壶：壶嘴对准坑心，细水流
      const tip = drawKettle(ctx, 402, 40, 17, -0.58, BLUE);
      ctx.strokeStyle = GREEN;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(tip.tipX, tip.tipY);
      ctx.quadraticCurveTo((tip.tipX + CX) / 2, tip.tipY + 10, CX, BOT_Y - 17 + wellDepth - waterH + 2);
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('先挖个小坑', 20, 24);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-bloom-center-ana" ref={canvasRef} width={W} height={H} />;
};

export default BloomCenterAna;
