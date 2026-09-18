import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 闷蒸：左手先把粉层刮平再注水（水均匀穿过整层），右手不刮平直接注水（水沿通道直冲到底）。
const W = 560;
const H = 140;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const SUPPORT = '#92400e';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BEAN = '#6f4a2f';
const PAPER = '#efe7d8';

/** 手冲壶（与 §1 保持同一套画法）。返回壶嘴尖端坐标。 */
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

/** 单个对照面板：壶 → 水流 → 滤杯/粉层 → 分享壶。 */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  ox: number,
  leveled: boolean,
  t: number
): void {
  const CX = ox + 104;
  const TOP_Y = 56;
  const BOT_Y = 94;
  const acc = leveled ? GREEN : RED;

  // 滤杯 + 滤纸
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(CX - 34, TOP_Y + 3);
  ctx.lineTo(CX + 34, TOP_Y + 3);
  ctx.lineTo(CX + 18, BOT_Y - 2);
  ctx.lineTo(CX - 18, BOT_Y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SUPPORT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(CX - 40, TOP_Y);
  ctx.lineTo(CX + 40, TOP_Y);
  ctx.lineTo(CX + 22, BOT_Y);
  ctx.lineTo(CX - 22, BOT_Y);
  ctx.closePath();
  ctx.stroke();

  // 粉层：刮平 → 顶面齐平；不刮平 → 中间隆起、右侧被冲出通道
  ctx.fillStyle = BEAN;
  ctx.beginPath();
  ctx.moveTo(CX - 34, BOT_Y - 3);
  if (leveled) {
    ctx.lineTo(CX - 34, BOT_Y - 14);
    ctx.lineTo(CX + 34, BOT_Y - 14);
  } else {
    ctx.lineTo(CX - 34, BOT_Y - 12);
    ctx.lineTo(CX - 18, BOT_Y - 20);
    ctx.lineTo(CX + 4, BOT_Y - 23);
    ctx.lineTo(CX + 18, BOT_Y - 11);
    ctx.lineTo(CX + 34, BOT_Y - 16);
  }
  ctx.lineTo(CX + 34, BOT_Y - 3);
  ctx.closePath();
  ctx.fill();

  // 不刮平：通道（水直冲的路径）
  if (!leveled) {
    ctx.strokeStyle = 'rgba(196,63,82,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CX + 14, BOT_Y - 22);
    ctx.lineTo(CX + 20, BOT_Y + 4);
    ctx.stroke();
  }

  // 手冲壶（右上，壶嘴指向滤杯）
  const tip = drawKettle(ctx, ox + 186, 38, 16, -0.62, BLUE);

  // 水流：刮平 → 宽而稳；不刮平 → 细而快，直插通道
  const fall = ((t % 1) + 1) % 1;
  const endX = leveled ? CX + 2 : CX + 16;
  const endY = leveled ? BOT_Y - 14 : BOT_Y - 20;
  ctx.strokeStyle = acc;
  ctx.lineCap = 'round';
  ctx.lineWidth = leveled ? 5.5 : 3;
  ctx.beginPath();
  ctx.moveTo(tip.tipX, tip.tipY);
  ctx.quadraticCurveTo((tip.tipX + endX) / 2, tip.tipY + 6, endX, endY);
  ctx.stroke();

  // 落下的一滴
  const dropY = tip.tipY + (endY - tip.tipY) * fall;
  ctx.fillStyle = acc;
  ctx.beginPath();
  ctx.arc(endX, dropY, leveled ? 2.6 : 1.9, 0, Math.PI * 2);
  ctx.fill();

  // 分享壶 + 液面
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CX - 24, BOT_Y + 8);
  ctx.lineTo(CX + 24, BOT_Y + 8);
  ctx.lineTo(CX + 20, BOT_Y + 32);
  ctx.lineTo(CX - 20, BOT_Y + 32);
  ctx.closePath();
  ctx.stroke();

  const rise = leveled ? 0.25 + 0.7 * Math.min(1, fall * 1.3) : 0.25 + 0.32 * fall;
  ctx.fillStyle = leveled ? 'rgba(34,141,92,0.4)' : 'rgba(196,63,82,0.35)';
  const liquidH = 22 * rise;
  ctx.fillRect(CX - 20, BOT_Y + 30 - liquidH, 40, liquidH);

  // 面板标签
  ctx.fillStyle = acc;
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText(leveled ? '先刮平' : '不刮平', ox + 12, 20);
}

export const LevelAna: React.FC<WidgetProps> = () => {
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

    const render = (time: number) => {
      const t = (time % 2600) / 2600;
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

      drawPanel(ctx, 12, true, t);
      drawPanel(ctx, 288, false, t);

      // 中缝
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(280, 10);
      ctx.lineTo(280, 126);
      ctx.stroke();
      ctx.setLineDash([]);
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

  return <canvas id="cv-level-ana" ref={canvasRef} width={W} height={H} />;
};

export default LevelAna;
